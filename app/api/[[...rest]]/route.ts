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

const handler = new OpenAPIHandler(apiRouter, {
  plugins: [
    new CORSPlugin(),
    new OpenAPIReferencePlugin({
      schemaConverters: [new ZodToJsonSchemaConverter()],
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
        return next();
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
        for (const [key, value] of Object.entries(rlHeaders)) {
          handlerResult.response.headers.set(key, value);
        }
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
