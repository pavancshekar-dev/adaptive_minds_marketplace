import type { Metadata } from "next";
import { Manrope, JetBrains_Mono } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Adaptive Minds Marketplace",
  description: "Browse, pull, and publish LoRA adapters for the Adaptive Minds agent runtime.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-graphite text-ivory">
        <SiteHeader />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
