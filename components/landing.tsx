import Link from "next/link";

export function Landing() {
  return (
    <div className="flex grow flex-col bg-white text-zinc-900">
      <div className="mx-auto max-w-3xl p-4 sm:p-6">
        <header className="mx-auto mb-8 mt-12 flex max-w-[400px] flex-col items-center justify-center text-center sm:mb-12 sm:mt-24">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mb-4 text-zinc-900"
            aria-label="Logo"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M12.432 17.949c.863 1.544 2.589 1.976 4.13 1.112c1.54 -.865 1.972 -2.594 1.048 -4.138c-.185 -.309 -.309 -.556 -.494 -.74c.247 .06 .555 .06 .925 .06c1.726 0 2.959 -1.234 2.959 -2.963c0 -1.73 -1.233 -2.965 -3.02 -2.965c-.37 0 -.617 0 -.925 .062c.185 -.185 .308 -.432 .493 -.74c.863 -1.545 .431 -3.274 -1.048 -4.138c-1.541 -.865 -3.205 -.433 -4.13 1.111c-.185 .309 -.308 .556 -.432 .803c-.123 -.247 -.246 -.494 -.431 -.803c-.802 -1.605 -2.528 -2.038 -4.007 -1.173c-1.541 .865 -1.973 2.594 -1.048 4.137c.185 .31 .308 .556 .493 .741c-.246 -.061 -.555 -.061 -.924 -.061c-1.788 0 -3.021 1.235 -3.021 2.964c0 1.729 1.233 2.964 3.02 2.964" />
            <path d="M4.073 21c4.286 -2.756 5.9 -5.254 7.927 -9" />
          </svg>
          <h1 className="mb-1.5 text-2xl text-zinc-900">minimal</h1>
          <p className="text-zinc-600">
            simple, fast, and minimal bookmark manager.
          </p>
          <div className="mt-5 flex gap-2 items-center">
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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="4" />
                <line x1="21.17" y1="8" x2="12" y2="8" />
                <line x1="3.95" y1="6.06" x2="8.54" y2="14" />
                <line x1="10.88" y1="21.94" x2="15.46" y2="14" />
              </svg>
            </a>
          </div>
        </header>
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
          <div className="cursor-pointer rounded-lg border border-zinc-200 bg-white p-6 text-center transition-colors hover:bg-zinc-50">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="h-7 w-7 mx-auto mb-4 text-zinc-700"
            >
              <path
                fill="currentColor"
                fillRule="evenodd"
                d="M17.3996 1.42712c1.2142 0 2.15 0.93583 2.15 2.15003V21.1052c0 0.571 -0.2976 1.0547 -0.7616 1.3003 -0.4549 0.2408 -1.0093 0.2218 -1.4743 -0.0572 -0.0153 -0.0092 -0.0303 -0.019 -0.0449 -0.0292l-5.2692 -3.6977 -5.26917 3.6977c-0.01463 0.0102 -0.02962 0.02 -0.04495 0.0292 -0.47898 0.2874 -1.04541 0.2849 -1.49442 0.0722 -0.46239 -0.219 -0.84145 -0.6866 -0.84145 -1.3153V3.57715c0 -1.2142 0.93577 -2.15003 2.15 -2.15003H17.3996Z"
                clipRule="evenodd"
                strokeWidth="1"
              ></path>
            </svg>
            <h2 className="mb-1 text-base font-medium text-zinc-900">
              Quick Save
            </h2>
            <p className="text-sm text-zinc-600">
              Paste any URL and save instantly
            </p>
          </div>
          <div className="cursor-pointer rounded-lg border border-zinc-200 bg-white p-6 text-center transition-colors hover:bg-zinc-50">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="h-7 w-7 mx-auto mb-4 text-zinc-700"
            >
              <g>
                <path
                  d="M22.5 14H19a1 1 0 0 0 -1 1 1 1 0 0 1 -1 1H7a1 1 0 0 1 -1 -1 1 1 0 0 0 -1 -1H1.5A1.5 1.5 0 0 0 0 15.5V22a2 2 0 0 0 2 2h20a2 2 0 0 0 2 -2v-6.5a1.5 1.5 0 0 0 -1.5 -1.5Z"
                  fill="currentColor"
                  strokeWidth="1"
                ></path>
                <path
                  d="M9.5 12a1 1 0 0 0 0 2h5a1 1 0 0 0 0 -2Z"
                  fill="currentColor"
                  strokeWidth="1"
                ></path>
                <path
                  d="M2.5 11a1 1 0 0 0 1 -1h17a1 1 0 0 0 2 0 2 2 0 0 0 -2 -2h-17a2 2 0 0 0 -2 2 1 1 0 0 0 1 1Z"
                  fill="currentColor"
                  strokeWidth="1"
                ></path>
                <path
                  d="M2.5 7a1 1 0 0 0 1 -1h17a1 1 0 0 0 2 0 2 2 0 0 0 -2 -2h-17a2 2 0 0 0 -2 2 1 1 0 0 0 1 1Z"
                  fill="currentColor"
                  strokeWidth="1"
                ></path>
                <path
                  d="M2.5 3a1 1 0 0 0 1 -1h17a1 1 0 0 0 2 0 2 2 0 0 0 -2 -2h-17a2 2 0 0 0 -2 2 1 1 0 0 0 1 1Z"
                  fill="currentColor"
                  strokeWidth="1"
                ></path>
              </g>
            </svg>
            <h2 className="mb-1 text-base font-medium text-zinc-900">Groups</h2>
            <p className="text-sm text-zinc-600">
              Organize links into collections
            </p>
          </div>
          <div className="cursor-pointer rounded-lg border border-zinc-200 bg-white p-6 text-center transition-colors hover:bg-zinc-50">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="h-7 w-7 mx-auto mb-4 text-zinc-700"
            >
              <g>
                <path
                  d="M15.67 6a1.5 1.5 0 1 0 3 0 1.5 1.5 0 1 0 -3 0"
                  fill="currentColor"
                  strokeWidth="1"
                ></path>
                <path
                  d="M10.58 16.53a5.52 5.52 0 0 0 8.5 4.66 0.26 0.26 0 0 1 0.31 0l2.48 2.49a1 1 0 0 0 0.71 0.29 1 1 0 0 0 0.71 -0.29 1 1 0 0 0 0 -1.42l-2.49 -2.45a0.24 0.24 0 0 1 0 -0.31 5.53 5.53 0 1 0 -10.19 -3Zm9.06 0A3.53 3.53 0 1 1 16.11 13a3.54 3.54 0 0 1 3.53 3.53Z"
                  fill="currentColor"
                  strokeWidth="1"
                ></path>
                <path
                  d="M21.17 0H14a3 3 0 0 0 -2.12 0.88l-11 11a3 3 0 0 0 0 4.24l6.17 6.17a3 3 0 0 0 4.24 0l0.14 -0.14a0.23 0.23 0 0 0 0.07 -0.15 0.23 0.23 0 0 0 -0.08 -0.18 7.17 7.17 0 0 1 -1 -1.06 0.25 0.25 0 0 0 -0.18 -0.1 0.27 0.27 0 0 0 -0.19 0.08l-0.17 0.17a1 1 0 0 1 -1.42 0l-6.17 -6.2a1 1 0 0 1 0 -1.42l11 -11A1 1 0 0 1 14 2h6.67a0.5 0.5 0 0 1 0.5 0.5v6.67a1 1 0 0 1 -0.29 0.71l-0.67 0.67a0.27 0.27 0 0 0 -0.08 0.19 0.29 0.29 0 0 0 0.1 0.18 7.67 7.67 0 0 1 1.06 1 0.21 0.21 0 0 0 0.18 0.09 0.26 0.26 0 0 0 0.19 -0.07l0.63 -0.64a3 3 0 0 0 0.88 -2.12V2a2 2 0 0 0 -2 -2Z"
                  fill="currentColor"
                  strokeWidth="1"
                ></path>
              </g>
            </svg>
            <h2 className="mb-1 text-base font-medium text-zinc-900">Search</h2>
            <p className="text-sm text-zinc-600">
              Find any bookmark in seconds
            </p>
          </div>
          <div className="cursor-pointer rounded-lg border border-zinc-200 bg-white p-6 text-center transition-colors hover:bg-zinc-50">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="h-7 w-7 mx-auto mb-4 text-zinc-700"
            >
              <g>
                <path
                  d="M12 21.26a7.56 7.56 0 0 1 -2.66 0.48 0.75 0.75 0 1 0 0 1.5 9.1 9.1 0 0 0 2.82 -0.45 0.26 0.26 0 0 0 0.18 -0.23v-1.07a0.27 0.27 0 0 0 -0.11 -0.2 0.24 0.24 0 0 0 -0.23 -0.03Z"
                  fill="currentColor"
                  strokeWidth="1"
                ></path>
                <path
                  d="M17.12 9.27a0.29 0.29 0 0 0 0.1 0.27 0.26 0.26 0 0 0 0.21 0.05 4.13 4.13 0 0 1 1 -0.1 0.21 0.21 0 0 0 0.21 -0.22 9.14 9.14 0 0 0 -1.94 -5.65 0.75 0.75 0 0 0 -1 -0.14 0.72 0.72 0 0 0 -0.13 1.05 7.79 7.79 0 0 1 1.55 4.74Z"
                  fill="currentColor"
                  strokeWidth="1"
                ></path>
                <path
                  d="M6.36 21.13A7.74 7.74 0 0 1 1.62 14v-1.9a0.74 0.74 0 0 0 -0.74 -0.75 0.75 0.75 0 0 0 -0.76 0.75V14a9.23 9.23 0 0 0 5.66 8.52 0.72 0.72 0 0 0 0.29 0.06 0.75 0.75 0 0 0 0.29 -1.44Z"
                  fill="currentColor"
                  strokeWidth="1"
                ></path>
                <path
                  d="M0.85 9.54a0.75 0.75 0 0 0 0.79 -0.71 7.75 7.75 0 0 1 11.61 -6.28 0.75 0.75 0 0 0 1 -0.27 0.76 0.76 0 0 0 -0.28 -1A9.25 9.25 0 0 0 0.14 8.75a0.74 0.74 0 0 0 0.71 0.79Z"
                  fill="currentColor"
                  strokeWidth="1"
                ></path>
                <path
                  d="M14.47 11.41a0.26 0.26 0 0 0 0.28 -0.09 4.19 4.19 0 0 1 0.94 -0.94 0.23 0.23 0 0 0 0.1 -0.2v-0.91a6.41 6.41 0 0 0 -8.41 -6.1 0.75 0.75 0 0 0 0.45 1.43 4.75 4.75 0 0 1 1.55 -0.25 4.93 4.93 0 0 1 4.91 4.92v1.9a0.25 0.25 0 0 0 0.18 0.24Z"
                  fill="currentColor"
                  strokeWidth="1"
                ></path>
                <path
                  d="M12.25 18.14a0.24 0.24 0 0 0 -0.26 0 4.88 4.88 0 0 1 -2.61 0.76A4.93 4.93 0 0 1 4.46 14V9.27A5 5 0 0 1 5.71 6a0.76 0.76 0 0 0 0 -1.06 0.77 0.77 0 0 0 -1.12 0.06A6.43 6.43 0 0 0 3 9.27V14a6.42 6.42 0 0 0 6.42 6.42 6.35 6.35 0 0 0 2.86 -0.69 0.26 0.26 0 0 0 0.14 -0.22v-1.15a0.25 0.25 0 0 0 -0.17 -0.22Z"
                  fill="currentColor"
                  strokeWidth="1"
                ></path>
                <path
                  d="M9.38 5.68a3.59 3.59 0 0 0 -3.59 3.59v1.41a0.75 0.75 0 0 0 1.5 0V9.27a2.09 2.09 0 1 1 4.17 0V14a2.09 2.09 0 0 1 -4.17 0 0.75 0.75 0 1 0 -1.5 0 3.59 3.59 0 0 0 6.56 2 0.28 0.28 0 0 0 0 -0.13 1.79 1.79 0 0 1 0.46 -1.14 0.31 0.31 0 0 0 0.06 -0.13A4 4 0 0 0 13 14V9.27a3.59 3.59 0 0 0 -3.62 -3.59Z"
                  fill="currentColor"
                  strokeWidth="1"
                ></path>
                <path
                  d="M10.12 13.51v-2.83a0.75 0.75 0 0 0 -0.74 -0.75 0.76 0.76 0 0 0 -0.76 0.75v2.83a0.75 0.75 0 0 0 0.76 0.75 0.74 0.74 0 0 0 0.74 -0.75Z"
                  fill="currentColor"
                  strokeWidth="1"
                ></path>
                <path
                  d="M22.59 15.5a0.25 0.25 0 0 1 -0.21 -0.25v-1a3.5 3.5 0 0 0 -7 0v1a0.26 0.26 0 0 1 -0.22 0.25 1.5 1.5 0 0 0 -1.28 1.5v5.5a1.5 1.5 0 0 0 1.5 1.5h7a1.51 1.51 0 0 0 1.5 -1.5V17a1.51 1.51 0 0 0 -1.29 -1.5Zm-3.71 5.74a1 1 0 1 1 1 -1 1 1 0 0 1 -1 1Zm1.5 -6a0.26 0.26 0 0 1 -0.26 0.25h-2.5a0.25 0.25 0 0 1 -0.24 -0.25v-1a1.5 1.5 0 1 1 3 0Z"
                  fill="currentColor"
                  strokeWidth="1"
                ></path>
              </g>
            </svg>
            <h2 className="mb-1 text-base font-medium text-zinc-900">
              Private
            </h2>
            <p className="text-sm text-zinc-600">
              Your bookmarks stay yours alone
            </p>
          </div>
          <div className="cursor-pointer rounded-lg border border-zinc-200 bg-white p-6 text-center transition-colors hover:bg-zinc-50">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="h-7 w-7 mx-auto mb-4 text-zinc-700"
            >
              <g>
                <path
                  d="M12 0.5A4.51 4.51 0 0 0 7.5 5v3.13a1 1 0 1 0 2 0V5a2.5 2.5 0 0 1 5 0v5.5A2.5 2.5 0 0 1 12 13a1 1 0 0 0 0 2 4.51 4.51 0 0 0 4.5 -4.5V5A4.51 4.51 0 0 0 12 0.5Z"
                  fill="currentColor"
                  strokeWidth="1"
                ></path>
                <path
                  d="M15.5 15.63a1 1 0 0 0 -1 1V19a2.5 2.5 0 0 1 -5 0v-5a2.5 2.5 0 0 1 2.5 -2.5 1 1 0 0 0 0 -2A4.51 4.51 0 0 0 7.5 14v5a4.5 4.5 0 0 0 9 0v-2.37a1 1 0 0 0 -1 -1Z"
                  fill="currentColor"
                  strokeWidth="1"
                ></path>
                <path
                  d="m5.24 6.88 -1.3 -0.75a1 1 0 1 0 -1 1.74l1.3 0.75a1 1 0 0 0 1.36 -0.37 1 1 0 0 0 -0.36 -1.37Z"
                  fill="currentColor"
                  strokeWidth="1"
                ></path>
                <path
                  d="M4 12.5a1 1 0 0 0 0 -2H2.5a1 1 0 0 0 0 2Z"
                  fill="currentColor"
                  strokeWidth="1"
                ></path>
                <path
                  d="m4.24 14.38 -1.3 0.75a1 1 0 0 0 1 1.74l1.3 -0.75a1 1 0 0 0 -1 -1.74Z"
                  fill="currentColor"
                  strokeWidth="1"
                ></path>
                <path
                  d="M19.26 8.75a1 1 0 0 0 0.5 -0.13l1.3 -0.75a1 1 0 0 0 -1 -1.74l-1.3 0.75a1 1 0 0 0 0.5 1.87Z"
                  fill="currentColor"
                  strokeWidth="1"
                ></path>
                <path
                  d="M21.5 10.5H20a1 1 0 0 0 0 2h1.5a1 1 0 0 0 0 -2Z"
                  fill="currentColor"
                  strokeWidth="1"
                ></path>
                <path
                  d="m21.06 15.13 -1.3 -0.75a1 1 0 0 0 -1 1.74l1.3 0.75a1 1 0 1 0 1 -1.74Z"
                  fill="currentColor"
                  strokeWidth="1"
                ></path>
              </g>
            </svg>
            <h2 className="mb-1 text-base font-medium text-zinc-900">
              Metadata
            </h2>
            <p className="text-sm text-zinc-600">
              Auto-fetch titles and favicons
            </p>
          </div>
          <div className="cursor-pointer rounded-lg border border-zinc-200 bg-white p-6 text-center transition-colors hover:bg-zinc-50">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="h-7 w-7 mx-auto mb-4 text-zinc-700"
            >
              <path
                d="M5.75 10.25h13.5c2.65 0 4.5 -1.64 4.5 -4s-1.85 -4 -4.5 -4h-6a1 1 0 0 1 -1 -1 1 1 0 0 0 -2 0 3 3 0 0 0 3 3h6c1.21 0 2.5 0.53 2.5 2s-1.29 2 -2.5 2H5.75c-2.29 0 -4 2.38 -4 4.5v0.75a0.25 0.25 0 0 1 -0.25 0.25h-0.25a1 1 0 0 0 -1 1v8a1 1 0 0 0 1 1h20a1 1 0 0 0 1 -1v-8a1 1 0 0 0 -1 -1H4a0.25 0.25 0 0 1 -0.25 -0.25v-0.75c0 -1.12 0.92 -2.5 2 -2.5Zm-1.5 9.5h-0.5a0.5 0.5 0 0 1 0 -1h0.5a0.5 0.5 0 0 1 0 1Zm14.5 -3.5h0.5a0.5 0.5 0 0 1 0 1h-0.5a0.5 0.5 0 0 1 0 -1Zm0 2.5h0.5a0.5 0.5 0 0 1 0 1h-0.5a0.5 0.5 0 0 1 0 -1Zm-3 -2.5h0.5a0.5 0.5 0 0 1 0 1h-0.5a0.5 0.5 0 0 1 0 -1Zm0 2.5h0.5a0.5 0.5 0 0 1 0 1h-0.5a0.5 0.5 0 0 1 0 -1Zm-3 -2.5h0.5a0.5 0.5 0 0 1 0 1h-0.5a0.5 0.5 0 0 1 0 -1Zm0 2.5h0.5a0.5 0.5 0 0 1 0 1h-0.5a0.5 0.5 0 0 1 0 -1Zm-3 -2.5h0.5a0.5 0.5 0 0 1 0 1h-0.5a0.5 0.5 0 0 1 0 -1Zm0 2.5h0.5a0.5 0.5 0 0 1 0 1h-0.5a0.5 0.5 0 0 1 0 -1Zm-3 -2.5h0.5a0.5 0.5 0 0 1 0 1h-0.5a0.5 0.5 0 0 1 0 -1Zm0 2.5h0.5a0.5 0.5 0 0 1 0 1h-0.5a0.5 0.5 0 0 1 0 -1Zm-1 2.5h11a0.5 0.5 0 0 1 0 1h-11a0.5 0.5 0 0 1 0 -1Zm-1.5 -5a0.5 0.5 0 0 1 0 1h-0.5a0.5 0.5 0 0 1 0 -1Z"
                fill="currentColor"
                strokeWidth="1"
              ></path>
            </svg>
            <h2 className="mb-1 text-base font-medium text-zinc-900">
              Keyboard First
            </h2>
            <p className="text-sm text-zinc-600">
              Navigate and manage with shortcuts
            </p>
          </div>
        </div>
        <section className="mx-auto my-12 max-w-[450px] sm:my-20">
          <div className="space-y-7">
            <div className="flex items-start">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="w-5 h-5 mr-3 mt-1 text-zinc-700 shrink-0"
              >
                <path
                  fill="currentColor"
                  fillRule="evenodd"
                  d="M17.3996 1.42712c1.2142 0 2.15 0.93583 2.15 2.15003V21.1052c0 0.571 -0.2976 1.0547 -0.7616 1.3003 -0.4549 0.2408 -1.0093 0.2218 -1.4743 -0.0572 -0.0153 -0.0092 -0.0303 -0.019 -0.0449 -0.0292l-5.2692 -3.6977 -5.26917 3.6977c-0.01463 0.0102 -0.02962 0.02 -0.04495 0.0292 -0.47898 0.2874 -1.04541 0.2849 -1.49442 0.0722 -0.46239 -0.219 -0.84145 -0.6866 -0.84145 -1.3153V3.57715c0 -1.2142 0.93577 -2.15003 2.15 -2.15003H17.3996Z"
                  clipRule="evenodd"
                  strokeWidth="1"
                ></path>
              </svg>
              <div>
                <h3 className="font-medium text-zinc-900 text-lg mb-1 leading-tight tracking-wide">
                  Save in seconds
                </h3>
                <p className="text-zinc-600 text-sm">
                  Paste any URL, hit enter. Done. No friction, no extra steps.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="w-5 h-5 mr-3 mt-1 text-zinc-700 shrink-0"
              >
                <g>
                  <path
                    d="M12 0.5A4.51 4.51 0 0 0 7.5 5v3.13a1 1 0 1 0 2 0V5a2.5 2.5 0 0 1 5 0v5.5A2.5 2.5 0 0 1 12 13a1 1 0 0 0 0 2 4.51 4.51 0 0 0 4.5 -4.5V5A4.51 4.51 0 0 0 12 0.5Z"
                    fill="currentColor"
                    strokeWidth="1"
                  ></path>
                  <path
                    d="M15.5 15.63a1 1 0 0 0 -1 1V19a2.5 2.5 0 0 1 -5 0v-5a2.5 2.5 0 0 1 2.5 -2.5 1 1 0 0 0 0 -2A4.51 4.51 0 0 0 7.5 14v5a4.5 4.5 0 0 0 9 0v-2.37a1 1 0 0 0 -1 -1Z"
                    fill="currentColor"
                    strokeWidth="1"
                  ></path>
                  <path
                    d="m5.24 6.88 -1.3 -0.75a1 1 0 1 0 -1 1.74l1.3 0.75a1 1 0 0 0 1.36 -0.37 1 1 0 0 0 -0.36 -1.37Z"
                    fill="currentColor"
                    strokeWidth="1"
                  ></path>
                  <path
                    d="M4 12.5a1 1 0 0 0 0 -2H2.5a1 1 0 0 0 0 2Z"
                    fill="currentColor"
                    strokeWidth="1"
                  ></path>
                  <path
                    d="m4.24 14.38 -1.3 0.75a1 1 0 0 0 1 1.74l1.3 -0.75a1 1 0 0 0 -1 -1.74Z"
                    fill="currentColor"
                    strokeWidth="1"
                  ></path>
                  <path
                    d="M19.26 8.75a1 1 0 0 0 0.5 -0.13l1.3 -0.75a1 1 0 0 0 -1 -1.74l-1.3 0.75a1 1 0 0 0 0.5 1.87Z"
                    fill="currentColor"
                    strokeWidth="1"
                  ></path>
                  <path
                    d="M21.5 10.5H20a1 1 0 0 0 0 2h1.5a1 1 0 0 0 0 -2Z"
                    fill="currentColor"
                    strokeWidth="1"
                  ></path>
                  <path
                    d="m21.06 15.13 -1.3 -0.75a1 1 0 0 0 -1 1.74l1.3 0.75a1 1 0 1 0 1 -1.74Z"
                    fill="currentColor"
                    strokeWidth="1"
                  ></path>
                </g>
              </svg>
              <div>
                <h3 className="font-medium text-zinc-900 text-lg mb-1 leading-tight tracking-wide">
                  Auto-fetch metadata
                </h3>
                <p className="text-zinc-600 text-sm">
                  Titles, descriptions, and favicons are pulled automatically.
                  Your links look great without any effort.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="w-5 h-5 mr-3 mt-1 text-zinc-700 shrink-0"
              >
                <g>
                  <path
                    d="M22.5 14H19a1 1 0 0 0 -1 1 1 1 0 0 1 -1 1H7a1 1 0 0 1 -1 -1 1 1 0 0 0 -1 -1H1.5A1.5 1.5 0 0 0 0 15.5V22a2 2 0 0 0 2 2h20a2 2 0 0 0 2 -2v-6.5a1.5 1.5 0 0 0 -1.5 -1.5Z"
                    fill="currentColor"
                    strokeWidth="1"
                  ></path>
                  <path
                    d="M9.5 12a1 1 0 0 0 0 2h5a1 1 0 0 0 0 -2Z"
                    fill="currentColor"
                    strokeWidth="1"
                  ></path>
                  <path
                    d="M2.5 11a1 1 0 0 0 1 -1h17a1 1 0 0 0 2 0 2 2 0 0 0 -2 -2h-17a2 2 0 0 0 -2 2 1 1 0 0 0 1 1Z"
                    fill="currentColor"
                    strokeWidth="1"
                  ></path>
                  <path
                    d="M2.5 7a1 1 0 0 0 1 -1h17a1 1 0 0 0 2 0 2 2 0 0 0 -2 -2h-17a2 2 0 0 0 -2 2 1 1 0 0 0 1 1Z"
                    fill="currentColor"
                    strokeWidth="1"
                  ></path>
                  <path
                    d="M2.5 3a1 1 0 0 0 1 -1h17a1 1 0 0 0 2 0 2 2 0 0 0 -2 -2h-17a2 2 0 0 0 -2 2 1 1 0 0 0 1 1Z"
                    fill="currentColor"
                    strokeWidth="1"
                  ></path>
                </g>
              </svg>
              <div>
                <h3 className="font-medium text-zinc-900 text-lg mb-1 leading-tight tracking-wide">
                  Organize with groups
                </h3>
                <p className="text-zinc-600 text-sm">
                  Create collections to categorize your bookmarks. Keep work,
                  personal, and inspiration separate.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="w-5 h-5 mr-3 mt-1 text-zinc-700 shrink-0"
              >
                <g>
                  <path
                    d="M15.67 6a1.5 1.5 0 1 0 3 0 1.5 1.5 0 1 0 -3 0"
                    fill="currentColor"
                    strokeWidth="1"
                  ></path>
                  <path
                    d="M10.58 16.53a5.52 5.52 0 0 0 8.5 4.66 0.26 0.26 0 0 1 0.31 0l2.48 2.49a1 1 0 0 0 0.71 0.29 1 1 0 0 0 0.71 -0.29 1 1 0 0 0 0 -1.42l-2.49 -2.45a0.24 0.24 0 0 1 0 -0.31 5.53 5.53 0 1 0 -10.19 -3Zm9.06 0A3.53 3.53 0 1 1 16.11 13a3.54 3.54 0 0 1 3.53 3.53Z"
                    fill="currentColor"
                    strokeWidth="1"
                  ></path>
                  <path
                    d="M21.17 0H14a3 3 0 0 0 -2.12 0.88l-11 11a3 3 0 0 0 0 4.24l6.17 6.17a3 3 0 0 0 4.24 0l0.14 -0.14a0.23 0.23 0 0 0 0.07 -0.15 0.23 0.23 0 0 0 -0.08 -0.18 7.17 7.17 0 0 1 -1 -1.06 0.25 0.25 0 0 0 -0.18 -0.1 0.27 0.27 0 0 0 -0.19 0.08l-0.17 0.17a1 1 0 0 1 -1.42 0l-6.17 -6.2a1 1 0 0 1 0 -1.42l11 -11A1 1 0 0 1 14 2h6.67a0.5 0.5 0 0 1 0.5 0.5v6.67a1 1 0 0 1 -0.29 0.71l-0.67 0.67a0.27 0.27 0 0 0 -0.08 0.19 0.29 0.29 0 0 0 0.1 0.18 7.67 7.67 0 0 1 1.06 1 0.21 0.21 0 0 0 0.18 0.09 0.26 0.26 0 0 0 0.19 -0.07l0.63 -0.64a3 3 0 0 0 0.88 -2.12V2a2 2 0 0 0 -2 -2Z"
                    fill="currentColor"
                    strokeWidth="1"
                  ></path>
                </g>
              </svg>
              <div>
                <h3 className="font-medium text-zinc-900 text-lg mb-1 leading-tight tracking-wide">
                  Instant search
                </h3>
                <p className="text-zinc-600 text-sm">
                  Find any bookmark by title, URL, or group. Results appear as
                  you type.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="w-5 h-5 mr-3 mt-1 text-zinc-700 shrink-0"
              >
                <path
                  d="M5.75 10.25h13.5c2.65 0 4.5 -1.64 4.5 -4s-1.85 -4 -4.5 -4h-6a1 1 0 0 1 -1 -1 1 1 0 0 0 -2 0 3 3 0 0 0 3 3h6c1.21 0 2.5 0.53 2.5 2s-1.29 2 -2.5 2H5.75c-2.29 0 -4 2.38 -4 4.5v0.75a0.25 0.25 0 0 1 -0.25 0.25h-0.25a1 1 0 0 0 -1 1v8a1 1 0 0 0 1 1h20a1 1 0 0 0 1 -1v-8a1 1 0 0 0 -1 -1H4a0.25 0.25 0 0 1 -0.25 -0.25v-0.75c0 -1.12 0.92 -2.5 2 -2.5Zm-1.5 9.5h-0.5a0.5 0.5 0 0 1 0 -1h0.5a0.5 0.5 0 0 1 0 1Zm14.5 -3.5h0.5a0.5 0.5 0 0 1 0 1h-0.5a0.5 0.5 0 0 1 0 -1Zm0 2.5h0.5a0.5 0.5 0 0 1 0 1h-0.5a0.5 0.5 0 0 1 0 -1Zm-3 -2.5h0.5a0.5 0.5 0 0 1 0 1h-0.5a0.5 0.5 0 0 1 0 -1Zm0 2.5h0.5a0.5 0.5 0 0 1 0 1h-0.5a0.5 0.5 0 0 1 0 -1Zm-3 -2.5h0.5a0.5 0.5 0 0 1 0 1h-0.5a0.5 0.5 0 0 1 0 -1Zm0 2.5h0.5a0.5 0.5 0 0 1 0 1h-0.5a0.5 0.5 0 0 1 0 -1Zm-3 -2.5h0.5a0.5 0.5 0 0 1 0 1h-0.5a0.5 0.5 0 0 1 0 -1Zm0 2.5h0.5a0.5 0.5 0 0 1 0 1h-0.5a0.5 0.5 0 0 1 0 -1Zm-3 -2.5h0.5a0.5 0.5 0 0 1 0 1h-0.5a0.5 0.5 0 0 1 0 -1Zm0 2.5h0.5a0.5 0.5 0 0 1 0 1h-0.5a0.5 0.5 0 0 1 0 -1Zm-1 2.5h11a0.5 0.5 0 0 1 0 1h-11a0.5 0.5 0 0 1 0 -1Zm-1.5 -5a0.5 0.5 0 0 1 0 1h-0.5a0.5 0.5 0 0 1 0 -1Z"
                  fill="currentColor"
                  strokeWidth="1"
                ></path>
              </svg>
              <div>
                <h3 className="font-medium text-zinc-900 text-lg mb-1 leading-tight tracking-wide">
                  Keyboard shortcuts
                </h3>
                <p className="text-zinc-600 text-sm">
                  Navigate, search, and manage everything without touching your
                  mouse. Built for speed.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="w-5 h-5 mr-3 mt-1 text-zinc-700 shrink-0"
              >
                <g>
                  <path
                    d="M12 21.26a7.56 7.56 0 0 1 -2.66 0.48 0.75 0.75 0 1 0 0 1.5 9.1 9.1 0 0 0 2.82 -0.45 0.26 0.26 0 0 0 0.18 -0.23v-1.07a0.27 0.27 0 0 0 -0.11 -0.2 0.24 0.24 0 0 0 -0.23 -0.03Z"
                    fill="currentColor"
                    strokeWidth="1"
                  ></path>
                  <path
                    d="M17.12 9.27a0.29 0.29 0 0 0 0.1 0.27 0.26 0.26 0 0 0 0.21 0.05 4.13 4.13 0 0 1 1 -0.1 0.21 0.21 0 0 0 0.21 -0.22 9.14 9.14 0 0 0 -1.94 -5.65 0.75 0.75 0 0 0 -1 -0.14 0.72 0.72 0 0 0 -0.13 1.05 7.79 7.79 0 0 1 1.55 4.74Z"
                    fill="currentColor"
                    strokeWidth="1"
                  ></path>
                  <path
                    d="M6.36 21.13A7.74 7.74 0 0 1 1.62 14v-1.9a0.74 0.74 0 0 0 -0.74 -0.75 0.75 0.75 0 0 0 -0.76 0.75V14a9.23 9.23 0 0 0 5.66 8.52 0.72 0.72 0 0 0 0.29 0.06 0.75 0.75 0 0 0 0.29 -1.44Z"
                    fill="currentColor"
                    strokeWidth="1"
                  ></path>
                  <path
                    d="M0.85 9.54a0.75 0.75 0 0 0 0.79 -0.71 7.75 7.75 0 0 1 11.61 -6.28 0.75 0.75 0 0 0 1 -0.27 0.76 0.76 0 0 0 -0.28 -1A9.25 9.25 0 0 0 0.14 8.75a0.74 0.74 0 0 0 0.71 0.79Z"
                    fill="currentColor"
                    strokeWidth="1"
                  ></path>
                  <path
                    d="M14.47 11.41a0.26 0.26 0 0 0 0.28 -0.09 4.19 4.19 0 0 1 0.94 -0.94 0.23 0.23 0 0 0 0.1 -0.2v-0.91a6.41 6.41 0 0 0 -8.41 -6.1 0.75 0.75 0 0 0 0.45 1.43 4.75 4.75 0 0 1 1.55 -0.25 4.93 4.93 0 0 1 4.91 4.92v1.9a0.25 0.25 0 0 0 0.18 0.24Z"
                    fill="currentColor"
                    strokeWidth="1"
                  ></path>
                  <path
                    d="M12.25 18.14a0.24 0.24 0 0 0 -0.26 0 4.88 4.88 0 0 1 -2.61 0.76A4.93 4.93 0 0 1 4.46 14V9.27A5 5 0 0 1 5.71 6a0.76 0.76 0 0 0 0 -1.06 0.77 0.77 0 0 0 -1.12 0.06A6.43 6.43 0 0 0 3 9.27V14a6.42 6.42 0 0 0 6.42 6.42 6.35 6.35 0 0 0 2.86 -0.69 0.26 0.26 0 0 0 0.14 -0.22v-1.15a0.25 0.25 0 0 0 -0.17 -0.22Z"
                    fill="currentColor"
                    strokeWidth="1"
                  ></path>
                  <path
                    d="M9.38 5.68a3.59 3.59 0 0 0 -3.59 3.59v1.41a0.75 0.75 0 0 0 1.5 0V9.27a2.09 2.09 0 1 1 4.17 0V14a2.09 2.09 0 0 1 -4.17 0 0.75 0.75 0 1 0 -1.5 0 3.59 3.59 0 0 0 6.56 2 0.28 0.28 0 0 0 0 -0.13 1.79 1.79 0 0 1 0.46 -1.14 0.31 0.31 0 0 0 0.06 -0.13A4 4 0 0 0 13 14V9.27a3.59 3.59 0 0 0 -3.62 -3.59Z"
                    fill="currentColor"
                    strokeWidth="1"
                  ></path>
                  <path
                    d="M10.12 13.51v-2.83a0.75 0.75 0 0 0 -0.74 -0.75 0.76 0.76 0 0 0 -0.76 0.75v2.83a0.75 0.75 0 0 0 0.76 0.75 0.74 0.74 0 0 0 0.74 -0.75Z"
                    fill="currentColor"
                    strokeWidth="1"
                  ></path>
                  <path
                    d="M22.59 15.5a0.25 0.25 0 0 1 -0.21 -0.25v-1a3.5 3.5 0 0 0 -7 0v1a0.26 0.26 0 0 1 -0.22 0.25 1.5 1.5 0 0 0 -1.28 1.5v5.5a1.5 1.5 0 0 0 1.5 1.5h7a1.51 1.51 0 0 0 1.5 -1.5V17a1.51 1.51 0 0 0 -1.29 -1.5Zm-3.71 5.74a1 1 0 1 1 1 -1 1 1 0 0 1 -1 1Zm1.5 -6a0.26 0.26 0 0 1 -0.26 0.25h-2.5a0.25 0.25 0 0 1 -0.24 -0.25v-1a1.5 1.5 0 1 1 3 0Z"
                    fill="currentColor"
                    strokeWidth="1"
                  ></path>
                </g>
              </svg>
              <div>
                <h3 className="font-medium text-zinc-900 text-lg mb-1 leading-tight tracking-wide">
                  Private by default
                </h3>
                <p className="text-zinc-600 text-sm">
                  Your bookmarks are yours alone. No tracking, no ads, no data
                  selling.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="w-5 h-5 mr-3 mt-1 text-zinc-700 shrink-0"
              >
                <g>
                  <path
                    d="M8 0H3a3 3 0 0 0 -3 3v5a3 3 0 0 0 3 3h5a3 3 0 0 0 3 -3V3a3 3 0 0 0 -3 -3Zm1 8a1 1 0 0 1 -1 1H3a1 1 0 0 1 -1 -1V3a1 1 0 0 1 1 -1h5a1 1 0 0 1 1 1Z"
                    fill="currentColor"
                    strokeWidth="1"
                  ></path>
                  <path
                    d="M8 13H3a3 3 0 0 0 -3 3v5a3 3 0 0 0 3 3h5a3 3 0 0 0 3 -3v-5a3 3 0 0 0 -3 -3Zm1 8a1 1 0 0 1 -1 1H3a1 1 0 0 1 -1 -1v-5a1 1 0 0 1 1 -1h5a1 1 0 0 1 1 1Z"
                    fill="currentColor"
                    strokeWidth="1"
                  ></path>
                  <path
                    d="M14.25 3h9a0.75 0.75 0 0 0 0 -1.5h-9a0.75 0.75 0 0 0 0 1.5Z"
                    fill="currentColor"
                    strokeWidth="1"
                  ></path>
                  <path
                    d="M23.25 4.5h-9a0.75 0.75 0 0 0 0 1.5h9a0.75 0.75 0 0 0 0 -1.5Z"
                    fill="currentColor"
                    strokeWidth="1"
                  ></path>
                  <path
                    d="M23.25 7.5h-9a0.75 0.75 0 0 0 0 1.5h9a0.75 0.75 0 0 0 0 -1.5Z"
                    fill="currentColor"
                    strokeWidth="1"
                  ></path>
                  <path
                    d="M23.25 14.5h-9a0.75 0.75 0 0 0 0 1.5h9a0.75 0.75 0 0 0 0 -1.5Z"
                    fill="currentColor"
                    strokeWidth="1"
                  ></path>
                  <path
                    d="M23.25 17.5h-9a0.75 0.75 0 0 0 0 1.5h9a0.75 0.75 0 0 0 0 -1.5Z"
                    fill="currentColor"
                    strokeWidth="1"
                  ></path>
                  <path
                    d="M23.25 20.5h-9a0.75 0.75 0 0 0 0 1.5h9a0.75 0.75 0 0 0 0 -1.5Z"
                    fill="currentColor"
                    strokeWidth="1"
                  ></path>
                </g>
              </svg>
              <div>
                <h3 className="font-medium text-zinc-900 text-lg mb-1 leading-tight tracking-wide">
                  Minimal interface
                </h3>
                <p className="text-zinc-600 text-sm">
                  No clutter, no distractions. Just your bookmarks in a clean,
                  focused layout.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="w-5 h-5 mr-3 mt-1 text-zinc-700 shrink-0"
              >
                <path
                  fill="currentColor"
                  fillRule="evenodd"
                  d="M2.23035 12.0487c0 -5.39291 4.32797 -9.72088 9.72095 -9.72088 2.6659 0 5.1002 1.10388 6.8705 2.85713l-0.421 0.29034c-0.3294 0.22718 -0.4917 0.62884 -0.4125 1.02108 0.0792 0.39223 0.3846 0.6995 0.7763 0.78111l2.3391 0.48732c0.0395 0.00822 0.0792 0.01401 0.119 0.0174 0.1711 0.01476 0.3475 -0.01433 0.5116 -0.09197 0.043 -0.02025 0.0846 -0.04366 0.1247 -0.07015l0.0038 -0.00249c0.2309 -0.15374 0.3789 -0.38975 0.4275 -0.64608l0.4852 -2.42615c0.0799 -0.39942 -0.0904 -0.80738 -0.4307 -1.03136 -0.3402 -0.22398 -0.7822 -0.21922 -1.1176 0.01203l-0.7352 0.50707C18.3492 1.77426 15.312 0.32782 11.9513 0.32782 5.45375 0.32782 0.230347 5.55122 0.230347 12.0487c0 0.5523 0.447715 1 1.000003 1 0.55228 0 1 -0.4477 1 -1Zm6.9288 -6.44142c-1.48488 0.66085 -2.69692 1.82386 -3.42046 3.27335h2.66279c0.17045 -1.12282 0.42914 -2.22293 0.75767 -3.27335ZM5.19466 10.3806c-0.12322 0.5198 -0.18843 1.062 -0.18843 1.6194 0 0.5944 0.07414 1.1714 0.21369 1.7224h3.03559c-0.07951 -0.8354 -0.10506 -1.682 -0.07325 -2.537 0.01 -0.2686 0.02557 -0.537 0.04649 -0.8048H5.20099l-0.00633 0Zm0.59655 4.8418c0.75404 1.4499 2.00102 2.6024 3.51883 3.2353 -0.37253 -1.0502 -0.65939 -2.131 -0.85232 -3.2353H5.79121Zm5.31459 3.7147c0.2928 0.0374 0.5912 0.0567 0.8942 0.0567 0.303 0 0.6014 -0.0193 0.8942 -0.0567 0.0069 -0.0225 0.015 -0.045 0.0242 -0.0672 0.4873 -1.1768 0.8568 -2.3965 1.0953 -3.6475H9.98625c0.23855 1.251 0.60805 2.4707 1.09535 3.6475 0.0092 0.0222 0.0173 0.0447 0.0242 0.0672Zm3.5842 -0.4794c1.5178 -0.6329 2.7648 -1.7854 3.5188 -3.2353h-2.6665c-0.193 1.1043 -0.4798 2.1851 -0.8523 3.2353Zm4.0901 -4.7353c0.1395 -0.551 0.2137 -1.128 0.2137 -1.7224 0 -0.5574 -0.0652 -1.0996 -0.1885 -1.6194l-0.0062 0h-3.0278c0.0209 0.2678 0.0364 0.5362 0.0464 0.8048 0.0318 0.855 0.0063 1.7016 -0.0732 2.537h3.0356Zm-0.5188 -4.84177c-0.7235 -1.44949 -1.9356 -2.6125 -3.4205 -3.27335 0.3286 1.05042 0.5873 2.15053 0.7577 3.27335h2.6628Zm-5.1637 -3.78878c-0.3576 -0.05636 -0.7242 -0.08562 -1.0976 -0.08562 -0.3734 0 -0.74 0.02926 -1.0976 0.08562 -0.0073 0.03807 -0.0177 0.07609 -0.0313 0.11378 -0.4189 1.16302 -0.7468 2.40404 -0.95346 3.675h4.16476c-0.2067 -1.27096 -0.5346 -2.51198 -0.9535 -3.675 -0.0136 -0.03769 -0.024 -0.07571 -0.0313 -0.11378Zm1.2206 6.13145c0.0313 0.842 0.0023 1.6761 -0.0835 2.4991H9.76527c-0.08582 -0.823 -0.11482 -1.6571 -0.08348 -2.4991 0.01046 -0.2811 0.02755 -0.5622 0.05095 -0.8427h4.53456c0.0234 0.2805 0.0405 0.5616 0.0509 0.8427ZM1.44294 14.0111c0.53104 -0.1517 1.08452 0.1558 1.23625 0.6868 0.52822 1.8488 1.58584 3.441 3.01071 4.6877 0.41564 0.3637 0.45776 0.9955 0.09408 1.4111 -0.36369 0.4156 -0.99545 0.4578 -1.41108 0.0941 -1.69394 -1.4822 -2.97542 -3.3987 -3.616759 -5.6434 -0.151725 -0.531 0.155768 -1.0845 0.686799 -1.2363Zm6.4311 6.8701c-0.50468 -0.2243 -1.09565 0.003 -1.31995 0.5077 -0.2243 0.5047 0.00299 1.0957 0.50767 1.32 0.95544 0.4246 2.00235 0.7371 3.03644 0.9439 0.5416 0.1083 1.0684 -0.2429 1.1767 -0.7845 0.1083 -0.5415 -0.2429 -1.0684 -0.7844 -1.1767 -0.91519 -0.183 -1.81757 -0.4553 -2.61646 -0.8104Zm8.43716 0.9876c0.1746 0.5239 -0.1085 1.0903 -0.6325 1.2649 -0.677 0.2257 -1.3393 0.3329 -2.0266 0.4311 -0.5467 0.0781 -1.0533 -0.3018 -1.1314 -0.8485 -0.0781 -0.5467 0.3018 -1.0533 0.8486 -1.1314 0.6772 -0.0967 1.1845 -0.1844 1.677 -0.3486 0.5239 -0.1746 1.0902 0.1086 1.2649 0.6325Zm3.672 -1.2422c0.4312 -0.345 0.5011 -0.9743 0.1561 -1.4056 -0.345 -0.4312 -0.9743 -0.5011 -1.4055 -0.1561l-1.462 1.1695c-0.4312 0.345 -0.5012 0.9743 -0.1561 1.4056 0.345 0.4312 0.9743 0.5012 1.4055 0.1562l1.462 -1.1696Zm2.259 -5.1838c0.494 0.247 0.6942 0.8477 0.4472 1.3417l-0.5847 1.1695c-0.247 0.494 -0.8477 0.6942 -1.3417 0.4472 -0.494 -0.247 -0.6942 -0.8476 -0.4472 -1.3416l0.5848 -1.1696c0.247 -0.4939 0.8476 -0.6942 1.3416 -0.4472Zm1.5275 -3.0041c0 -0.5523 -0.4478 -1 -1 -1 -0.5523 0 -1 0.4477 -1 1 0 0.4253 -0.0093 0.5477 -0.0462 0.6584 -0.1746 0.524 0.1085 1.0903 0.6325 1.2649 0.5239 0.1747 1.0902 -0.1085 1.2649 -0.6324 0.1499 -0.4496 0.1493 -0.8886 0.1488 -1.2351l0 -0.0558Z"
                  clipRule="evenodd"
                  strokeWidth="1"
                ></path>
              </svg>
              <div>
                <h3 className="font-medium text-zinc-900 text-lg mb-1 leading-tight tracking-wide">
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

        {/* <div className="mx-auto max-w-[600px]">
          <div className="relative mx-auto mb-2 flex max-w-[450px] items-center justify-center">
            <h2 className="z-10 bg-white px-5 text-lg font-medium text-zinc-900">
              Pricing
            </h2>
            <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-zinc-200"></div>
          </div>
          <p className="mx-auto max-w-[450px] text-center text-sm text-zinc-600">
            Save and organize your bookmarks beautifully. Upgrade to unlock
            unlimited storage, data portability, and sharing.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1 rounded-lg border border-zinc-200 bg-white px-4 py-5">
              <a
                href="/signup"
                className="absolute right-4 top-4 rounded-full bg-zinc-900 px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
              >
                Sign up
              </a>
              <h3 className="mb-1 text-xl font-semibold">Free</h3>
              <p className="text-lg">$0</p>
              <p className="my-4 text-sm text-zinc-600">
                All the essentials to organize your bookmarks beautifully.
              </p>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2 text-sm">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="size-4 text-zinc-900"
                    height="24"
                    width="24"
                  >
                    <g>
                      <path
                        d="M22.29 16.12a3 3 0 0 0 0 -4.24l-11 -11A3 3 0 0 0 9.17 0H2a2 2 0 0 0 -2 2v7.17a3 3 0 0 0 0.88 2.12l11 11a3 3 0 0 0 4.24 0Zm-1.41 -1.41 -6.18 6.17a1 1 0 0 1 -1.41 0l-11 -11A1 1 0 0 1 2 9.17V2.5a0.5 0.5 0 0 1 0.5 -0.5h6.67a1 1 0 0 1 0.71 0.29l11 11a1 1 0 0 1 0 1.42Z"
                        fill="#000000"
                        strokeWidth="1"
                      ></path>
                      <path
                        d="M4.5 6a1.5 1.5 0 1 0 3 0 1.5 1.5 0 1 0 -3 0"
                        fill="#000000"
                        strokeWidth="1"
                      ></path>
                    </g>
                  </svg>
                  <span>Up to 100 bookmarks</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    height="24"
                    width="24"
                    className="size-4 text-zinc-900"
                  >
                    <g>
                      <path
                        d="M21.5 2.5h-19a2 2 0 0 0 -2 2v3a1 1 0 0 0 1 1h21a1 1 0 0 0 1 -1v-3a2 2 0 0 0 -2 -2Z"
                        fill="#000000"
                        strokeWidth="1"
                      ></path>
                      <path
                        d="M21.5 10h-19a1 1 0 0 0 -1 1v8.5a2 2 0 0 0 2 2h17a2 2 0 0 0 2 -2V11a1 1 0 0 0 -1 -1Zm-6.25 3.5A1.25 1.25 0 0 1 14 14.75h-4a1.25 1.25 0 0 1 0 -2.5h4a1.25 1.25 0 0 1 1.25 1.25Z"
                        fill="#000000"
                        strokeWidth="1"
                      ></path>
                    </g>
                  </svg>
                  <span>5 groups with custom colors</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    height="24"
                    width="24"
                    className="size-4 text-zinc-900"
                  >
                    <path
                      d="m23.91 16.29 -1.35 -4.82a2.5 2.5 0 0 0 -3.08 -1.73l-0.76 0.21 0.53 -0.66a2.49 2.49 0 0 0 -0.38 -3.51L15 2.64a2.49 2.49 0 0 0 -3.53 0.36l-1 1.26a0.22 0.22 0 0 1 -0.27 0.08 0.25 0.25 0 0 1 -0.2 -0.21V2.5A2.5 2.5 0 0 0 7.5 0h-5A2.5 2.5 0 0 0 0 2.5v16.31A5.15 5.15 0 0 0 4.51 24L5 24c1 0 0.49 0 17.16 -4.63a2.51 2.51 0 0 0 1.75 -3.08ZM13 4.27a0.51 0.51 0 0 1 0.34 -0.18 0.48 0.48 0 0 1 0.37 0.11l3.89 3.14a0.49 0.49 0 0 1 0.07 0.7l-7.25 9a0.25 0.25 0 0 1 -0.27 0.08 0.26 0.26 0 0 1 -0.17 -0.24V8.11a0.25 0.25 0 0 1 0.08 -0.11ZM5 9a2 2 0 1 1 -2 2 2 2 0 0 1 2 -2ZM3 4.5a2 2 0 1 1 2 2 2 2 0 0 1 -2 -2Zm2 11a2 2 0 1 1 -2 2 2 2 0 0 1 2 -2Zm16.63 1.94 -10.81 3a0.23 0.23 0 0 1 -0.27 -0.11 0.24 0.24 0 0 1 0 -0.29l6 -7.38a0.22 0.22 0 0 1 0.13 -0.08l3.32 -0.92a0.5 0.5 0 0 1 0.61 0.35L22 16.83a0.49 0.49 0 0 1 -0.37 0.61Z"
                      fill="#000000"
                      strokeWidth="1"
                    ></path>
                  </svg>

                  <span>Link, color &amp; text bookmarks</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    id="Tags-Edit-Alternate--Streamline-Ultimate"
                    height="24"
                    width="24"
                    className="size-4 text-zinc-900"
                  >
                    <g>
                      <path
                        d="M15.67 6a1.5 1.5 0 1 0 3 0 1.5 1.5 0 1 0 -3 0"
                        fill="#000000"
                        strokeWidth="1"
                      ></path>
                      <path
                        d="M12.78 20a0.52 0.52 0 0 0 -0.48 -0.13 0.51 0.51 0 0 0 -0.35 0.35l-0.89 3.1a0.49 0.49 0 0 0 0.13 0.49 0.47 0.47 0 0 0 0.35 0.15l0.14 0 3.1 -0.89a0.51 0.51 0 0 0 0.35 -0.35 0.52 0.52 0 0 0 -0.13 -0.48Z"
                        fill="#000000"
                        strokeWidth="1"
                      ></path>
                      <path
                        d="M18.81 13.23a0.48 0.48 0 0 0 -0.7 0l-5 5a0.48 0.48 0 0 0 0 0.7l3 3a0.48 0.48 0 0 0 0.7 0l5 -5a0.48 0.48 0 0 0 0 -0.7Z"
                        fill="#000000"
                        strokeWidth="1"
                      ></path>
                      <path
                        d="m9.62 23 0.54 -2a0.18 0.18 0 0 0 -0.07 -0.19 0.17 0.17 0 0 0 -0.21 0 1 1 0 0 1 -1.42 0l-6.17 -6.1a1 1 0 0 1 0 -1.42l11 -11A1 1 0 0 1 14 2h6.67a0.5 0.5 0 0 1 0.5 0.5v6.74a0.23 0.23 0 0 0 0.07 0.19 0.23 0.23 0 0 0 0.18 0.08 4.06 4.06 0 0 1 1.39 0.24 0.26 0.26 0 0 0 0.21 0 0.25 0.25 0 0 0 0.12 -0.19l0 -0.37V2a2 2 0 0 0 -2 -2H14a3 3 0 0 0 -2.12 0.88l-11 11a3 3 0 0 0 0 4.24l6.17 6.17a3 3 0 0 0 2.12 0.88h0.22a0.26 0.26 0 0 0 0.22 -0.17Z"
                        fill="#000000"
                        strokeWidth="1"
                      ></path>
                      <path
                        d="M19.52 11.81a0.51 0.51 0 0 0 -0.15 0.35 0.53 0.53 0 0 0 0.15 0.36l3 3a0.54 0.54 0 0 0 0.38 0.12 0.58 0.58 0 0 0 0.38 -0.17 2.61 2.61 0 0 0 0 -3.7 2.66 2.66 0 0 0 -3.76 0.04Z"
                        fill="#000000"
                        strokeWidth="1"
                      ></path>
                    </g>
                  </svg>

                  <span>Auto-fetch page metadata</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    height="24"
                    width="24"
                    className="size-4 text-zinc-900"
                  >
                    <g>
                      <path
                        d="M10.17 19.79a0.26 0.26 0 0 1 0 -0.31 5.5 5.5 0 1 0 -10 -1.7 5.45 5.45 0 0 0 4.08 4.11 5.51 5.51 0 0 0 4.23 -0.72 0.24 0.24 0 0 1 0.3 0l2.51 2.51a1 1 0 0 0 1.41 0 1 1 0 0 0 0 -1.42ZM5.5 20A3.5 3.5 0 1 1 9 16.53 3.5 3.5 0 0 1 5.5 20Z"
                        fill="#000000"
                        strokeWidth="1"
                      ></path>
                      <path
                        d="M20 7.5a1 1 0 0 0 -1 -1h-7a1 1 0 0 0 0 2h7a1 1 0 0 0 1 -1Z"
                        fill="#000000"
                        strokeWidth="1"
                      ></path>
                      <path
                        d="M12.5 11a1 1 0 0 0 0 2h4a1 1 0 0 0 0 -2Z"
                        fill="#000000"
                        strokeWidth="1"
                      ></path>
                      <path
                        d="M23.41 3 21 0.59A2 2 0 0 0 19.59 0H8a2 2 0 0 0 -2 2v7.3a0.24 0.24 0 0 0 0.22 0.24 7.62 7.62 0 0 1 1.45 0.31 0.24 0.24 0 0 0 0.33 -0.23V2.5a0.5 0.5 0 0 1 0.5 -0.5h10.88a0.47 0.47 0 0 1 0.35 0.15l2.12 2.12a0.47 0.47 0 0 1 0.15 0.35V18a0.5 0.5 0 0 1 -0.5 0.5h-9.12a0.26 0.26 0 0 0 -0.24 0.17 6.33 6.33 0 0 1 -0.37 0.94 0.39 0.39 0 0 0 0.06 0.39l0.37 0.37a0.35 0.35 0 0 0 0.26 0.13H22a2 2 0 0 0 2 -2V4.41A2 2 0 0 0 23.41 3Z"
                        fill="#000000"
                        strokeWidth="1"
                      ></path>
                    </g>
                  </svg>
                  <span>Search &amp; keyboard shortcuts</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-check size-4 text-zinc-900"
                  >
                    <path d="M20 6 9 17l-5-5"></path>
                  </svg>
                  <span>Works on any device</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    height="24"
                    width="24"
                    className="size-4 text-zinc-900"
                  >
                    <path
                      fill="#000000"
                      fillRule="evenodd"
                      d="M5.80688 9.24941C6.86449 7.66164 9.1385 5.50342 11.8769 5.50342c1.8513 0 3.4075 0.77714 4.5912 1.87355l-0.9152 0.73224c-0.2368 0.18952 -0.3362 0.50305 -0.2518 0.7944 0.0845 0.29135 0.3361 0.50315 0.6376 0.53663l3.2621 0.36229c0.1977 0.02196 0.396 -0.03553 0.5513 -0.1598 0.1553 -0.12427 0.2549 -0.30516 0.2769 -0.50286l0.3622 -3.26221c0.0334 -0.3015 -0.118 -0.59347 -0.3837 -0.73977 -0.2658 -0.1463 -0.5935 -0.11812 -0.8303 0.0714l-1.135 0.90817c-1.5054 -1.48019 -3.5869 -2.61404 -6.1653 -2.61404 -3.74086 0 -6.53996 2.84382 -7.73456 4.63724 -0.30617 0.45964 -0.18175 1.08047 0.27789 1.38664 0.45965 0.30617 1.08047 0.18176 1.38665 -0.27789ZM1.39206 12.3853c-0.538471 0 -0.974091 0.4356 -0.974091 0.9741v6.1632c0 0.5385 0.43562 0.9741 0.974091 0.9741h4.53047c0.53848 0 0.9741 -0.4356 0.9741 -0.9741v-5.253c0 -0.2579 -0.10274 -0.5123 -0.29493 -0.6979l-0.94622 -0.9083c-0.18553 -0.1833 -0.43256 -0.2781 -0.68114 -0.2781H1.39206Zm8.36915 0c-0.53848 0 -0.9741 0.4356 -0.9741 0.9741v6.1632c0 0.5385 0.43562 0.9741 0.9741 0.9741h4.53049c0.5384 0 0.9741 -0.4356 0.9741 -0.9741v-5.253c0 -0.2579 -0.1028 -0.5123 -0.295 -0.6979l-0.9462 -0.9083c-0.1855 -0.1833 -0.4325 -0.2781 -0.6811 -0.2781H9.76121Zm8.31639 0c-0.5385 0 -0.9741 0.4356 -0.9741 0.9741v6.1632c0 0.5385 0.4356 0.9741 0.9741 0.9741h4.5305c0.5385 0 0.9741 -0.4356 0.9741 -0.9741v-5.253c0 -0.2579 -0.1028 -0.5123 -0.295 -0.6979l-0.9462 -0.9083c-0.1855 -0.1833 -0.4325 -0.2781 -0.6811 -0.2781h-3.5823Z"
                      clipRule="evenodd"
                      strokeWidth="1"
                    ></path>
                  </svg>
                  <span>Move between groups</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    height="24"
                    width="24"
                    className="size-4 text-zinc-900"
                  >
                    <path
                      d="M23.72 11.35a5.14 5.14 0 0 0 -3.25 -4.25 5.49 5.49 0 0 0 -5.57 0.9l-2.74 2.28a0.24 0.24 0 0 1 -0.32 0L9.12 8a5.43 5.43 0 0 0 -5.78 -0.75A5.22 5.22 0 0 0 0.25 11.9v0.1l0 0.64a5.12 5.12 0 0 0 3.25 4.25A5.47 5.47 0 0 0 9.1 16l2.74 -2.28a0.24 0.24 0 0 1 0.32 0L14.9 16a5.46 5.46 0 0 0 5.57 0.85 5.12 5.12 0 0 0 3.25 -4.25l0 -0.64c0 -0.22 0.02 -0.39 0 -0.61ZM7.5 14.12a3 3 0 0 1 -3 0.46 2.64 2.64 0 0 1 -1.7 -2.2l0 -0.44a2.72 2.72 0 0 1 1.58 -2.45 3.21 3.21 0 0 1 1.28 -0.28 2.88 2.88 0 0 1 1.86 0.68l2.3 1.92a0.25 0.25 0 0 1 0.09 0.19 0.28 0.28 0 0 1 -0.09 0.19Zm13.73 -1.74a2.64 2.64 0 0 1 -1.7 2.2 3 3 0 0 1 -3 -0.46l-2.32 -1.93a0.28 0.28 0 0 1 -0.09 -0.19 0.25 0.25 0 0 1 0.09 -0.19l2.29 -1.93a3 3 0 0 1 3 -0.46 2.63 2.63 0 0 1 1.7 2.2l0 0.38c0 0.13 0.04 0.26 0.03 0.38Z"
                      fill="#000000"
                      strokeWidth="1"
                    ></path>
                  </svg>
                  <span>Unlimited data retention</span>
                </div>
              </div>
            </div>
            <div className="relative flex-1 rounded-lg border border-zinc-200 bg-white px-4 py-5">
              <a
                href="/signup"
                className="absolute right-4 top-4 rounded-full bg-zinc-900 px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
              >
                Sign up
              </a>
              <h3 className="mb-1 text-xl font-semibold">Pro</h3>
              <p className="text-lg">
                $5.99<span className="text-sm">/mo</span>
              </p>
              <p className="my-4 text-sm text-zinc-600">
                Unlimited storage, data portability, and sharing features.
              </p>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2 text-sm">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    height="24"
                    width="24"
                    className="size-4 text-zinc-900"
                  >
                    <g>
                      <path
                        d="M8.85 11a0.23 0.23 0 0 0 0.23 0.23 0.88 0.88 0 0 0 0 -1.75 0.23 0.23 0 0 0 -0.23 0.23Z"
                        fill="#000000"
                        strokeWidth="1"
                      ></path>
                      <path
                        d="M21.5 4h-19A2.5 2.5 0 0 0 0 6.5v11A2.5 2.5 0 0 0 2.5 20h19a2.5 2.5 0 0 0 2.5 -2.5v-11A2.5 2.5 0 0 0 21.5 4Zm-0.4 7.9a0.75 0.75 0 0 1 0 1.5h-1.6a0.25 0.25 0 0 0 -0.25 0.25V14a0.55 0.55 0 0 0 0.55 0.55h1.3a0.75 0.75 0 0 1 0 1.5h-1.3A2.05 2.05 0 0 1 17.75 14v-3.9A2.05 2.05 0 0 1 19.8 8h1.3a0.75 0.75 0 0 1 0 1.5h-1.3a0.55 0.55 0 0 0 -0.55 0.55v1.6a0.25 0.25 0 0 0 0.25 0.25Zm-5.2 0a0.75 0.75 0 1 1 0 1.5h-1.6a0.25 0.25 0 0 0 -0.25 0.25V14a0.55 0.55 0 0 0 0.55 0.55h1.3a0.75 0.75 0 1 1 0 1.5h-1.3a2.05 2.05 0 0 1 -2 -2.05v-3.9a2.05 2.05 0 0 1 2 -2.1h1.3a0.75 0.75 0 1 1 0 1.5h-1.3a0.55 0.55 0 0 0 -0.55 0.55v1.6a0.25 0.25 0 0 0 0.25 0.25Zm-4.56 3a0.75 0.75 0 0 1 -0.25 1 0.72 0.72 0 0 1 -0.39 0.11 0.75 0.75 0 0 1 -0.64 -0.36l-0.75 -1.25a0.25 0.25 0 0 0 -0.46 0.13v0.72a0.75 0.75 0 0 1 -1.5 0v-6.5A0.76 0.76 0 0 1 8.1 8h1a2.38 2.38 0 0 1 2.37 2.38 2.36 2.36 0 0 1 -1.24 2.08 0.26 0.26 0 0 0 -0.13 0.16 0.32 0.32 0 0 0 0 0.19Zm-6.49 -3a0.75 0.75 0 0 1 0 1.5H3.9a0.25 0.25 0 0 0 -0.25 0.25v1.6a0.75 0.75 0 0 1 -1.5 0v-5.2A2.05 2.05 0 0 1 4.2 8h1.3a0.75 0.75 0 0 1 0 1.5H4.2a0.55 0.55 0 0 0 -0.55 0.55v1.6a0.25 0.25 0 0 0 0.25 0.25Z"
                        fill="#000000"
                        strokeWidth="1"
                      ></path>
                    </g>
                  </svg>
                  <span>Everything in Free</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    height="24"
                    width="24"
                    className="size-4 text-zinc-900"
                  >
                    <g>
                      <path
                        d="M19.29 17a3 3 0 0 0 0 -4.24l-8 -8a3 3 0 0 0 -2.12 -0.88H2a2 2 0 0 0 -2 2V13a3 3 0 0 0 0.88 2.12l8 8a3 3 0 0 0 4.24 0Zm-1.41 -1.41 -6.18 6.12a1 1 0 0 1 -1.41 0l-8 -8A1 1 0 0 1 2 13V6.33a0.5 0.5 0 0 1 0.5 -0.5h6.67a1 1 0 0 1 0.71 0.29l8 8a1 1 0 0 1 0 1.42Z"
                        fill="#000000"
                        strokeWidth="1"
                      ></path>
                      <path
                        d="M4.5 9.83a1.5 1.5 0 1 0 3 0 1.5 1.5 0 1 0 -3 0"
                        fill="#000000"
                        strokeWidth="1"
                      ></path>
                      <path
                        d="M3.83 2.25a0.25 0.25 0 0 0 0.25 0.25h1.54a0.26 0.26 0 0 0 0.24 -0.17 0.49 0.49 0 0 1 0.47 -0.33H13a1 1 0 0 1 0.71 0.29l8 8a1 1 0 0 1 0 1.42l-0.72 0.71a0.26 0.26 0 0 0 0 0.35l1.06 1.06a0.25 0.25 0 0 0 0.36 0l0.71 -0.71a3 3 0 0 0 0 -4.24l-8 -8A3 3 0 0 0 13 0H5.83a2 2 0 0 0 -2 2Z"
                        fill="#000000"
                        strokeWidth="1"
                      ></path>
                    </g>
                  </svg>
                  <span>Unlimited bookmarks</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    height="24"
                    width="24"
                    className="size-4 text-zinc-900"
                  >
                    <g>
                      <path
                        d="M22.5 13.5h-21A1.5 1.5 0 0 0 0 15v7a1.5 1.5 0 0 0 1.5 1.5h21A1.5 1.5 0 0 0 24 22v-7a1.5 1.5 0 0 0 -1.5 -1.5Zm-7 3.25a0.76 0.76 0 0 1 -0.75 0.75h-5.5a0.75 0.75 0 0 1 0 -1.5h5.5a0.75 0.75 0 0 1 0.75 0.75Z"
                        fill="#000000"
                        strokeWidth="1"
                      ></path>
                      <path
                        d="M3 12a1 1 0 0 0 1 -1V8a0.5 0.5 0 0 1 0.5 -0.5h7.38a0.28 0.28 0 0 1 0.2 0.1l1.12 1.5a1 1 0 0 0 0.8 0.4h5.5a0.5 0.5 0 0 1 0.5 0.5v1a1 1 0 0 0 2 0V9.5a2 2 0 0 0 -2 -2h-5.5l-0.9 -1.2a2 2 0 0 0 -1.6 -0.8H4a2 2 0 0 0 -2 2V11a1 1 0 0 0 1 1Z"
                        fill="#000000"
                        strokeWidth="1"
                      ></path>
                      <path
                        d="M3 4.5a1 1 0 0 0 1 -1V3a0.5 0.5 0 0 1 0.5 -0.5h7.38a0.28 0.28 0 0 1 0.2 0.1l1.12 1.5a1 1 0 0 0 0.8 0.4h6a1 1 0 0 0 2 0 2 2 0 0 0 -2 -2h-5.5l-0.9 -1.2A2 2 0 0 0 12 0.5H4a2 2 0 0 0 -2 2v1a1 1 0 0 0 1 1Z"
                        fill="#000000"
                        strokeWidth="1"
                      ></path>
                    </g>
                  </svg>
                  <span>Unlimited groups</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    height="24"
                    width="24"
                    className="size-4 text-zinc-900"
                  >
                    <g>
                      <path
                        d="M10.55 5.65a0.25 0.25 0 0 1 -0.25 0.25H8.6a1 1 0 0 0 -0.69 1.66L11.32 11a1 1 0 0 0 1.38 0l3.42 -3.42a1 1 0 0 0 -0.69 -1.66h-1.7a0.25 0.25 0 0 1 -0.25 -0.25v-4.2a1.47 1.47 0 1 0 -2.93 0Z"
                        fill="#000000"
                        strokeWidth="1"
                      ></path>
                      <path
                        d="M20.81 14.2H3.19a2.94 2.94 0 0 0 -2.94 2.94v3.92A2.94 2.94 0 0 0 3.19 24h17.62a2.94 2.94 0 0 0 2.94 -2.93v-3.93a2.94 2.94 0 0 0 -2.94 -2.94Zm-15.91 5a0.74 0.74 0 0 1 0.74 -0.74h3.61a0.74 0.74 0 1 1 0 1.47H5.64a0.74 0.74 0 0 1 -0.74 -0.72Zm14 1.36a1.47 1.47 0 1 1 1.47 -1.47 1.46 1.46 0 0 1 -1.52 1.48Z"
                        fill="#000000"
                        strokeWidth="1"
                      ></path>
                    </g>
                  </svg>
                  <span>Import from browser (HTML, JSON)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    height="24"
                    width="24"
                    className="size-4 text-zinc-900"
                  >
                    <path
                      fill="#000000"
                      fillRule="evenodd"
                      d="M0.21875 4c0 -2.18629 1.81371 -4 4 -4H18.4688c0.9501 0 1.75 0.799891 1.75 1.75v0.81759c-0.6168 -0.41215 -1.4083 -0.49889 -2.1111 -0.20778 -0.8408 0.34826 -1.3889 1.16869 -1.3889 2.07873v1.5615h-2.9376c-1.3807 0 -2.5 1.11929 -2.5 2.5S12.4005 11 13.7812 11h2.9376v1.5618c0 0.91 0.5481 1.7305 1.3889 2.0787 0.7028 0.2911 1.4943 0.2044 2.1111 -0.2077v0.8172c0 0.8654 -0.6637 1.6062 -1.5 1.7314V19.75h0.5c0.5522 0 1 0.4477 1 1s-0.4478 1 -1 1h-8.875v1.75c0 0.1879 -0.1054 0.36 -0.2728 0.4454 -0.16743 0.0854 -0.36858 0.0697 -0.52073 -0.0406l-2.20652 -1.5997 -2.20652 1.5997c-0.15214 0.1103 -0.3533 0.126 -0.5207 0.0406 -0.1674 -0.0854 -0.27278 -0.2575 -0.27278 -0.4454v-1.75h-0.75c-1.82211 0 -3.306972 -1.444 -3.372728 -3.25H0.21875V4Zm2.00133 14.4361c0.03199 0.7311 0.63477 1.3139 1.37367 1.3139h0.75v-1c0 -0.2761 0.22386 -0.5 0.5 -0.5h5c0.27615 0 0.50005 0.2239 0.50005 0.5v1h6.375V17H3.71875c-0.80703 0 -1.46521 0.6373 -1.49867 1.4361ZM5.09375 12.75c-0.62132 0 -1.125 -0.5037 -1.125 -1.125s0.50368 -1.125 1.125 -1.125 1.125 0.5037 1.125 1.125 -0.50368 1.125 -1.125 1.125Zm0 -3.5c-0.62132 0 -1.125 -0.50368 -1.125 -1.125S4.47243 7 5.09375 7s1.125 0.50368 1.125 1.125 -0.50368 1.125 -1.125 1.125Zm0 -3.5c-0.62132 0 -1.125 -0.50368 -1.125 -1.125S4.47243 3.5 5.09375 3.5s1.125 0.50368 1.125 1.125 -0.50368 1.125 -1.125 1.125Zm13.58795 7.5047c-0.2802 -0.1161 -0.4629 -0.3896 -0.4629 -0.6929V9.5h-4.4376c-0.5522 0 -1 -0.44772 -1 -1 0 -0.55229 0.4478 -1 1 -1h4.4376V4.4385c0 -0.30335 0.1827 -0.57683 0.4629 -0.69291 0.2803 -0.11609 0.6029 -0.05192 0.8174 0.16258l4.0616 4.06163c0.1407 0.14065 0.2197 0.33142 0.2197 0.53033 0 0.19891 -0.079 0.38968 -0.2197 0.53033l-4.0616 4.06164c-0.2145 0.2145 -0.5371 0.2787 -0.8174 0.1626Z"
                      clipRule="evenodd"
                      strokeWidth="1"
                    ></path>
                  </svg>
                  <span>Export (HTML, JSON, CSV)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    height="24"
                    width="24"
                    className="size-4 text-zinc-900"
                  >
                    <path
                      fill="#000000"
                      fillRule="evenodd"
                      d="m6.387 0.945 0.42 1.26c0.105 0.42 0.63 0.736 1.05 0.63l1.26 -0.315c1.156 -0.21 1.891 1.05 1.156 1.891l-0.945 0.945a0.824 0.824 0 0 0 0 1.156l0.945 0.945c0.736 0.84 0 2.206 -1.155 1.89l-1.26 -0.104c-0.42 -0.105 -0.946 0.105 -1.05 0.63l-0.421 1.26a1.135 1.135 0 0 1 -2.206 0l-0.42 -1.26c-0.105 -0.42 -0.63 -0.735 -1.05 -0.63l-1.26 0.315C0.294 9.768 -0.44 8.508 0.294 7.668l0.945 -0.946a0.824 0.824 0 0 0 0 -1.155L0.4 4.41c-0.735 -0.84 0 -2.206 1.155 -1.89l1.26 0.315c0.42 0.105 0.946 -0.105 1.051 -0.63l0.42 -1.261c0.21 -1.155 1.786 -1.155 2.1 0Zm0.473 5.094a1.576 1.576 0 1 1 -3.151 0 1.576 1.576 0 0 1 3.15 0ZM0 10.795v6.198a2.966 2.966 0 0 0 2.956 2.966h5.81l-0.481 1.93H6.133a1 1 0 1 0 0 2h2.911l0.047 0h5.818l0.047 0h2.91a1 1 0 0 0 0 -2h-2.151l-0.48 -1.93h5.81A2.966 2.966 0 0 0 24 16.992V5.201a2.966 2.966 0 0 0 -2.956 -2.965H11.65c0.384 0.575 0.546 1.289 0.374 2h9.021c0.519 0 0.956 0.432 0.956 0.965v11.792a0.966 0.966 0 0 1 -0.956 0.966h-7.068l-0.04 0h-3.872l-0.04 0H2.956A0.966 0.966 0 0 1 2 16.992v-6.026l-0.186 0.046A2.733 2.733 0 0 1 0 10.795Zm13.174 9.164h-2.348l-0.48 1.93h3.308l-0.48 -1.93Zm3.504 -7.512a1 1 0 1 0 -1.79 -0.894l-2 4a1 1 0 1 0 1.79 0.894l2 -4Zm-4.688 -0.154a1 1 0 0 1 0 1.414l-0.793 0.793 0.793 0.793a1 1 0 1 1 -1.414 1.414l-1.5 -1.5a1 1 0 0 1 0 -1.414l1.5 -1.5a1 1 0 0 1 1.414 0Zm5.886 0a1 1 0 0 1 1.415 0l1.5 1.5a1 1 0 0 1 0 1.414l-1.5 1.5a1 1 0 0 1 -1.415 -1.414l0.793 -0.793 -0.793 -0.793a1 1 0 0 1 0 -1.414Z"
                      clipRule="evenodd"
                      strokeWidth="1"
                    ></path>
                  </svg>
                  <span>API access for integrations</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    height="24"
                    width="24"
                    className="size-4 text-zinc-900"
                  >
                    <g>
                      <path
                        d="M22 0H2a2 2 0 0 0 -2 2v7a2 2 0 0 0 2 2h20a2 2 0 0 0 2 -2V2a2 2 0 0 0 -2 -2Zm-7.25 8.5a0.5 0.5 0 0 1 -0.5 0.5H2.5a0.5 0.5 0 0 1 -0.5 -0.5v-6a0.5 0.5 0 0 1 0.5 -0.5h11.75a0.5 0.5 0 0 1 0.5 0.5ZM21 6.86a0.72 0.72 0 0 1 -1.18 0.56L18.07 6a0.74 0.74 0 0 1 0 -1.14l1.75 -1.36a0.72 0.72 0 0 1 1.18 0.56Z"
                        fill="#000000"
                        strokeWidth="1"
                      ></path>
                      <path
                        d="M4 4.75h7.5a0.75 0.75 0 0 0 0 -1.5H4a0.75 0.75 0 0 0 0 1.5Z"
                        fill="#000000"
                        strokeWidth="1"
                      ></path>
                      <path
                        d="M4 7.75h4.5a0.75 0.75 0 0 0 0 -1.5H4a0.75 0.75 0 0 0 0 1.5Z"
                        fill="#000000"
                        strokeWidth="1"
                      ></path>
                      <path
                        d="M22 13H2a2 2 0 0 0 -2 2v7a2 2 0 0 0 2 2h20a2 2 0 0 0 2 -2v-7a2 2 0 0 0 -2 -2Zm-7.25 8.5a0.5 0.5 0 0 1 -0.5 0.5H2.5a0.5 0.5 0 0 1 -0.5 -0.5v-6a0.5 0.5 0 0 1 0.5 -0.5h11.75a0.5 0.5 0 0 1 0.5 0.5ZM21 19.86a0.72 0.72 0 0 1 -1.18 0.56L18.07 19a0.74 0.74 0 0 1 0 -1.14l1.75 -1.39a0.72 0.72 0 0 1 1.18 0.56Z"
                        fill="#000000"
                        strokeWidth="1"
                      ></path>
                      <path
                        d="M4 17.75h7.5a0.75 0.75 0 0 0 0 -1.5H4a0.75 0.75 0 0 0 0 1.5Z"
                        fill="#000000"
                        strokeWidth="1"
                      ></path>
                      <path
                        d="M4 20.75h4.5a0.75 0.75 0 0 0 0 -1.5H4a0.75 0.75 0 0 0 0 1.5Z"
                        fill="#000000"
                        strokeWidth="1"
                      ></path>
                    </g>
                  </svg>
                  <span>Public &amp; shared collections</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    height="24"
                    width="24"
                    className="size-4 text-zinc-900"
                  >
                    <g>
                      <path
                        d="M17.17 16.16a2.52 2.52 0 0 0 -3.54 0l-0.38 0.39a46.57 46.57 0 0 1 -5.79 -5.79l0.38 -0.39a2.49 2.49 0 0 0 0 -3.53L5.72 4.72a2.54 2.54 0 0 0 -3.53 0L1 5.88a3.51 3.51 0 0 0 -0.44 4.4 47 47 0 0 0 13.16 13.15 3.55 3.55 0 0 0 4.41 -0.43l1.16 -1.16a2.51 2.51 0 0 0 0 -3.54Z"
                        fill="#000000"
                        strokeWidth="1"
                      ></path>
                      <path
                        d="M23 0a5.69 5.69 0 0 0 -5.69 5.68v0.94a1 1 0 0 0 1 1H22v0.88a1 1 0 0 0 2 0V1a1 1 0 0 0 -1 -1Zm-1 5.63h-2.69A3.71 3.71 0 0 1 22 2.14Z"
                        fill="#000000"
                        strokeWidth="1"
                      ></path>
                      <path
                        d="M11.28 4.35a1 1 0 0 0 1 -1 1.34 1.34 0 0 1 2.66 -0.27c0.14 0.67 0 0.89 -0.95 1.7l-3.37 3a1 1 0 0 0 0.66 1.75h5.16a1 1 0 0 0 0 -2h-2.52l1.39 -1.23c0.92 -0.81 2 -1.73 1.59 -3.6a3.34 3.34 0 0 0 -6.62 0.67 1 1 0 0 0 1 0.98Z"
                        fill="#000000"
                        strokeWidth="1"
                      ></path>
                    </g>
                  </svg>
                  <span>Priority support</span>
                </div>
              </div>
            </div>
          </div>
        </div> */}

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
            © {new Date().getFullYear()} minimal.so - Save and organize your
            bookmarks beautifully
          </p>
        </footer>
      </div>
    </div>
  );
}
