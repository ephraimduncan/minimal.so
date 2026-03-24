import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { CORSPlugin } from "@orpc/server/plugins";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { onError } from "@orpc/server";
import { apiRouter } from "@/server/api-router";
import {
  checkRateLimit,
  rateLimitHeaders,
} from "@/server/api-rate-limit";

async function normalizeErrorResponse(
  response: Response,
  extraHeaders?: Record<string, string>,
): Promise<Response> {
  if (response.status < 400) return response;

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  try {
    const body = await response.clone().json();

    if (body && typeof body === "object" && "success" in body) {
      return response;
    }

    const message =
      typeof body?.message === "string"
        ? body.message
        : "Internal server error";

    const headers = new Headers(response.headers);
    if (extraHeaders) {
      for (const [key, value] of Object.entries(extraHeaders)) {
        headers.set(key, value);
      }
    }

    return new Response(
      JSON.stringify({ success: false, error: message }),
      {
        status: response.status,
        statusText: response.statusText,
        headers,
      },
    );
  } catch {
    return response;
  }
}

const handler = new OpenAPIHandler(apiRouter, {
  plugins: [
    new CORSPlugin(),
    new OpenAPIReferencePlugin({
      schemaConverters: [new ZodToJsonSchemaConverter()],
      specPath: "/openapi.json",
      specGenerateOptions: {
        info: {
          title: "bmrks API",
          version: "1.0.0",
        },
        components: {
          securitySchemes: {
            BearerAuth: {
              type: "http",
              scheme: "bearer",
              description:
                "API key authentication. Generate a key in Settings → API. Use the raw key as the Bearer token.",
            },
          },
        },
        security: [{ BearerAuth: [] }],
      },
    }),
  ],
  interceptors: [
    onError((error: unknown) => {
      console.error("[API Error]", error);
    }),
  ],
  adapterInterceptors: [
    async (interceptorOptions) => {
      const { request, next } = interceptorOptions;

      const url = new URL(request.url);
      if (url.pathname === "/api/openapi.json") {
        const handlerResult = await next();
        if (
          handlerResult.matched &&
          handlerResult.response?.ok &&
          handlerResult.response.headers
            .get("content-type")
            ?.includes("application/json")
        ) {
          const spec = await handlerResult.response.json();
          if (spec.paths?.["/health"]?.get) {
            spec.paths["/health"].get.security = [];
          }
          const headers = new Headers(handlerResult.response.headers);
          headers.set("Content-Type", "application/json");
          return {
            matched: true as const,
            response: new Response(JSON.stringify(spec), {
              status: 200,
              headers,
            }),
          };
        }
        return handlerResult;
      }

      const authHeader = request.headers.get("authorization");
      const token = authHeader?.startsWith("Bearer ")
        ? authHeader.slice(7)
        : null;

      if (!token) {
        const handlerResult = await next();

        if (handlerResult.matched && handlerResult.response) {
          return {
            matched: true as const,
            response: await normalizeErrorResponse(handlerResult.response),
          };
        }

        return handlerResult;
      }

      const result = checkRateLimit(token, request.method);

      if (!result.allowed) {
        const rlHeaders = rateLimitHeaders(result);
        return {
          matched: true as const,
          response: new Response(
            JSON.stringify({
              success: false,
              error: "Rate limit exceeded",
            }),
            {
              status: 429,
              headers: {
                "Content-Type": "application/json",
                ...rlHeaders,
              },
            },
          ),
        };
      }

      const handlerResult = await next();

      if (handlerResult.matched && handlerResult.response) {
        const rlHeaders = rateLimitHeaders(result);

        const normalized = await normalizeErrorResponse(
          handlerResult.response,
          rlHeaders,
        );

        if (normalized === handlerResult.response) {
          for (const [key, value] of Object.entries(rlHeaders)) {
            handlerResult.response.headers.set(key, value);
          }
        }

        return {
          matched: true as const,
          response: normalized,
        };
      }

      return handlerResult;
    },
  ],
});

async function handleRequest(request: Request) {
  const { response } = await handler.handle(request, {
    prefix: "/api",
    context: {},
  });

  return response ?? new Response(
    JSON.stringify({ success: false, error: "Not found" }),
    { status: 404, headers: { "Content-Type": "application/json" } },
  );
}

export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const PATCH = handleRequest;
export const DELETE = handleRequest;
export const OPTIONS = handleRequest;
