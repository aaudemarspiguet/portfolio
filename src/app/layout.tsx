import type { Metadata, Viewport } from "next";
import { Inter, Geist_Mono, Neonderthaw } from "next/font/google";
import { NavBar } from "@/components/NavBar";
import { StudioViewProvider } from "@/components/StudioViewProvider";
import { ThemeScript } from "@/components/ThemeToggle";
import { isPreviewEnv } from "@/content/env";
import { workSlugs } from "@/content/projects";
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

const neonderthaw = Neonderthaw({
  variable: "--font-neon",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} – Portfolio`, template: `%s · ${site.name}` },
  description: site.description,
  // Link previews (iMessage, LinkedIn, Slack). The image comes from opengraph-image.tsx beside this file.
  openGraph: { type: "website", siteName: site.name, locale: "en_US" },
  twitter: { card: "summary_large_image" },
  // Production is indexed. Dev and preview builds are not.
  robots: { index: !isPreviewEnv, follow: !isPreviewEnv },
};

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5f7" },
    { media: "(prefers-color-scheme: dark)", color: "#121214" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} ${neonderthaw.variable}`}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body>
        <a href="#main" className="ln-skip">Skip to content</a>
        <StudioViewProvider>
          <NavBar workSlugs={workSlugs} />
          <div id="main">{children}</div>
        </StudioViewProvider>
      </body>
    </html>
  );
}
