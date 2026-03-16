import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
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
      <head>
        <meta name="google-site-verification" content="JfszQ1HknJKAl_ANtr6zZLngdqYYieLvAt0vb2f09I4" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Script id="hotjar" strategy="afterInteractive">{`
          (function(h,o,t,j,a,r){
            h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
            h._hjSettings={hjid:2663954,hjsv:6};
            a=o.getElementsByTagName('head')[0];
            r=o.createElement('script');r.async=1;
            r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
            a.appendChild(r);
          })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
        `}</Script>
        {children}
      </body>
    </html>
  );
}
