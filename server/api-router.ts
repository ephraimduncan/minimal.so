import { os } from "@orpc/server";
import * as z from "zod";

/**
 * Health check endpoint — no auth required.
 * GET /api/health → { success: true, message: "ok" }
 */
const health = os
  .route({ method: "GET", path: "/health" })
  .output(
    z.object({
      success: z.boolean(),
      message: z.string(),
    }),
  )
  .handler(async () => {
    return { success: true, message: "ok" };
  });

/**
 * Public API router — holds all REST API route definitions.
 * Uses OpenAPIHandler to serve these as REST endpoints at /api/*.
 */
export const apiRouter = {
  health,
};

export type ApiRouter = typeof apiRouter;
