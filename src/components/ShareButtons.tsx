"use client"

import { useState } from "react";

interface ShareButtonsProps {
  imageUrl: string;
  famousName: string;
  locale?: 'pt' | 'en';
}

export default function ShareButtons({ imageUrl, famousName, locale = 'pt' }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);

  const content = {
    pt: {
      title: "Compartilhe sua foto!",
      shareText: `Olha eu com ${famousName}! 🤩`,
      whatsapp: "WhatsApp",
      copyLink: "Copiar Link",
      download: "Baixar",
      linkCopied: "Link copiado!",
      sharingWait: "Preparando..."
    },
    en: {
      title: "Share your photo!",
      shareText: `Look at me with ${famousName}! 🤩`,
      whatsapp: "WhatsApp",
      copyLink: "Copy Link",
      download: "Download",
      linkCopied: "Link copied!",
      sharingWait: "Preparing..."
    }
  };

  const t = content[locale];
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareMessage = encodeURIComponent(t.shareText);

  // FUNÇÃO MÁGICA: Compartilha o arquivo real da imagem no Mobile
  const handleNativeShare = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Se o navegador der suporte para compartilhar arquivos (maioria dos celulares modernos)
    if (navigator.canShare && !sharing) {
      e.preventDefault(); // Cancela a abertura do link wa.me padrão
      setSharing(true);

      try {
        // Converte a imagem base64/URL em um Blob e depois em um File real
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const file = new File([blob], `foto-com-${famousName.toLowerCase().replace(/\s+/g, '-')}.png`, {
          type: "image/png",
        });

        const shareData = {
          files: [file],
          title: t.shareText,
          text: t.shareText,
        };

        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
        } else {
          // Se falhar na checagem do arquivo, abre o link tradicional do WhatsApp
          window.open(`https://wa.me/?text=${shareMessage}%20${encodeURIComponent(shareUrl)}`, '_blank');
        }
      } catch (err) {
        console.error("Erro ao compartilhar nativamente:", err);
        window.open(`https://wa.me/?text=${shareMessage}%20${encodeURIComponent(shareUrl)}`, '_blank');
      } finally {
        setSharing(false);
      }
    }
    // Se estiver no Desktop/Navegador antigo, não faz nada e deixa o comportamento padrão do link rodar
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const shareLinks = {
    whatsapp: `https://wa.me/?text=${shareMessage}%20${encodeURIComponent(shareUrl)}`,
  };

  return (
    <div className="p-6 bg-gray-50 rounded-2xl border border-gray-200">
      <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">
        {t.title}
      </h3>

      <div className="grid grid-cols-2 gap-3">
        <a
          href={shareLinks.whatsapp}
          onClick={handleNativeShare}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 px-4 py-3 bg-[#25D366] hover:bg-[#20BA5A] text-white rounded-xl font-medium transition-all duration-200 hover:scale-105"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
          </svg>
          {sharing ? t.sharingWait : t.whatsapp}
        </a>

        <button
          onClick={handleCopyLink}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-xl font-medium transition-all duration-200 hover:scale-105"
        >
          {copied ? (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {t.linkCopied}
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              {t.copyLink}
            </>
          )}
        </button>
      </div>
    </div>
  );
}