import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { QueryProvider } from "@/lib/query-provider";
import { ToasterProvider } from "@/components/toaster-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { Agentation } from "agentation";
import { APP_URL } from "@/lib/config";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const title = "minimal — simple bookmarking for everyone";
const description =
  "A clean, minimal bookmark manager. Save, organize, and share your bookmarks with ease.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    url: APP_URL,
    siteName: "minimal.so",
    images: [{ url: `${APP_URL}/api/og`, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [`${APP_URL}/api/og`],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
<Script
          defer
          src="https://analytics.duncan.land/script.js"
          data-website-id="9c4de642-a2b5-4747-ae7b-38096c43b993"
          strategy="afterInteractive"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <NuqsAdapter>
            <QueryProvider>{children}</QueryProvider>
          </NuqsAdapter>
        </ThemeProvider>
        <ToasterProvider />
        {process.env.NODE_ENV === "development" && <Agentation />}
      </body>
    </html>
  );
}
