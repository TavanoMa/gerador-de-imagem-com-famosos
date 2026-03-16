"use client"

import { useState, useEffect } from "react"
import { signIn } from "next-auth/react"
import ShareButtons from "./ShareButtons"

type Props = {
  isLogged: boolean
  credits: number
  onCreditsUpdate: (credits: number) => void
  famousSlug: string
  famousName: string
  locale?: 'pt' | 'en'
  onBuyCredits?: () => void
}

const GenerateImage = ({ isLogged, credits, onCreditsUpdate, famousSlug, famousName, locale = 'pt', onBuyCredits }: Props) => {
  const [image, setImage] = useState<string | null>(null)
  const [prompt, setPrompt] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [inputKey, setInputKey] = useState(0)
  const [loading, setLoading] = useState(false)
  const [loadingSeconds, setLoadingSeconds] = useState(0)

  // Fake timer while generating (up to 45s)
  useEffect(() => {
    if (!loading) {
      setLoadingSeconds(0)
      return
    }
    setLoadingSeconds(0)
    const interval = setInterval(() => {
      setLoadingSeconds((s) => Math.min(s + 1, 45))
    }, 1000)
    return () => clearInterval(interval)
  }, [loading])

  // Generate preview URLs when files change
  useEffect(() => {
    if (files.length === 0) {
      setPreviewUrls([])
      return
    }

    const urls = files.map(file => URL.createObjectURL(file))
    setPreviewUrls(urls)

    // Cleanup URLs when component unmounts or files change
    return () => {
      urls.forEach(url => URL.revokeObjectURL(url))
    }
  }, [files])

  const translations = {
    pt: {
      generating: "Criando...",
      placeholderImage: "A imagem gerada aparecerá aqui",
      uploadInstruction: `Adicione pelo menos uma imagem sua, para te colocarmos ao lado do(a) ${famousName}`,
      loginToGenerate: "Faça login para gerar imagens",
      noCredits: "Você não tem mais créditos",
      buyCredits: "Comprar créditos",
      buyCreditsSubtitle: "Seus créditos acabaram",
      promptPlaceholder: "Descreva a imagem desejada (opcional)",
      sendButton: "Criar",
      generatedAlt: "Imagem gerada",
      selectedPhotos: "Fotos selecionadas",
      removePhoto: "Remover",
      downloadButton: "Baixar Imagem",
      generateAnother: "Gerar Outra Imagem",
      blockedBtn: "Adicione pelo menos uma imagem para conseguir gerar"
    },
    en: {
      generating: "Generating...",
      placeholderImage: "Generated image will appear here",
      uploadInstruction: `Add at least one image of yourself to place you next to ${famousName}`,
      loginToGenerate: "Log in to generate images",
      noCredits: "You have no credits left",
      buyCredits: "Buy credits",
      buyCreditsSubtitle: "You've run out of credits",
      promptPlaceholder: "Describe the desired image (optional)",
      sendButton: "Create",
      generatedAlt: "Generated image",
      selectedPhotos: "Selected photos",
      removePhoto: "Remove",
      downloadButton: "Download Image",
      generateAnother: "Generate Another Image",
      blockedBtn: "Add at least one image to generate"
    }
  };

  const t = translations[locale];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    setFiles(selectedFiles)
  }

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index)
    setFiles(newFiles)
  }

  const handleDownload = () => {
    if (!image) return
    
    // Create a link element
    const link = document.createElement('a')
    link.href = image
    link.download = `photo-with-${famousName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleGenerateAnother = () => {
    setImage(null)
    setFiles([])
    setPreviewUrls([])
    setPrompt("")
    setInputKey(prev => prev + 1)
  }

const generateImage = async () => {
  if (loading || files.length === 0) return

  setLoading(true)
  setImage(null)

  try {
    const formData = new FormData()

    // ⚠️ prompt pode ser vazio
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

    if (!res.ok) {
      const err = await res.json()
      alert(err.error || "Erro ao gerar imagem")
      return
    }

    const data = await res.json()

    setImage(`data:image/png;base64,${data.image}`)
    onCreditsUpdate(data.credits)

    setPrompt("")
    setFiles([])
    setInputKey(prev => prev + 1)
  } finally {
    setLoading(false)
  }
}

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL

 const getImageUrls = (slug: string) => {
  const base = `${SUPABASE_URL}/storage/v1/object/public/famous_image/${slug}/1`;
  
  return {
    jpg: `${base}.jpg`,
    png: `${base}.png`,
  };
};

  const imageUrls = getImageUrls(famousSlug);

 return (
  <div className="mt-8 flex flex-col items-center gap-8 px-4 sm:px-6 bg-white pb-16">

    <div
      className={`
        relative
        w-full max-w-auto sm:max-w-[420px] md:max-w-[550px]
        aspect-square rounded-[14px]
        flex items-center justify-center overflow-hidden
        ${!image ? "bg-gray-50 border border-gray-500 text-gray-500" : ""}
      `}
    >

        {!image && previewUrls.length === 0 && (
    <>
      <div
        className="absolute inset-0 scale-105 bg-center bg-cover opacity-75 object-cover"
        style={{
  backgroundImage: `url(${imageUrls.jpg}), url(${imageUrls.png})`,
}}
      />
      <div className="absolute inset-0 " />
    </>
  )}
      
      {!image ? (
        loading ? (
          <div className="flex flex-col items-center gap-2 z-10">
            <div className="h-[27px] w-[27px] animate-spin rounded-full border-4 border-gray-300 border-t-purple-600" />
            <p className="text-sm text-gray-600">{t.generating}</p>
            <p className="text-xs text-gray-500 tabular-nums">
              {String(Math.floor(loadingSeconds / 60)).padStart(1, "0")}:
              {String(loadingSeconds % 60).padStart(2, "0")} / 0:45
            </p>
          </div>
        ) : (
          <>
            {/* Image Previews as Background */}
            {previewUrls.length > 0 && (
              <div className="absolute inset-0 gap-2 p-4">
                {previewUrls.slice(0, 4).map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removeFile(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-lg z-10"
                      type="button"
                      disabled={loading}
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                {previewUrls.length > 4 && (
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded-full">
                    +{previewUrls.length - 4} {locale === 'pt' ? 'fotos' : 'photos'}
                  </div>
                )}
              </div>
            )}

            {/* Upload Button - Always on top */}
            {!isLogged ? (
              <div className="relative z-20 flex flex-col items-center gap-3 px-6 py-4 border-2 border-gray-200 bg-gray-50 rounded-xl">
                <span className="text-gray-400 font-medium text-sm">{t.loginToGenerate}</span>
                <button
                  type="button"
                  onClick={() => signIn("google")}
                  className="flex items-center justify-center gap-3 px-5 py-2.5 bg-white border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-all cursor-pointer shadow-sm text-sm"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  {locale === 'en' ? 'Continue with Google' : 'Continuar com o Google'}
                </button>
              </div>
            ) : (
            <>
              {credits <= 0 ? (
                <button
                  type="button"
                  onClick={onBuyCredits}
                  className="relative z-20 flex flex-col items-center gap-1.5 px-6 py-4 border-2 border-purple-400 bg-purple-50 rounded-xl font-medium transition-all hover:bg-purple-100 hover:border-purple-500 cursor-pointer shadow"
                >
                  <span className="text-purple-700 font-semibold text-sm">{t.buyCreditsSubtitle}</span>
                  <span className="flex items-center gap-1.5 bg-linear-to-r from-purple-600 to-pink-600 text-white text-sm font-bold px-4 py-1.5 rounded-lg">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    {t.buyCredits}
                  </span>
                </button>
              ) : (
            <label 
              htmlFor="file-upload" 
              className={`
                relative z-20
                flex items-center justify-center gap-2 px-6 py-4 
                border-2 rounded-xl font-medium transition-all
                ${loading
                  ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed' 
                  : 'border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100 hover:border-purple-400 cursor-pointer'
                }
                ${previewUrls.length > 0 ? 'shadow-lg' : ''}
              `}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>
                {files.length > 0 
                  ? `${files.length} ${files.length === 1 ? (locale === 'pt' ? 'foto' : 'photo') : (locale === 'pt' ? 'fotos' : 'photos')}`
                  : locale === 'pt' ? 'Clique para selecionar suas fotos' : 'Click to select your photos'
                }
              </span>
            </label>
              )}
            </>
            )}
          </>
        )
      ) : (
        <img
          src={image}
          alt={t.generatedAlt}
          className="h-full w-full object-contain"
        />
      )}
    </div>

    {/* File Upload Input */}
    <input
      id="file-upload"
      key={inputKey}
      type="file"
      accept="image/*"
      multiple
      onChange={handleFileChange}
      disabled={!isLogged || loading || credits <= 0}
      className="hidden"
    />

    

    {/* Prompt and Generate Button - Hide when image is generated */}
    {!image && (
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-[600px]">
        
        {credits <= 0 && isLogged ? (
          <button
            type="button"
            onClick={onBuyCredits}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-base bg-linear-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t.buyCredits}
          </button>
        ) : (
          <>
            <input
              type="text"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 disabled:opacity-60 text-gray-900 placeholder:text-gray-400"
              placeholder={
                !isLogged
                  ? t.loginToGenerate
                  : t.promptPlaceholder
              }
              disabled={!isLogged || loading}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <div className="group relative">
              <button
              onClick={generateImage}
              disabled={!isLogged || loading || credits <= 0 || files.length === 0}
              className="
                w-full sm:w-auto
                cursor-pointer
                rounded-lg px-6 py-3 text-base font-semibold
                bg-linear-to-br from-purple-600 to-pink-600
                text-white
                hover:-translate-y-0.5 hover:shadow-lg transition
                disabled:opacity-60 disabled:cursor-not-allowed
              "
            >
              {loading ? t.generating : t.sendButton}
            </button>
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-50">
                    {t.blockedBtn}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 -mb-1 border-4 border-transparent border-b-gray-900"></div>
                  </div>
            </div>
          </>
        )}
        
      </div>
    )}

    {/* Generated Image Actions - Show only when image is generated */}
    {image && (
      <div className="w-full max-w-[600px] flex flex-col gap-4">
        {/* Download Button */}
        <button
          onClick={handleDownload}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-linear-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-200 hover:scale-105 shadow-lg"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          {t.downloadButton}
        </button>

        {/* Share Buttons */}
        <ShareButtons 
          imageUrl={image} 
          famousName={famousName}
          locale={locale}
        />

        {/* Generate Another Image Button */}
        <button
          onClick={handleGenerateAnother}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-linear-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200 hover:scale-105 shadow-lg"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {t.generateAnother}
        </button>
      </div>
    )}
  </div>
)
}

export default GenerateImage
