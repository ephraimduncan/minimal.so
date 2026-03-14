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

/**
 * Transform an ORPC error response body into the Shiori-style
 * { success: false, error: 'message' } format.
 *
 * ORPC serializes errors as { defined, code, status, message, data }.
 * We normalise to { success: false, error: '<message>' }.
 */
async function normalizeErrorResponse(
  response: Response,
  extraHeaders?: Record<string, string>,
): Promise<Response> {
  // Only transform JSON error responses
  if (response.status < 400) return response;

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  try {
    const body = await response.json();

    // Already in the correct format
    if (body && typeof body === "object" && "success" in body) {
      return response;
    }

    // ORPC error format: { defined, code, status, message, data? }
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
    // If we can't parse the body, return original response
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

      // Extract Bearer token from Authorization header for rate-limit keying
      const authHeader = request.headers.get("authorization");
      const token = authHeader?.startsWith("Bearer ")
        ? authHeader.slice(7)
        : null;

      // Skip rate limiting for unauthenticated requests (auth middleware handles 401)
      // and for OpenAPI spec / health endpoints
      if (!token) {
        const handlerResult = await next();

        // Normalize error responses for unauthenticated requests
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
        // Return 429 with rate limit headers
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

      // Proceed with the request and attach rate-limit headers to the response
      const handlerResult = await next();

      if (handlerResult.matched && handlerResult.response) {
        const rlHeaders = rateLimitHeaders(result);

        // Normalize error responses for authenticated requests
        const normalized = await normalizeErrorResponse(
          handlerResult.response,
          rlHeaders,
        );

        // For success responses, just attach rate-limit headers
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

  return response ?? new Response("Not found", { status: 404 });
}

export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const PATCH = handleRequest;
export const DELETE = handleRequest;
export const OPTIONS = handleRequest;
