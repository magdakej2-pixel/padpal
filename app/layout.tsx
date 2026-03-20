import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#00897B",
};

export const metadata: Metadata = {
  title: "PadPal — Find Your Perfect Flatmate",
  description:
    "Swipe through verified profiles. AI matches you by lifestyle, not just budget. Join the UK's most trusted flatmate-finding platform.",
  keywords: [
    "flatmate",
    "roommate",
    "room rental",
    "flat share",
    "London rooms",
    "UK flatmates",
    "verified flatmates",
  ],
  authors: [{ name: "PadPal" }],
  openGraph: {
    title: "PadPal — Find Your Perfect Flatmate",
    description:
      "Swipe through verified profiles. AI matches you by lifestyle, not just budget.",
    type: "website",
    locale: "en_GB",
    siteName: "PadPal",
  },
  twitter: {
    card: "summary_large_image",
    title: "PadPal — Find Your Perfect Flatmate",
    description:
      "Swipe through verified profiles. AI matches you by lifestyle, not just budget.",
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
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="antialiased">
        <div className="mx-auto min-h-dvh max-w-md bg-white">
          {children}
        </div>
      </body>
    </html>
  );
}
