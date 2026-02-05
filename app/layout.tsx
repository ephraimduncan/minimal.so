import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import { QueryProvider } from "@/lib/query-provider";
import { ToasterProvider } from "@/components/toaster-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://minimal.so";
const title = "minimal — simple bookmarking for everyone";
const description =
  "A clean, minimal bookmark manager. Save, organize, and share your bookmarks with ease.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    url: baseUrl,
    siteName: "minimal.so",
    images: [{ url: `${baseUrl}/api/og`, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [`${baseUrl}/api/og`],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {process.env.NODE_ENV === "development" && (
          <Script
            src="//unpkg.com/react-grab/dist/index.global.js"
            crossOrigin="anonymous"
            strategy="beforeInteractive"
          />
        )}
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
        <QueryProvider>{children}</QueryProvider>
        <ToasterProvider />
      </body>
    </html>
  );
}
