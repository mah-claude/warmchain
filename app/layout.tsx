import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Warmchain — Warm Intros, Structured",
    template: "%s | Warmchain",
  },
  description: "Package your startup in 10 minutes. Share one link. Get warm intros that actually work.",
  metadataBase: new URL("https://warmchain.com"),
  openGraph: {
    title: "Warmchain — Warm Intros, Structured",
    description: "Package your startup in 10 minutes. Share one link. Get warm intros that actually work.",
    type: "website",
    url: "https://warmchain.com",
    siteName: "Warmchain",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Warmchain" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Warmchain — Warm Intros, Structured",
    description: "Package your startup in 10 minutes. Share one link. Get warm intros that actually work.",
    images: ["/og-image.png"],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
