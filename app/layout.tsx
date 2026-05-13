import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { RenderWakeBridge } from "@/components/render-wake-bridge";

export const metadata: Metadata = {
  title: "Fruitbox Ranked",
  description: "Fruitbox Ranked multiplayer prototype with private rooms, accounts, and persistent player identity.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" className="min-h-full">
      <body className="min-h-full">
        <RenderWakeBridge />
        {children}
      </body>
    </html>
  );
}
