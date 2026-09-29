import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { SITE } from "@/lib/constants";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  applicationName: SITE.shortName,
  title: {
    default: `${SITE.name} — ${SITE.collegeName}`,
    template: `%s · ${SITE.shortName}`,
  },
  description: SITE.description,
  keywords: [
    "AWS",
    "AWS Student Builder Group",
    "SUIIT",
    "Sambalpur University",
    "cloud computing",
    "AI",
    "GenAI",
    "DevOps",
    "student community",
    "workshops",
    "hackathons",
    "Community Day SUIIT 2026",
  ],
  authors: [{ name: SITE.name, url: SITE.url }],
  creator: SITE.name,
  publisher: SITE.name,
  category: "technology",
  formatDetection: { email: false, address: false, telephone: false },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: SITE.url,
    siteName: SITE.shortName,
    title: `${SITE.name} — ${SITE.collegeName}`,
    description: SITE.description,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: SITE.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — ${SITE.collegeName}`,
    description: SITE.description,
    images: [`${SITE.url}/opengraph-image`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  // Stable icon URLs (public/) so search-engine favicon crawlers see
  // fixed paths. File-convention icons (app/favicon.ico, icon*, apple-icon.png)
  // still emit hashed links for browsers.
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
      { url: "/icon0.svg", sizes: "any", type: "image/svg+xml" },
      { url: "/icon-96.png", sizes: "96x96", type: "image/png" },
      { url: "/web-app-manifest-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/web-app-manifest-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0e11",
  colorScheme: "dark",
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
};

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE.name,
  alternateName: SITE.shortName,
  url: SITE.url,
  logo: `${SITE.url}/logo.png`,
  description: SITE.description,
  email: SITE.email,
  address: {
    "@type": "PostalAddress",
    streetAddress: "Jyoti Vihar, Burla",
    addressLocality: "Sambalpur",
    addressRegion: "Odisha",
    addressCountry: "IN",
  },
  sameAs: [SITE.links.linkedin, SITE.links.instagram, SITE.links.whatsapp],
};

const siteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE.shortName,
  alternateName: SITE.name,
  url: SITE.url,
  publisher: { "@type": "Organization", name: SITE.name },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${plexSans.variable} ${plexMono.variable} h-full`}>
      <body className="flex min-h-full flex-col bg-ink font-sans text-cream antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
        />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-black"
        >
          Skip to content
        </a>
        <Navbar />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
