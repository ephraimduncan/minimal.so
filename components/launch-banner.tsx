import { useEffect, useState } from "react";
import { IconArrowUpRight } from "@tabler/icons-react";

const launchUrl =
  "https://www.producthunt.com/products/telemetry-dev?launch=telemetry-dev";

// Product Hunt launches go live at 12:01 am Pacific Time. On 31 October 2026, that is UTC-7.
const launchStart = Date.parse("2026-10-31T00:01:00-07:00");
// The banner stays until the end of 31 December Pacific Time, which is UTC-8 by then.
const bannerEnd = Date.parse("2027-01-01T00:00:00-08:00");

/**
 * The telemetry.dev Product Hunt launch: a teaser before the launch day, then a link to the
 * launch until the end of 2026. The first render uses the time of the server render, so that
 * hydration matches the server HTML. After mount, it uses the browser's time.
 */
export function LaunchBanner({ renderedAt }: { renderedAt: number }) {
  const [now, setNow] = useState(renderedAt);

  useEffect(() => {
    setNow(Date.now());
  }, []);

  if (now >= bannerEnd) return null;

  const [text, action] =
    now < launchStart
      ? ["telemetry.dev launches on Product Hunt tomorrow.", "Get notified"]
      : ["telemetry.dev is live on Product Hunt.", "Support the launch"];

  return (
    <a
      href={launchUrl}
      target="_blank"
      rel="noopener noreferrer"
      data-umami-event="View telemetry.dev Product Hunt launch"
      className="block bg-black px-6 py-2.5 text-center text-sm text-balance text-white transition-colors hover:bg-zinc-800 focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-zinc-400 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
    >
      {text}{" "}
      <span className="inline-flex items-center gap-1 font-medium underline underline-offset-4">
        {action}
        <IconArrowUpRight className="size-3.5" aria-hidden />
      </span>
    </a>
  );
}
