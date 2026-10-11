import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { Providers } from "@/components/theme";
import "./globals.css";

// Headings: Archivo, stretched wide via its width axis (set in globals.css).
const archivo = Archivo({ variable: "--font-archivo", subsets: ["latin"], axes: ["wdth"] });
const plexSans = IBM_Plex_Sans({ variable: "--font-plex-sans", subsets: ["latin"] });
// Numbers, logs and the run clock.
const plexMono = IBM_Plex_Mono({ variable: "--font-plex-mono", subsets: ["latin"], weight: ["400", "500"] });

export const metadata: Metadata = {
  title: { default: "Epoch", template: "%s · Epoch" },
  description: "Train yourself. One epoch at a time.",
  robots: { index: false, follow: false },
  // Tab icon (app/icon.svg) and iOS home-screen icon. Both listed: setting `icons` turns off the automatic link.
  icons: { icon: { url: "/icon.svg", type: "image/svg+xml" }, apple: "/icons/apple-180.png" },
  appleWebApp: { capable: true, title: "Epoch" },
};

export const viewport: Viewport = {
  // Lets the page draw under the iPhone home indicator; the bottom tab bar pads itself with safe-area insets.
  viewportFit: "cover",
  // Phone status bar colour = the page's paper colour.
  // ponytail: follows the OS setting, not the in-app toggle; sync it from ThemeToggle if that mismatch bothers you.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f5f7" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1320" },
  ],
};

// The top bar lives in (app)/layout.tsx, so the login page doesn't get it.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: next-themes sets class="dark" before React loads, which React would otherwise flag.
    <html
      lang="en"
      suppressHydrationWarning
      className={`${archivo.variable} ${plexSans.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
