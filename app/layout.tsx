import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import Preloader from "@/components/Preloader";

const montserrat = Montserrat({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: "SI PARIK BANGKA Kabupaten Bangka",
  description:
    "Aplikasi Pendataan Pelaku Ekonomi Kreatif dan SDM Pariwisata Kabupaten Bangka.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={montserrat.variable}>
      <body>
        <Preloader />
        {children}
      </body>
    </html>
  );
}
