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
    <html lang="he" dir="rtl">
      <body className="antialiased min-h-full flex flex-col bg-gradient-to-br from-indigo-50 via-white to-purple-50 text-gray-900">{children}</body>
    </html>
  );
}
