"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { signIn } from "next-auth/react"
import { getComboMembers, displayImageIndex } from "@/src/data/politics"

// Imagem de um membro com fallback jpg -> png (checa no mount por causa do SSR).
function MemberBgImg({ slug, className }: { slug: string; className: string }) {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const base = `${SUPABASE_URL}/storage/v1/object/public/famous_image/${slug}/${displayImageIndex(slug)}`
  const candidates = [`${base}.jpg?v4`, `${base}.png?v4`]
  const last = candidates.length - 1
  const [stage, setStage] = useState(0)
  const advance = () => setStage((s) => Math.min(s + 1, last))
  const measureRef = useCallback((el: HTMLImageElement | null) => {
    if (el && el.complete && el.naturalWidth === 0) {
      setStage((s) => (s < last ? s + 1 : s))
    }
  }, [last])
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img ref={measureRef} src={candidates[stage]} alt={slug} onError={advance} className={className} />
  )
}

type PixData = {
  generationId: string
  paymentId: string
  qrCodeBase64: string
  copiaECola: string
  mode: "prepaid" | "download"
}

type Props = {
  isLogged: boolean
  famousSlug: string
  famousName: string
  locale?: "pt" | "en"
  hasSavedPaymentInfo?: boolean
  freeUsed?: number
  freeLimit?: number
}

