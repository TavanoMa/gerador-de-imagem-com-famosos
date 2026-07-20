"use client"

import { useState, useEffect, useRef } from "react"
import { signIn } from "next-auth/react"

function formatCpfInput(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

function formatPhoneInput(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 11)
  if (d.length <= 2) return d.length ? `(${d}` : d
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

type Props = {
  isLogged: boolean
  famousSlug: string
  famousName: string
  locale?: "pt" | "en"
  hasSavedPaymentInfo?: boolean
}

const GenerateImage = ({
  isLogged,
  famousSlug,
  famousName,
  locale = "pt",
  hasSavedPaymentInfo = false,
}: Props) => {
  const [image, setImage] = useState<string | null>(null)
  const [generationId, setGenerationId] = useState<string | null>(null)
  const [prompt, setPrompt] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingSeconds, setLoadingSeconds] = useState(0)
  const [bgImageUrl, setBgImageUrl] = useState<string | null>(null)
  const [showTooltip, setShowTooltip] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const [paymentFormOpen, setPaymentFormOpen] = useState(false)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [taxId, setTaxId] = useState("")
  const [cellphone, setCellphone] = useState("")

  const inputRef = useRef<HTMLInputElement>(null)

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
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!SUPABASE_URL) return
    const timestamp = new Date().getTime()
    const base = `${SUPABASE_URL}/storage/v1/object/public/famous_image/${famousSlug}/1`
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
      buyLoading: "Redirecionando...",
      watermarkNotice: "Imagem gerada com marca d'água",
      paymentTitle: "Dados para pagamento",
      cpfLabel: "CPF",
      phoneLabel: "Telefone (com DDD)",
      paymentContinue: "Ir para pagamento",
      paymentCancel: "Cancelar",
      paymentRequired: "CPF e telefone são obrigatórios",
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
      buyLoading: "Redirecting...",
      watermarkNotice: "Image generated with watermark",
      paymentTitle: "Payment details",
      cpfLabel: "CPF (Brazilian tax ID)",
      phoneLabel: "Phone (with area code)",
      paymentContinue: "Continue to payment",
      paymentCancel: "Cancel",
      paymentRequired: "CPF and phone are required",
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
    setImage(null)
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
      setGenerationId(null)

      const formData = new FormData()
      if (prompt.trim()) formData.append("prompt", prompt)
      files.forEach((file) => formData.append("images", file))
      formData.append("famousSlug", famousSlug)

      const res = await fetch("/api/generate-image", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.error || "Erro ao gerar imagem")
        return
      }

      setImage(`data:image/png;base64,${data.image}`)
      setGenerationId(data.generationId)
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

  const handleBuyDownload = async (formTaxId?: string, formCellphone?: string) => {
    if (!generationId || paymentLoading) return

    setPaymentLoading(true)
    try {
      const bodyPayload: Record<string, string> = { generationId }
      if (formTaxId && formCellphone) {
        bodyPayload.taxId = formTaxId.replace(/\D/g, "")
        bodyPayload.cellphone = formCellphone.replace(/\D/g, "")
      }

      const res = await fetch("/api/payments/create-billing", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(bodyPayload),
      })

      const data = await res.json()

      if (!res.ok || !data.url) {
        alert(data.error || "Erro ao criar pagamento")
        return
      }

      window.location.href = data.url
    } catch {
      alert(locale === "en" ? "Network error. Try again." : "Erro de rede. Tente novamente.")
    } finally {
      setPaymentLoading(false)
    }
  }

  const handleBuyClick = () => {
    if (hasSavedPaymentInfo) {
      handleBuyDownload()
    } else {
      setPaymentFormOpen(true)
    }
  }

  const handlePaymentFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const rawCpf = taxId.replace(/\D/g, "")
    const rawPhone = cellphone.replace(/\D/g, "")
    if (rawCpf.length !== 11 || rawPhone.length < 10) {
      alert(t.paymentRequired)
      return
    }
    setPaymentFormOpen(false)
    handleBuyDownload(taxId, cellphone)
  }

  const handleGenerateButtonInteraction = () => {
    if (files.length === 0) {
      setShowTooltip(true)
      setTimeout(() => setShowTooltip(false), 2500)
      return
    }
    generateImage()
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
        {!image && previewUrls.length === 0 && bgImageUrl && (
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

          <div className="relative">
            <button
              onClick={handleGenerateButtonInteraction}
              disabled={loading}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold"
            >
              {loading ? t.generating : t.sendButton}
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
          <p className="text-center text-sm text-gray-500">{t.watermarkNotice}</p>

          <button
            onClick={handleBuyClick}
            disabled={paymentLoading}
            className="w-full py-5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold text-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-60"
          >
            {paymentLoading ? t.buyLoading : t.buyDownload}
          </button>

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

      {paymentFormOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50"
            onClick={() => setPaymentFormOpen(false)}
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.paymentTitle}</h3>
            <p className="text-sm text-gray-500 mb-4">
              {locale === "en" ? "Download without watermark" : "Download sem marca d'água"} — R$1,00
            </p>
            <form onSubmit={handlePaymentFormSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.cpfLabel}</label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="000.000.000-00"
                  value={taxId}
                  onChange={(e) => setTaxId(formatCpfInput(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.phoneLabel}</label>
                <input
                  type="text"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="(11) 99999-9999"
                  value={cellphone}
                  onChange={(e) => setCellphone(formatPhoneInput(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setPaymentFormOpen(false)}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  {t.paymentCancel}
                </button>
                <button
                  type="submit"
                  disabled={paymentLoading}
                  className="flex-1 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-sm font-semibold text-white hover:from-purple-700 hover:to-pink-700 disabled:opacity-60"
                >
                  {paymentLoading ? t.buyLoading : t.paymentContinue}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  )
}

export default GenerateImage
