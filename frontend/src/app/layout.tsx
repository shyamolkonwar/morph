import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Morph | One Prompt. Every Platform.",
  description: "AI-powered layout engine that generates LinkedIn carousels, banners, and YouTube thumbnails in seconds. Type one prompt, get perfectly sized assets for every platform.",
  keywords: ["AI banner generator", "LinkedIn carousel maker", "YouTube thumbnail generator", "AI design tool", "content creation"],
  authors: [{ name: "Morph" }],
  openGraph: {
    title: "Morph | One Prompt. Every Platform.",
    description: "Generate LinkedIn Carousels & Banners in Seconds. Perfectly Sized.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Morph | One Prompt. Every Platform.",
    description: "Generate LinkedIn Carousels & Banners in Seconds. Perfectly Sized.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} antialiased bg-morph-bg text-morph-text`}
      >
        {children}
      </body>
    </html>
  );
}
