"use client"

import { useState, useEffect } from "react"

interface Props {
  generationId: string
  locale: "pt" | "en"
}

export default function SuccessActions({ generationId, locale }: Props) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [copied, setCopied] = useState(false)
  const [sharing, setSharing] = useState(false)

  const t = {
    pt: {
      download: "Baixar Imagem",
      loading: "Carregando imagem...",
      error: "Erro ao carregar. Tente novamente.",
      retry: "Tentar novamente",
      share: "Compartilhar",
      whatsapp: "WhatsApp",
      copyLink: "Copiar Link",
      linkCopied: "Link copiado!",
      shareTitle: "Compartilhe sua foto!",
      shareText: "Olha a foto que eu criei com IA!",
      preparing: "Preparando...",
    },
    en: {
      download: "Download Image",
      loading: "Loading image...",
      error: "Error loading. Try again.",
      retry: "Try again",
      share: "Share",
      whatsapp: "WhatsApp",
      copyLink: "Copy Link",
      linkCopied: "Link copied!",
      shareTitle: "Share your photo!",
      shareText: "Look at the photo I created with AI!",
      preparing: "Preparing...",
    },
  }

  const text = t[locale]
  const downloadUrl = `/api/download-image?id=${encodeURIComponent(generationId)}`

  useEffect(() => {
    const loadImage = async () => {
      try {
        setLoading(true)
        setError(false)
        const res = await fetch(downloadUrl)
        if (!res.ok) throw new Error("Failed")
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        setImageUrl(url)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    loadImage()
  }, [downloadUrl])

  const handleDownload = async () => {
    if (!imageUrl) return
    const link = document.createElement("a")
    link.href = imageUrl
    link.download = `foto-sem-marca-${generationId}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleWhatsApp = async () => {
    if (!imageUrl || sharing) return
    setSharing(true)
    try {
      const res = await fetch(imageUrl)
      const blob = await res.blob()
      const file = new File([blob], `foto-ia-${generationId}.png`, { type: "image/png" })
      const shareData = { files: [file], title: text.shareText, text: text.shareText }

      if (navigator.canShare?.(shareData)) {
        await navigator.share(shareData)
      } else {
        const shareUrl = typeof window !== "undefined" ? window.location.origin : ""
        window.open(
          `https://wa.me/?text=${encodeURIComponent(text.shareText)}%20${encodeURIComponent(shareUrl)}`,
          "_blank"
        )
      }
    } catch {
      const shareUrl = typeof window !== "undefined" ? window.location.origin : ""
      window.open(
        `https://wa.me/?text=${encodeURIComponent(text.shareText)}%20${encodeURIComponent(shareUrl)}`,
        "_blank"
      )
    } finally {
      setSharing(false)
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <div className="h-7 w-7 animate-spin rounded-full border-4 border-gray-300 border-t-purple-600" />
        <p className="text-sm text-gray-500">{text.loading}</p>
      </div>
    )
  }

  if (error || !imageUrl) {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <p className="text-sm text-red-500">{text.error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 rounded-xl bg-purple-600 text-white font-medium hover:bg-purple-700"
        >
          {text.retry}
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="w-full max-w-[500px] rounded-2xl overflow-hidden shadow-xl border border-gray-200">
        <img
          src={imageUrl}
          alt="Generated"
          className="w-full h-auto object-contain"
        />
      </div>

      <button
        onClick={handleDownload}
        className="w-full max-w-[500px] flex items-center justify-center gap-2 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold text-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        {text.download}
      </button>

      <div className="w-full max-w-[500px] p-5 bg-white rounded-2xl border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 text-center">{text.shareTitle}</h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleWhatsApp}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-[#25D366] hover:bg-[#20BA5A] text-white rounded-xl font-medium transition-all hover:scale-105"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            {sharing ? text.preparing : text.whatsapp}
          </button>

          <button
            onClick={handleCopyLink}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-xl font-medium transition-all hover:scale-105"
          >
            {copied ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {text.linkCopied}
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                {text.copyLink}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
