import "server-only";

import { createRouterClient } from "@orpc/server";
import { router } from "@/server";

export const serverClient = createRouterClient(router);

