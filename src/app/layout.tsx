import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import Script from "next/script";
import { SiteHeader } from "@/components/site-header";
import { isAuthRequired } from "@/lib/auth";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s — ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "./" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
  },
  robots: { index: true, follow: true },
  keywords: [
    "bikepacking",
    "bikepacking setup",
    "bike bags",
    "gear list",
    "packing list",
    "gravel bike",
    "bike touring",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="flex min-h-screen flex-col">
        <SiteHeader showAuth={isAuthRequired()} />
        <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8">{children}</main>
        <footer className="border-t border-line py-5">
          <p className="mx-auto w-full max-w-6xl px-5 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
            Packrig — plan the load, ride far
          </p>
        </footer>
        <Script
          defer
          src="https://analytics.firgal.com/script.js"
          data-website-id="bbe3be2b-7e69-44ed-87b5-968a7989072e"
          strategy="afterInteractive"
        />
        <Script
          defer
          src="https://analytics.firgal.com/recorder.js"
          data-website-id="bbe3be2b-7e69-44ed-87b5-968a7989072e"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
