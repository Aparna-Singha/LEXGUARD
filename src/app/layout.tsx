import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "LexGuard — AI Rights & Contract Intelligence",
  description:
    "Analyze contracts, offer letters, and legal documents for hidden risks, exploitative clauses, and ambiguous language before you sign. AI-powered legal awareness.",
  keywords: [
    "contract analysis",
    "legal AI",
    "risk detection",
    "clause analysis",
    "legal tech",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-surface text-slate-200">
        {children}
      </body>
    </html>
  );
}
