import type { Metadata, Viewport } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { NavBar } from "@/components/NavBar";
import { ThemeScript } from "@/components/ThemeToggle";
import { site } from "@/content/site";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  axes: ["opsz"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: { default: `${site.name} · ${site.role}`, template: `%s · ${site.name}` },
  description: `${site.role} building AI-powered products and the data systems under them.`,
  // Placeholder content: keep search engines out until the content phase.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  // The page starts light for everyone, so the browser toolbar does too.
  themeColor: "#f5f5f7",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-theme="light" className={`${inter.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body>
        <a href="#main" className="ln-skip">Skip to content</a>
        <NavBar />
        <main id="main">{children}</main>
      </body>
    </html>
  );
}
