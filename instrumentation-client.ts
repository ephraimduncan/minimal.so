import posthog from "posthog-js";

const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "/ingest";

if (key) {
  posthog.init(key, {
    api_host: host,
    person_profiles: "identified_only",
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: false,
    disable_session_recording: true,
  });

  posthog.register({
    app_version: "0.1.0",
    runtime: "web",
    environment: process.env.NODE_ENV ?? "development",
  });
}
