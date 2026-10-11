import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Epoch", template: "%s · Epoch" },
  description: "Train yourself. One epoch at a time.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <header className="flex items-center gap-4 border-b border-line px-4 py-3">
          <Link href="/" className="font-bold">Epoch</Link>
          <Link href="/activity" className="text-sm text-muted">Activity</Link>
          <Link href="/schedule" className="text-sm text-muted">Schedule</Link>
          <Link href="/reviews" className="text-sm text-muted">Review</Link>
        </header>
        {children}
      </body>
    </html>
  );
}
