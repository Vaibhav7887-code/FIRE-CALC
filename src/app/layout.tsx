import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/app/Providers";

export const metadata: Metadata = {
  title: "Budgeting Calculator",
  description: "Frontend-only budgeting + investing calculator for Canada/BC.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-CA">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

