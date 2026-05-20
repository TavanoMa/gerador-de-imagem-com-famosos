"use client"

import { useState, useEffect, useRef } from "react"
import { signIn } from "next-auth/react"
import ShareButtons from "./ShareButtons"

type Props = {
  isLogged: boolean
  credits: number
  onCreditsUpdate: (credits: number) => void
  famousSlug: string
  famousName: string
  locale?: "pt" | "en"
  onBuyCredits?: () => void
}

const GenerateImage = ({
  isLogged,
  credits,
  onCreditsUpdate,
  famousSlug,
  famousName,
  locale = "pt",
  onBuyCredits,
}: Props) => {
  const [image, setImage] = useState<string | null>(null)
  const [prompt, setPrompt] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingSeconds, setLoadingSeconds] = useState(0)
  const [bgImageUrl, setBgImageUrl] = useState<string | null>(null)
  const [showTooltip, setShowTooltip] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)

  const isMobile =
    typeof window !== "undefined" &&
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

  // TIMER
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

  // PREVIEW COMPATÍVEL COM MOBILE
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

            reader.onload = (e) => {
              resolve(e.target?.result as string)
            }

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

  // BACKGROUND IMAGE FALLBACK
  useEffect(() => {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL

    if (!SUPABASE_URL) return

    const base = `${SUPABASE_URL}/storage/v1/object/public/famous_image/${famousSlug}/1`

    const img = new Image()

    img.onload = () => {
      setBgImageUrl(img.src)
    }

    img.onerror = () => {
      const fallback = new Image()

      fallback.onload = () => {
        setBgImageUrl(fallback.src)
      }

      fallback.src = `${base}.png`
    }

    img.src = `${base}.jpg`
  }, [famousSlug])

  const translations = {
    pt: {
      generating: "Criando...",
      loginToGenerate: "Faça login para gerar imagens",
      buyCredits: "Comprar créditos",
      buyCreditsSubtitle: "Seus créditos acabaram",
      promptPlaceholder: "Descreva a imagem desejada (opcional)",
      sendButton: "Criar",
      generatedAlt: "Imagem gerada",
      downloadButton: "Baixar Imagem",
      generateAnother: "Gerar Outra Imagem",
      blockedBtn: "Adicione pelo menos uma imagem",
      selectPhotos: "Clique para selecionar suas fotos",
      photo: "foto",
      photos: "fotos",
    },

    en: {
      generating: "Generating...",
      loginToGenerate: "Log in to generate images",
      buyCredits: "Buy credits",
      buyCreditsSubtitle: "You've run out of credits",
      promptPlaceholder: "Describe the desired image (optional)",
      sendButton: "Create",
      generatedAlt: "Generated image",
      downloadButton: "Download Image",
      generateAnother: "Generate Another Image",
      blockedBtn: "Add at least one image",
      selectPhotos: "Click to select your photos",
      photo: "photo",
      photos: "photos",
    },
  }

  const t = translations[locale]

  // FILE CHANGE
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const fileList = e.target.files

    if (!fileList || fileList.length === 0) return

    const selectedFiles = Array.from(fileList)

    setFiles(selectedFiles)
  }

  // REMOVE FILE
  const removeFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index)

    setFiles(updated)

    // importante para Android
    if (updated.length === 0 && inputRef.current) {
      inputRef.current.value = ""
    }
  }

  // DOWNLOAD
  const handleDownload = async () => {
    if (!image) return

    try {
      const res = await fetch(image)
      const blob = await res.blob()

      const blobUrl = URL.createObjectURL(blob)

      const link = document.createElement("a")

      link.href = blobUrl
      link.download = `photo-with-${famousName
        .toLowerCase()
        .replace(/\s+/g, "-")}-${Date.now()}.png`

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      setTimeout(() => {
        URL.revokeObjectURL(blobUrl)
      }, 1000)
    } catch {
      window.open(image, "_blank")
    }
  }

  // RESET
  const handleGenerateAnother = () => {
    setImage(null)
    setFiles([])
    setPreviewUrls([])
    setPrompt("")

    // ESSENCIAL MOBILE
    if (inputRef.current) {
      inputRef.current.value = ""
    }
  }

  // GENERATE
  const generateImage = async () => {
    if (loading || files.length === 0) return

    try {
      setLoading(true)
      setImage(null)

      const formData = new FormData()

      if (prompt.trim()) {
        formData.append("prompt", prompt)
      }

      files.forEach((file) => {
        formData.append("images", file)
      })

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

      onCreditsUpdate(data.credits)

      setPrompt("")
      setFiles([])

      // RESET INPUT
      if (inputRef.current) {
        inputRef.current.value = ""
      }
    } catch (err) {
      console.error(err)
      alert("Erro ao gerar imagem")
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateButtonInteraction = () => {
    if (files.length === 0) {
      setShowTooltip(true)

      setTimeout(() => {
        setShowTooltip(false)
      }, 2500)

      return
    }

    generateImage()
  }

  return (
    <div className="mt-8 flex flex-col items-center gap-8 px-4 sm:px-6 bg-white pb-16">

      {/* IMAGE AREA */}
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
            style={{
              backgroundImage: `url(${bgImageUrl})`,
            }}
          />
        )}

        {/* LOADING */}
        {!image && loading && (
          <div className="z-20 flex flex-col items-center gap-2">
            <div className="h-7 w-7 animate-spin rounded-full border-4 border-gray-300 border-t-purple-600" />

            <p className="text-sm text-gray-600">
              {t.generating}
            </p>

            <p className="text-xs text-gray-500">
              0:
              {String(loadingSeconds).padStart(2, "0")} / 0:45
            </p>
          </div>
        )}

        {/* GENERATED IMAGE */}
        {image && (
          <img
            src={image}
            alt={t.generatedAlt}
            className="w-full h-full object-contain"
          />
        )}

        {/* PREVIEWS */}
        {!image && !loading && previewUrls.length > 0 && (
          <div className="absolute inset-0 grid grid-cols-2 gap-2 p-4">
            {previewUrls.slice(0, 4).map((url, index) => (
              <div
                key={index}
                className="relative"
              >
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
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* LOGIN */}
        {!isLogged && !image && !loading && (
          <div className="z-20 flex flex-col items-center gap-3 bg-white/95 p-6 rounded-xl border">
            <span className="text-sm text-gray-600">
              {t.loginToGenerate}
            </span>

            <button
              onClick={() =>
                signIn("google", {
                  callbackUrl: window.location.href,
                })
              }
              className="px-5 py-3 rounded-xl border bg-white shadow-sm"
            >
              Google
            </button>
          </div>
        )}
      </div>

      {/* CONTROLS */}
      {!image && isLogged && (
        <div className="w-full max-w-[600px] flex flex-col gap-4">

          {/* SELECT */}
          {credits > 0 && (
            <>
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
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16"
                  />
                </svg>

                <span>
                  {files.length > 0
                    ? `${files.length} ${
                        files.length === 1
                          ? t.photo
                          : t.photos
                      }`
                    : t.selectPhotos}
                </span>
              </label>
            </>
          )}

          {/* NO CREDITS */}
          {credits <= 0 && (
            <button
              type="button"
              onClick={onBuyCredits}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold"
            >
              {t.buyCredits}
            </button>
          )}

          {/* PROMPT */}
          {credits > 0 && (
            <>
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
                  {loading
                    ? t.generating
                    : t.sendButton}
                </button>

                {showTooltip && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-2 bg-black text-white text-xs rounded-lg whitespace-nowrap">
                    {t.blockedBtn}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ACTIONS */}
      {image && (
        <div className="w-full max-w-[600px] flex flex-col gap-4">


          <ShareButtons 
          imageUrl={image} 
          famousName={famousName}
          locale={locale}
        />

          <button
            onClick={handleGenerateAnother}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold"
          >
            {t.generateAnother}
          </button>
        </div>
      )}
    </div>
  )
}

export default GenerateImage