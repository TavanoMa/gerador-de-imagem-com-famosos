import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Gerador de Imagens com Famosos - Crie sua Foto com IA",
  description: "Crie fotos realistas ao lado das suas celebridades favoritas usando inteligência artificial. Compartilhe nas redes sociais e impressione seus amigos!",
  keywords: ["gerador de imagens", "IA", "famosos", "celebridades", "fotos com famosos", "inteligência artificial"],
  openGraph: {
    title: "Gerador de Imagens com Famosos - Crie sua Foto com IA",
    description: "Crie fotos realistas ao lado das suas celebridades favoritas usando inteligência artificial.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
