import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fruitbox Ranked",
  description: "Single-player gameplay prototype for Fruitbox Ranked.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="min-h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
