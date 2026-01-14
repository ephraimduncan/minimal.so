import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy - Minimal",
  description: "Privacy Policy for Minimal bookmark manager",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-2 text-sm text-zinc-500 transition-colors hover:text-zinc-900"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m12 19-7-7 7-7" />
          <path d="M19 12H5" />
        </svg>
        Back to home
      </Link>

      <h1 className="mb-2 text-3xl font-semibold text-zinc-900">
        Privacy Policy
      </h1>
      <p className="mb-8 text-sm text-zinc-500">
        Effective date: January 10, 2025
      </p>

      <div className="prose prose-zinc max-w-none">
        <section className="mb-8">
          <h2 className="mb-3 text-xl font-medium text-zinc-900">
            Introduction
          </h2>
          <p className="mb-4 text-zinc-600">
            Minimal (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is
            committed to protecting your privacy. This Privacy Policy explains
            how we collect, use, and share information when you use our bookmark
            manager service.
          </p>
          <p className="text-zinc-600">
            By using Minimal, you agree to the collection and use of information
            in accordance with this policy.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-medium text-zinc-900">
            Information We Collect
          </h2>

          <h3 className="mb-2 mt-4 text-lg font-medium text-zinc-800">
            Information You Provide
          </h3>
          <ul className="mb-4 list-disc space-y-2 pl-6 text-zinc-600">
            <li>
              <strong>Account Information:</strong> When you create an account,
              we collect your name, email address, and profile photo (if
              provided through a third-party authentication provider).
            </li>
            <li>
              <strong>Bookmarks:</strong> The URLs, titles, descriptions, and
              any tags or categories you create to organize your bookmarks.
            </li>
          </ul>

          <h3 className="mb-2 mt-4 text-lg font-medium text-zinc-800">
            Information Collected Automatically
          </h3>
          <ul className="list-disc space-y-2 pl-6 text-zinc-600">
            <li>
              <strong>Usage Data:</strong> We collect analytics data about how
              you interact with our service, including pages visited, features
              used, and time spent on the platform.
            </li>
            <li>
              <strong>Device Information:</strong> Browser type, operating
              system, and device identifiers.
            </li>
            <li>
              <strong>Log Data:</strong> IP address, access times, and referring
              URLs.
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-medium text-zinc-900">
            How We Use Your Information
          </h2>
          <p className="mb-4 text-zinc-600">We use the information we collect to:</p>
          <ul className="list-disc space-y-2 pl-6 text-zinc-600">
            <li>Provide, maintain, and improve our service</li>
            <li>Process and store your bookmarks</li>
            <li>Send you service-related communications</li>
            <li>Analyze usage patterns to enhance user experience</li>
            <li>Detect and prevent fraud or abuse</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-medium text-zinc-900">
            Information Sharing
          </h2>
          <p className="mb-4 text-zinc-600">
            We do not sell your personal information. We may share your
            information in the following circumstances:
          </p>
          <ul className="list-disc space-y-2 pl-6 text-zinc-600">
            <li>
              <strong>Service Providers:</strong> With third-party services that
              help us operate our platform (e.g., hosting, analytics).
            </li>
            <li>
              <strong>Legal Requirements:</strong> When required by law or to
              protect our rights and safety.
            </li>
            <li>
              <strong>Business Transfers:</strong> In connection with a merger,
              acquisition, or sale of assets.
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-medium text-zinc-900">
            Data Security
          </h2>
          <p className="text-zinc-600">
            We implement reasonable security measures to protect your
            information. However, no method of transmission over the Internet or
            electronic storage is 100% secure, and we cannot guarantee absolute
            security.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-medium text-zinc-900">Your Rights</h2>
          <p className="mb-4 text-zinc-600">You have the right to:</p>
          <ul className="list-disc space-y-2 pl-6 text-zinc-600">
            <li>Access the personal information we hold about you</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your account and associated data</li>
            <li>Export your bookmarks</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-medium text-zinc-900">
            Changes to This Policy
          </h2>
          <p className="text-zinc-600">
            We may update this Privacy Policy from time to time. We will notify
            you of any changes by posting the new policy on this page and
            updating the effective date.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-medium text-zinc-900">Contact Us</h2>
          <p className="text-zinc-600">
            If you have any questions about this Privacy Policy, please contact
            us at{" "}
            <a
              href="mailto:ephraimduncan68@gmail.com"
              className="text-zinc-900 underline hover:no-underline"
            >
              ephraimduncan68@gmail.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
