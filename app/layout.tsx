import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Great_Vibes, Lato } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const greatVibes = Great_Vibes({
  variable: "--font-script",
  subsets: ["latin"],
  weight: "400",
});

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Angel & Milagros · La Boda Pandaneiros",
  description: "Estás invitado a nuestra boda. Un día especial para compartir con quienes más amamos.",
  appleWebApp: { capable: true, statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${cormorant.variable} ${greatVibes.variable} ${lato.variable}`}
    >
      <body className="antialiased">{children}</body>
    </html>
  );
}
