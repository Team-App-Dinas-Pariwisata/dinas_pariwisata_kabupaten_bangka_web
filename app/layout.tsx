import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import Preloader from "@/components/Preloader";
import GuestSupportChat from "@/components/public/GuestSupportChat";

const montserrat = Montserrat({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-montserrat",
});

const defaultBaseUrl = (process.env.APP_BASE_URL || "https://siparik.bangka.go.id").replace(/\/+$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(defaultBaseUrl),
  title: {
    default: "Dinas Pariwisata dan Kebudayaan Kabupaten Bangka | SI PARIK BANGKA",
    template: "%s | Dinas Pariwisata Kabupaten Bangka",
  },
  description:
    "Portal resmi Dinas Pariwisata dan Kebudayaan Kabupaten Bangka (SI PARIK). Eksplorasi keindahan destinasi wisata pantai, kuliner khas, kalender acara pariwisata, penginapan, dan direktori pelaku ekonomi kreatif Kabupaten Bangka.",
  keywords: [
    "Wisata Bangka",
    "Dinas Pariwisata Kabupaten Bangka",
    "SI PARIK BANGKA",
    "Tempat Wisata Sungailiat",
    "Pantai di Bangka",
    "Kuliner Khas Bangka",
    "Ekonomi Kreatif Bangka",
    "Event Pariwisata Bangka",
    "Hotel di Bangka",
    "Pariwisata Bangka Belitung",
  ],
  authors: [{ name: "Dinas Pariwisata dan Kebudayaan Kabupaten Bangka", url: defaultBaseUrl }],
  creator: "Dinas Pariwisata dan Kebudayaan Kabupaten Bangka",
  publisher: "Pemerintah Kabupaten Bangka",
  formatDetection: {
    telephone: true,
    email: true,
    address: true,
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
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: defaultBaseUrl,
    title: "Dinas Pariwisata dan Kebudayaan Kabupaten Bangka | SI PARIK",
    description:
      "Jelajahi keindahan destinasi wisata pantai, ragam kuliner khas, kalender event, dan direktori ekonomi kreatif Kabupaten Bangka.",
    siteName: "SI PARIK BANGKA",
    images: [
      {
        url: "/hero-bangka.jpg",
        width: 1200,
        height: 630,
        alt: "Dinas Pariwisata dan Kebudayaan Kabupaten Bangka",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dinas Pariwisata dan Kebudayaan Kabupaten Bangka | SI PARIK",
    description:
      "Portal resmi informasi wisata, destinasi, dan ekonomi kreatif Kabupaten Bangka.",
    images: ["/hero-bangka.jpg"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/favicon.png",
  },
};

const jsonLdData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "GovernmentOrganization",
      "@id": `${defaultBaseUrl}/#organization`,
      name: "Dinas Pariwisata dan Kebudayaan Kabupaten Bangka",
      alternateName: ["SI PARIK BANGKA", "Disparbud Kabupaten Bangka"],
      url: defaultBaseUrl,
      logo: `${defaultBaseUrl}/favicon.png`,
      description:
        "Instansi pemerintah pengelola sektor pariwisata, kebudayaan, dan pengembangan ekonomi kreatif di Kabupaten Bangka.",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Sungailiat",
        addressRegion: "Kepulauan Bangka Belitung",
        addressCountry: "ID",
      },
    },
    {
      "@type": "WebSite",
      "@id": `${defaultBaseUrl}/#website`,
      url: defaultBaseUrl,
      name: "SI PARIK BANGKA - Dinas Pariwisata Kabupaten Bangka",
      description: "Portal resmi pariwisata dan ekonomi kreatif Kabupaten Bangka.",
      publisher: {
        "@id": `${defaultBaseUrl}/#organization`,
      },
      inLanguage: "id-ID",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={montserrat.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
        />
      </head>
      <body>
        <Preloader />
        {children}
        <GuestSupportChat />
      </body>
    </html>
  );
}
