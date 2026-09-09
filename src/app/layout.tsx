import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kochot (כוחות)",
  description: "Rate players and generate balanced teams",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-full flex flex-col">{children}</body>
    </html>
  );
}