const GenerateImage = ({
  isLogged,
  famousSlug,
  locale = "pt",
  freeUsed = 0,
  freeLimit = 1,
}: Props) => {
  const [image, setImage] = useState<string | null>(null)
  const [isPaidImage, setIsPaidImage] = useState(false)
  const [generationId, setGenerationId] = useState<string | null>(null)
  const [prompt, setPrompt] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingSeconds, setLoadingSeconds] = useState(0)
  const [bgImageUrl, setBgImageUrl] = useState<string | null>(null)
  const [showTooltip, setShowTooltip] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const [paymentLoading, setPaymentLoading] = useState(false)
  const [pixData, setPixData] = useState<PixData | null>(null)
  const [copied, setCopied] = useState(false)

  // Quantas gerações o usuário já fez (vitalício). Acima do limite = pré-pago.
  const [genCount, setGenCount] = useState(freeUsed)
  const overLimit = genCount >= freeLimit
  const freeLeft = Math.max(freeLimit - genCount, 0)

  const inputRef = useRef<HTMLInputElement>(null)

  const comboMembers = getComboMembers(famousSlug)
  const isCombo = comboMembers.length > 1

  const isMobile =
    typeof window !== "undefined" &&
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

  useEffect(() => {
    if (!loading) {
      setLoadingSeconds(0)
      return
    }
    const interval = setInterval(() => {
      setLoadingSeconds((s) => Math.min(s + 1, 45))
    }, 1000)
    return () => clearInterval(interval)
  }, [loading])

  useEffect(() => {
    if (files.length === 0) {
      setPreviewUrls([])
      return
    }
    const loadImages = async () => {
      try {
        const promises = files.map((file) => {
          return new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = (e) => resolve(e.target?.result as string)
            reader.onerror = reject
            reader.readAsDataURL(file)
          })
        })
        const results = await Promise.all(promises)
        setPreviewUrls(results)
      } catch (err) {
        console.error("Erro ao gerar previews", err)
      }
    }
    loadImages()
  }, [files])

  useEffect(() => {
    if (famousSlug?.toLowerCase().trim() === "donald-trump") {
      const timestamp = new Date().getTime()
      setBgImageUrl(`/trump.png?t=${timestamp}`)
      return
    }
    // Combos mostram os dois membros lado a lado (ver render), não um fundo único.
    if (getComboMembers(famousSlug).length > 1) return
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!SUPABASE_URL) return
    const timestamp = new Date().getTime()
    const base = `${SUPABASE_URL}/storage/v1/object/public/famous_image/${famousSlug}/${displayImageIndex(famousSlug)}`
    const img = new Image()
    img.onload = () => setBgImageUrl(img.src)
    img.onerror = () => {
      const fallback = new Image()
      fallback.onload = () => setBgImageUrl(fallback.src)
      fallback.src = `${base}.png?t=${timestamp}`
    }
    img.src = `${base}.jpg?t=${timestamp}`
  }, [famousSlug])

  const translations = {
    pt: {
      generating: "Criando...",
      loginToGenerate: "Faça login para gerar imagens",
      promptPlaceholder: "Descreva a imagem desejada (opcional)",
      sendButton: "Criar",
      generatedAlt: "Imagem gerada",
      generateAnother: "Gerar Outra Imagem",
      blockedBtn: "Adicione pelo menos uma imagem",
      selectPhotos: "Clique para selecionar suas fotos",
      photo: "foto",
      photos: "fotos",
      buyDownload: "Baixar sem marca d'água - R$1,00",
      buyLoading: "Gerando PIX...",
      watermarkNotice: "Imagem gerada com marca d'água",
      paidCreateButton: "Gerar e pagar R$1,00",
      paidNotice: "Suas fotos grátis acabaram. Agora é R$1 por foto, já sem marca d'água.",
      freeLeftLabel: "fotos grátis restantes",
      freeLeftLabelOne: "foto grátis restante",
      downloadPhoto: "Baixar foto",
      paidImageNotice: "Foto sem marca d'água ✓",
      pixTitle: "Pague R$1,00 no PIX",
      pixScan: "Escaneie o QR Code no app do seu banco",
      pixOr: "ou copie o código",
      pixCopy: "Copiar código PIX",
      pixCopied: "Copiado!",
      pixWaiting: "Aguardando pagamento...",
      pixNoticePrepaid: "Assim que o pagamento cair, sua foto é gerada automaticamente aqui.",
      pixNoticeDownload: "Assim que o pagamento cair, sua foto sem marca libera automaticamente aqui.",
      pixCancel: "Cancelar",
    },
    en: {
      generating: "Generating...",
      loginToGenerate: "Log in to generate images",
      promptPlaceholder: "Describe the desired image (optional)",
      sendButton: "Create",
      generatedAlt: "Generated image",
      generateAnother: "Generate Another Image",
      blockedBtn: "Add at least one image",
      selectPhotos: "Click to select your photos",
      photo: "photo",
      photos: "photos",
      buyDownload: "Download without watermark - R$1.00",
      buyLoading: "Generating PIX...",
      watermarkNotice: "Image generated with watermark",
      paidCreateButton: "Generate & pay R$1.00",
      paidNotice: "Your free photos are over. Now it's R$1 per photo, already without watermark.",
      freeLeftLabel: "free photos left",
      freeLeftLabelOne: "free photo left",
      downloadPhoto: "Download photo",
      paidImageNotice: "Photo without watermark ✓",
      pixTitle: "Pay R$1.00 with PIX",
      pixScan: "Scan the QR Code in your bank app",
      pixOr: "or copy the code",
      pixCopy: "Copy PIX code",
      pixCopied: "Copied!",
      pixWaiting: "Waiting for payment...",
      pixNoticePrepaid: "As soon as the payment lands, your photo is generated automatically here.",
      pixNoticeDownload: "As soon as the payment lands, your watermark-free photo unlocks here.",
      pixCancel: "Cancel",
    },
  }

  const t = translations[locale]

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files
    if (!fileList || fileList.length === 0) return
    setFiles(Array.from(fileList))
  }

  const removeFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index)
    setFiles(updated)
    if (updated.length === 0 && inputRef.current) {
      inputRef.current.value = ""
    }
  }

  const handleGenerateAnother = () => {
    if (isPaidImage && image?.startsWith("blob:")) {
      URL.revokeObjectURL(image)
    }
    setImage(null)
    setIsPaidImage(false)
    setGenerationId(null)
    setFiles([])
    setPreviewUrls([])
    setPrompt("")
    if (inputRef.current) inputRef.current.value = ""
    setIsModalOpen(false)
  }

  const generateImage = async () => {
    if (loading || files.length === 0) return

    try {
      setLoading(true)
      setImage(null)
      setIsPaidImage(false)
      setGenerationId(null)

      const formData = new FormData()
      if (prompt.trim()) formData.append("prompt", prompt)
      files.forEach((file) => formData.append("images", file))
      formData.append("famousSlug", famousSlug)

      const res = await fetch("/api/generate-image", {
        method: "POST",
        body: formData,
      })

      // 402 = limite grátis atingido → pagar antes de gerar.
      if (res.status === 402) {
        setGenCount(freeLimit)
        setLoading(false)
        startPixPayment("prepaid")
        return
      }

      const data = await res.json()

      if (!res.ok) {
        alert(data.error || "Erro ao gerar imagem")
        return
      }

      setImage(`data:image/png;base64,${data.image}`)
      setGenerationId(data.generationId)
      setGenCount((c) => c + 1)
      setPrompt("")
      setFiles([])
      if (inputRef.current) inputRef.current.value = ""
    } catch (err) {
      console.error(err)
      alert("Erro ao gerar imagem")
    } finally {
      setLoading(false)
    }
  }

  // Cria a cobrança PIX e abre a tela com QR + copia-e-cola.
  // mode "prepaid": 6ª foto+ (gera depois do pagamento) — usa as imagens atuais.
  // mode "download": comprar foto grátis já gerada (com marca) — usa generationId.
  const startPixPayment = async (mode: "prepaid" | "download") => {
    if (paymentLoading) return
    if (mode === "prepaid" && files.length === 0) {
      setShowTooltip(true)
      setTimeout(() => setShowTooltip(false), 2500)
      return
    }
    if (mode === "download" && !generationId) return

    setPaymentLoading(true)
    setCopied(false)
    try {
      const formData = new FormData()
      if (mode === "download") {
        formData.append("generationId", generationId as string)
      } else {
        if (prompt.trim()) formData.append("prompt", prompt)
        files.forEach((file) => formData.append("images", file))
        formData.append("famousSlug", famousSlug)
      }

      const res = await fetch("/api/payments/create-pix", { method: "POST", body: formData })
      const data = await res.json()

      if (!res.ok || !data.qrCodeBase64) {
        alert(data.error || "Erro ao gerar PIX")
        return
      }

      setPixData({
        generationId: data.generationId,
        paymentId: data.paymentId,
        qrCodeBase64: data.qrCodeBase64,
        copiaECola: data.copiaECola,
        mode,
      })
    } catch {
      alert(locale === "en" ? "Network error. Try again." : "Erro de rede. Tente novamente.")
    } finally {
      setPaymentLoading(false)
    }
  }

  const onPixApproved = useCallback(
    async (genId: string) => {
      setPixData(null)
      setLoading(true)
      setImage(null)
      try {
        let blob: Blob | null = null
        for (let attempt = 0; attempt < 4; attempt++) {
          const res = await fetch(`/api/download-image?id=${encodeURIComponent(genId)}`)
          if (res.ok) {
            blob = await res.blob()
            break
          }
          await new Promise((r) => setTimeout(r, 2000))
        }
        if (!blob) {
          alert(locale === "en" ? "Could not load the photo. Please contact us." : "Não foi possível carregar a foto. Fale com a gente.")
          return
        }
        const urlObj = URL.createObjectURL(blob)
        setImage(urlObj)
        setIsPaidImage(true)
        setGenerationId(genId)
        setFiles([])
        setPreviewUrls([])
        setPrompt("")
        if (inputRef.current) inputRef.current.value = ""
      } finally {
        setLoading(false)
      }
    },
    [locale]
  )

  // Polling do pagamento enquanto a tela do PIX estiver aberta.
  useEffect(() => {
    if (!pixData) return
    let active = true
    const check = async () => {
      try {
        const res = await fetch(`/api/payments/check-pix?paymentId=${encodeURIComponent(pixData.paymentId)}`)
        const data = await res.json()
        if (active && data.approved) {
          onPixApproved(pixData.generationId)
        }
      } catch {
        /* ignora e tenta de novo no próximo tick */
      }
    }
    const timer = setInterval(check, 3500)
    check()
    return () => {
      active = false
      clearInterval(timer)
    }
  }, [pixData, onPixApproved])

  const copyPixCode = async () => {
    if (!pixData) return
    try {
      await navigator.clipboard.writeText(pixData.copiaECola)
    } catch {
      const ta = document.createElement("textarea")
      ta.value = pixData.copiaECola
      document.body.appendChild(ta)
      ta.select()
      try { document.execCommand("copy") } catch {}
      ta.remove()
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadPhoto = () => {
    if (!image) return
    const a = document.createElement("a")
    a.href = image
    a.download = `fotocomfamosos-${generationId || "foto"}.png`
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  const handleGenerateButtonInteraction = () => {
    if (files.length === 0) {
      setShowTooltip(true)
      setTimeout(() => setShowTooltip(false), 2500)
      return
    }
    if (overLimit) {
      startPixPayment("prepaid")
    } else {
      generateImage()
    }
  }

  return (
    <div className="mt-8 flex flex-col items-center gap-8 px-4 sm:px-6 bg-white pb-16 overflow-x-hidden w-full">

      <div
        className={`
          relative
          w-full max-w-[550px]
          aspect-square
          rounded-[14px]
          overflow-hidden
          flex items-center justify-center
          ${!image ? "bg-gray-50 border border-gray-300" : ""}
        `}
      >
        {!image && previewUrls.length === 0 && isCombo && (
          <div className="absolute inset-0 flex">
            {comboMembers.slice(0, 2).map((m) => (
              <MemberBgImg key={m} slug={m} className="h-full w-1/2 object-cover" />
            ))}
          </div>
        )}

        {!image && previewUrls.length === 0 && !isCombo && bgImageUrl && (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${bgImageUrl})` }}
          />
        )}

        {!image && loading && (
          <div className="z-20 flex flex-col items-center gap-2">
            <div className="h-7 w-7 animate-spin rounded-full border-4 border-gray-300 border-t-purple-600" />
            <p className="text-sm text-gray-600">{t.generating}</p>
            <p className="text-xs text-gray-500">
              0:{String(loadingSeconds).padStart(2, "0")} / 0:45
            </p>
          </div>
        )}

        {image && (
          <img
            src={image}
            alt={t.generatedAlt}
            onClick={() => setIsModalOpen(true)}
            className="w-full h-full object-contain cursor-zoom-in"
          />
        )}

        {!image && !loading && previewUrls.length > 0 && (
          <div className="absolute inset-0 grid grid-cols-2 gap-2 p-4">
            {previewUrls.slice(0, 4).map((url, index) => (
              <div key={index} className="relative">
                <img
                  src={url}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="absolute top-2 right-2 z-20 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center"
                >
                  x
                </button>
              </div>
            ))}
          </div>
        )}

        {!isLogged && !image && !loading && (
          <div className="z-20 flex flex-col items-center gap-3 bg-white/95 p-6 rounded-xl border">
            <span className="text-sm text-gray-600">{t.loginToGenerate}</span>
            <button
              onClick={() =>
                signIn("google", { callbackUrl: window.location.href })
              }
              className="px-5 py-3 rounded-xl border bg-white shadow-sm"
            >
              Google
            </button>
          </div>
        )}
      </div>

      {!image && isLogged && (
        <div className="w-full max-w-[600px] flex flex-col gap-4">
          <input
            ref={inputRef}
            id="upload-photo"
            type="file"
            accept="image/*"
            multiple={!isMobile}
            onChange={handleFileChange}
            disabled={loading}
            className="hidden"
          />

          <label
            htmlFor="upload-photo"
            className={`
              flex items-center justify-center gap-2
              px-6 py-4 rounded-xl border-2
              transition-all font-medium
              ${loading
                ? "opacity-50 cursor-not-allowed"
                : "cursor-pointer border-purple-300 bg-purple-50 hover:bg-purple-100"
              }
            `}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16"
              />
            </svg>
            <span>
              {files.length > 0
                ? `${files.length} ${files.length === 1 ? t.photo : t.photos}`
                : t.selectPhotos}
            </span>
          </label>

          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={t.promptPlaceholder}
            disabled={loading}
            className="w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-purple-300"
          />

          {overLimit ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-800">
              {t.paidNotice}
            </div>
          ) : (
            freeLeft <= 3 && (
              <p className="text-center text-xs text-gray-500">
                {freeLeft} {freeLeft === 1 ? t.freeLeftLabelOne : t.freeLeftLabel}
              </p>
            )
          )}

          <div className="relative">
            <button
              onClick={handleGenerateButtonInteraction}
              disabled={loading || paymentLoading}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold disabled:opacity-60"
            >
              {loading
                ? t.generating
                : paymentLoading
                ? t.buyLoading
                : overLimit
                ? t.paidCreateButton
                : t.sendButton}
            </button>

            {showTooltip && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-2 bg-black text-white text-xs rounded-lg whitespace-nowrap">
                {t.blockedBtn}
              </div>
            )}
          </div>
        </div>
      )}

      {image && (
        <div className="w-full max-w-[600px] flex flex-col gap-4">
          {isPaidImage ? (
            <>
              <p className="text-center text-sm font-medium text-green-600">{t.paidImageNotice}</p>
              <button
                onClick={handleDownloadPhoto}
                className="w-full py-5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold text-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl"
              >
                {t.downloadPhoto}
              </button>
            </>
          ) : (
            <>
              <p className="text-center text-sm text-gray-500">{t.watermarkNotice}</p>
              <button
                onClick={() => startPixPayment("download")}
                disabled={paymentLoading}
                className="w-full py-5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold text-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-60"
              >
                {paymentLoading ? t.buyLoading : t.buyDownload}
              </button>
            </>
          )}

          <button
            onClick={handleGenerateAnother}
            className="w-full py-3 rounded-xl border-2 border-gray-300 text-gray-600 font-medium hover:bg-gray-50 transition-all"
          >
            {t.generateAnother}
          </button>
        </div>
      )}

      {isModalOpen && image && (
        <div
          onClick={() => setIsModalOpen(false)}
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm cursor-zoom-out"
        >
          <img
            src={image}
            alt={t.generatedAlt}
            onClick={(e) => e.stopPropagation()}
            className="max-w-[95vw] max-h-[85vh] md:max-h-[90vh] object-contain rounded-xl shadow-2xl cursor-default"
          />
        </div>
      )}

      {pixData && (
        <>
          <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setPixData(null)} />
          <div className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-center text-lg font-semibold text-gray-900">{t.pixTitle}</h3>
            <p className="mt-1 text-center text-sm text-gray-500">{t.pixScan}</p>

            <div className="mt-4 flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`data:image/png;base64,${pixData.qrCodeBase64}`}
                alt="QR Code PIX"
                className="h-52 w-52 rounded-lg border border-gray-200"
              />
            </div>

            <p className="mt-4 text-center text-xs font-medium uppercase tracking-wide text-gray-400">
              {t.pixOr}
            </p>
            <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
              <p className="break-all text-[11px] leading-snug text-gray-600">{pixData.copiaECola}</p>
            </div>
            <button
              onClick={copyPixCode}
              className="mt-2 w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
            >
              {copied ? t.pixCopied : t.pixCopy}
            </button>

            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-green-600" />
              <span>{t.pixWaiting}</span>
            </div>
            <p className="mt-2 text-center text-xs text-gray-400">
              {pixData.mode === "download" ? t.pixNoticeDownload : t.pixNoticePrepaid}
            </p>

            <button
              onClick={() => setPixData(null)}
              className="mt-3 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              {t.pixCancel}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default GenerateImage
