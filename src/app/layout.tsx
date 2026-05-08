import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

export const dynamic = "force-dynamic";

import { Toaster } from "@/components/ui/sonner";
import { SupabaseProvider } from "@/components/providers/SupabaseProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import "./globals.css";

// ---------------------------------------------------------------------------
// Fonts
// ---------------------------------------------------------------------------

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

// ---------------------------------------------------------------------------
// SEO Metadata
// ---------------------------------------------------------------------------

export const metadata: Metadata = {
  title: {
    default: "JanaVaani — Voice Of The People",
    template: "%s | JanaVaani",
  },
  description:
    "Unified AI-Powered Civic Grievance Intelligence Platform. India's system to bridge the gap between citizens and local governance.",
  keywords: [
    "JanaVaani",
    "Voice Of The People",
    "Civic Tech",
    "CPGRAMS",
    "Government",
    "India",
    "Grievance Intelligence",
    "Bhashini",
  ],
  authors: [{ name: "Team JanaVaani" }],
  manifest: "/manifest.json",
  openGraph: {
    title: "JanaVaani — Voice Of The People",
    description:
      "Unified AI-Powered Civic Grievance Intelligence Platform.",
    type: "website",
    locale: "en_IN",
    siteName: "JanaVaani",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Prevent zoom for mobile-first PWA experience
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1b2e" },
  ],
};

// ---------------------------------------------------------------------------
// Root Layout
// ---------------------------------------------------------------------------

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider defaultTheme="dark">
          <SupabaseProvider>
            {children}
            <Toaster
              position="top-center"
              richColors
              closeButton
              toastOptions={{
                duration: 4000,
              }}
            />
          </SupabaseProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
