import "server-only";

import { PostHog } from "posthog-node";

function createPostHogServer(): PostHog | null {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return null;

  return new PostHog(key, {
    host: "https://us.i.posthog.com",
    flushAt: 1,
    flushInterval: 0,
  });
}

export const posthogServer = createPostHogServer();
