import Link from "next/link";
import {
  LOGO_SVG,
  CHROME_ICON,
  BOOKMARK_ICON,
  AUTO_FETCH_ICON,
  ORGANIZE_ICON,
  SEARCH_ICON,
  KEYBOARD_ICON,
  PRIVACY_ICON,
  MINIMAL_ICON,
  ACCESS_ANYWHERE_ICON,
} from "@/components/landing-icons";
import { DashboardDemoLazy as DashboardDemo } from "@/components/dashboard-demo-lazy";

const CURRENT_YEAR = new Date().getFullYear();

export function Landing() {
  return (
    <main className="flex grow flex-col bg-white text-zinc-900" role="main">
      <article
        className="mx-auto w-full max-w-5xl p-4 sm:p-6"
        aria-labelledby="landing-title"
      >
        <header className="mx-auto mb-8 mt-12 flex max-w-[400px] flex-col items-center justify-center text-center sm:mb-12 sm:mt-24">
          {LOGO_SVG}
          <h1 id="landing-title" className="mb-1.5 text-2xl font-semibold text-zinc-900">
            minimal
          </h1>
          <p className="text-zinc-600">
            simple, fast, and minimal bookmark manager.
          </p>
          <nav className="mt-5 flex items-center gap-2" aria-label="Primary">
            <Link
              href="/login"
              className="rounded-full bg-zinc-900 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 sm:px-8"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-zinc-900 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 sm:px-8"
            >
              Sign Up
            </Link>
            <a
              href="/chrome"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-zinc-200 p-2 text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
              title="Chrome Extension"
            >
              {CHROME_ICON}
            </a>
          </nav>
        </header>

        <DashboardDemo />

        <section
          className="mx-auto my-12 mt-12! max-w-[450px] sm:my-20"
          aria-labelledby="benefits-title"
        >
          <h2 id="benefits-title" className="sr-only">
            Why minimal
          </h2>
          <div className="space-y-5 sm:space-y-7">
            <div className="flex items-start">
              {BOOKMARK_ICON}
              <div>
                <h3 className="font-medium text-zinc-900 text-base sm:text-lg mb-1 leading-tight">
                  Save in seconds
                </h3>
                <p className="text-zinc-600 text-sm">
                  Paste any URL, hit enter. Done. No friction, no extra steps.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              {AUTO_FETCH_ICON}
              <div>
                <h3 className="font-medium text-zinc-900 text-base sm:text-lg mb-1 leading-tight">
                  Auto-fetch metadata
                </h3>
                <p className="text-zinc-600 text-sm">
                  Titles, descriptions, and favicons are pulled automatically.
                  Your links look great without any effort.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              {ORGANIZE_ICON}
              <div>
                <h3 className="font-medium text-zinc-900 text-base sm:text-lg mb-1 leading-tight">
                  Organize with groups
                </h3>
                <p className="text-zinc-600 text-sm">
                  Create collections to categorize your bookmarks. Keep work,
                  personal, and inspiration separate.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              {SEARCH_ICON}
              <div>
                <h3 className="font-medium text-zinc-900 text-base sm:text-lg mb-1 leading-tight">
                  Instant search
                </h3>
                <p className="text-zinc-600 text-sm">
                  Find any bookmark by title, URL, or group. Results appear as
                  you type.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              {KEYBOARD_ICON}
              <div>
                <h3 className="font-medium text-zinc-900 text-base sm:text-lg mb-1 leading-tight">
                  Keyboard shortcuts
                </h3>
                <p className="text-zinc-600 text-sm">
                  Navigate, search, and manage everything without touching your
                  mouse. Built for speed.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              {PRIVACY_ICON}
              <div>
                <h3 className="font-medium text-zinc-900 text-base sm:text-lg mb-1 leading-tight">
                  Private by default
                </h3>
                <p className="text-zinc-600 text-sm">
                  Your bookmarks are yours alone. No tracking, no ads, no data
                  selling.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              {MINIMAL_ICON}
              <div>
                <h3 className="font-medium text-zinc-900 text-base sm:text-lg mb-1 leading-tight">
                  Minimal interface
                </h3>
                <p className="text-zinc-600 text-sm">
                  No clutter, no distractions. Just your bookmarks in a clean,
                  focused layout.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              {ACCESS_ANYWHERE_ICON}
              <div>
                <h3 className="font-medium text-zinc-900 text-base sm:text-lg mb-1 leading-tight">
                  Access anywhere
                </h3>
                <p className="text-zinc-600 text-sm">
                  Web-only means no apps to install. Works on any device with a
                  browser.
                </p>
              </div>
            </div>
          </div>
        </section>

        <footer className="mb-10 mt-10 text-center text-sm text-zinc-500 sm:mb-16 sm:mt-16">
          <div className="mb-4 flex flex-wrap flex-row items-center justify-center">
            <Link
              href="/terms"
              className="rounded-full px-3 py-1 transition-colors hover:bg-zinc-900 hover:text-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
            >
              Terms of Service
            </Link>
            <Link
              href="/privacy"
              className="rounded-full px-3 py-1 transition-colors hover:bg-zinc-900 hover:text-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
            >
              Privacy Policy
            </Link>
            <Link
              href="/changelog"
              className="rounded-full px-3 py-1 transition-colors hover:bg-zinc-900 hover:text-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
            >
              Changelog
            </Link>
          </div>
          <p>
            © {CURRENT_YEAR} minimal.so - Save and organize your bookmarks
            beautifully
          </p>
        </footer>
      </article>
    </main>
  );
}
