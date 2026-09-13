import type { Metadata, Viewport } from "next";
import { Poppins, Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "DARAJA — Le pont vers vos archives",
  description:
    "DARAJA, le SaaS d'archivage n°1 pour l'Afrique. Zéro papier. Zéro perte. Accédez à n'importe quel document en 1 seconde, depuis votre téléphone.",
  keywords: [
    "DARAJA",
    "archivage",
    "GED",
    "Afrique",
    "Mali",
    "Bamako",
    "OCR",
    "documents",
    "administration",
    "WhatsApp",
    "CinetPay",
    "Hostinger",
    "LWS",
  ],
  authors: [{ name: "DARAJA" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "DARAJA — Le pont vers vos archives",
    description:
      "Zéro papier. Zéro perte. Le SaaS d'archivage n°1 pour l'Afrique.",
    siteName: "DARAJA",
    type: "website",
    locale: "fr_FR",
  },
  twitter: {
    card: "summary_large_image",
    title: "DARAJA — Le pont vers vos archives",
    description:
      "Zéro papier. Zéro perte. Le SaaS d'archivage n°1 pour l'Afrique.",
  },
};

export const viewport: Viewport = {
  themeColor: "#003366",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${poppins.variable} ${inter.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
        <SonnerToaster richColors position="top-right" />
      </body>
    </html>
  );
}
