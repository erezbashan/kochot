import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import "./globals.css";

const rubik = Rubik({ subsets: ["hebrew", "latin"] });

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
      <body className={`${rubik.className} antialiased min-h-full flex flex-col bg-slate-50 text-slate-900`}>{children}</body>
    </html>
  );
}
