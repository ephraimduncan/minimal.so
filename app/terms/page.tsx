import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service - Minimal",
  description: "Terms of Service for Minimal bookmark manager",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
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

      <h1 className="mb-2 text-3xl font-semibold text-foreground text-balance">
        Terms of Service
      </h1>
      <p className="mb-8 text-sm text-muted-foreground text-pretty">
        Effective date: January 10, 2025
      </p>

      <div className="prose prose-zinc max-w-none">
        <section className="mb-8">
          <h2 className="mb-3 text-xl font-medium text-foreground text-balance">
            Agreement to Terms
          </h2>
          <p className="text-muted-foreground text-pretty">
            By accessing or using Minimal (&quot;the Service&quot;), you agree
            to be bound by these Terms of Service. If you do not agree to these
            terms, please do not use the Service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-medium text-foreground text-balance">
            Description of Service
          </h2>
          <p className="text-muted-foreground text-pretty">
            Minimal is a bookmark manager that allows you to save, organize, and
            access your bookmarks. The Service is provided &quot;as is&quot; and
            may be modified, updated, or discontinued at any time without prior
            notice.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-medium text-foreground text-balance">
            User Accounts
          </h2>
          <p className="mb-4 text-muted-foreground text-pretty">
            To use the Service, you must create an account. You are responsible
            for:
          </p>
          <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
            <li>Maintaining the security of your account credentials</li>
            <li>All activities that occur under your account</li>
            <li>Notifying us immediately of any unauthorized access</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-medium text-foreground text-balance">
            User Content
          </h2>
          <p className="mb-4 text-muted-foreground text-pretty">
            You retain ownership of the bookmarks and content you save to
            Minimal. By using the Service, you grant us a limited license to
            store and display your content solely for the purpose of providing
            the Service.
          </p>
          <p className="text-muted-foreground text-pretty">
            You are solely responsible for the content you save and must ensure
            you have the right to store and access such content.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-medium text-foreground text-balance">
            Acceptable Use
          </h2>
          <p className="mb-4 text-muted-foreground text-pretty">You agree not to:</p>
          <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
            <li>Use the Service for any unlawful purpose</li>
            <li>
              Attempt to gain unauthorized access to the Service or its systems
            </li>
            <li>Interfere with or disrupt the Service</li>
            <li>
              Reverse engineer, decompile, or attempt to extract the source code
            </li>
            <li>Use automated means to access the Service without permission</li>
            <li>Violate the rights of others</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-medium text-foreground text-balance">
            Intellectual Property
          </h2>
          <p className="text-muted-foreground text-pretty">
            The Service, including its design, code, and branding, is owned by
            Minimal and protected by intellectual property laws. This project is
            open source, and the source code is available under its respective
            license.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-medium text-foreground text-balance">
            Disclaimer of Warranties
          </h2>
          <p className="text-muted-foreground text-pretty">
            THE SERVICE IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTIES OF ANY
            KIND, EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE
            UNINTERRUPTED, ERROR-FREE, OR SECURE.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-medium text-foreground text-balance">
            Limitation of Liability
          </h2>
          <p className="text-muted-foreground text-pretty">
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, MINIMAL SHALL NOT BE LIABLE
            FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE
            DAMAGES ARISING FROM YOUR USE OF THE SERVICE.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-medium text-foreground text-balance">
            Termination
          </h2>
          <p className="text-muted-foreground text-pretty">
            We may suspend or terminate your access to the Service at any time,
            with or without cause. Upon termination, your right to use the
            Service will cease immediately. You may also delete your account at
            any time.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-medium text-foreground text-balance">
            Changes to Terms
          </h2>
          <p className="text-muted-foreground text-pretty">
            We reserve the right to modify these Terms at any time. We will
            notify users of significant changes by posting the updated terms on
            this page. Your continued use of the Service after changes
            constitutes acceptance of the new terms.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-medium text-foreground text-balance">Contact Us</h2>
          <p className="text-muted-foreground text-pretty">
            If you have any questions about these Terms of Service, please
            contact us at{" "}
            <a
              href="mailto:ephraimduncan68@gmail.com"
              className="text-foreground underline hover:no-underline"
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
