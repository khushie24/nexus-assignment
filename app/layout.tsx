import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NexusIntel | Founder Competitive Intelligence",
  description:
    "Analyze competitors, identify market gaps, generate leads, and decide what to build next.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
