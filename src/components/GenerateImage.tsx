"use client"

import { useState, useEffect } from "react"
import ShareButtons from "./ShareButtons"

type Props = {
  isLogged: boolean
  credits: number
  onCreditsUpdate: (credits: number) => void
  famousSlug: string
  famousName: string
  locale?: 'pt' | 'en'
}

const GenerateImage = ({ isLogged, credits, onCreditsUpdate, famousSlug, famousName, locale = 'pt' }: Props) => {
  const [image, setImage] = useState<string | null>(null)
  const [prompt, setPrompt] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [inputKey, setInputKey] = useState(0)
  const [loading, setLoading] = useState(false)

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

 return (
  <div className="mt-8 flex flex-col items-center gap-8 px-4 sm:px-6 bg-white pb-16">

    <div
      className={`
        relative
        w-full max-w-[320px] sm:max-w-[420px] md:max-w-[550px]
        aspect-square rounded-[14px]
        flex items-center justify-center overflow-hidden
        ${!image ? "bg-gray-50 border border-dashed border-gray-300 text-gray-500" : ""}
      `}
    >
      {!image ? (
        loading ? (
          <div className="flex flex-col items-center gap-2 z-10">
            <div className="h-[27px] w-[27px] animate-spin rounded-full border-4 border-gray-300 border-t-purple-600" />
            <p className="text-sm text-gray-600">{t.generating}</p>
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
            <label 
              htmlFor="file-upload" 
              className={`
                relative z-20
                flex items-center justify-center gap-2 px-6 py-4 
                border-2 border-dashed rounded-xl font-medium transition-all
                ${!isLogged || loading || credits <= 0 
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
                  : !isLogged 
                    ? t.loginToGenerate
                    : credits <= 0
                    ? t.noCredits
                    : locale === 'pt' ? 'Clique para selecionar suas fotos' : 'Click to select your photos'
                }
              </span>
            </label>
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
        
        <input
          type="text"
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 disabled:opacity-60 text-gray-900 placeholder:text-gray-400"
          placeholder={
            !isLogged
              ? t.loginToGenerate
              : credits <= 0
              ? t.noCredits
              : t.promptPlaceholder
          }
          disabled={!isLogged || loading || credits <= 0}
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
            bg-gradient-to-br from-purple-600 to-pink-600
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
        
      </div>
    )}

    {/* Generated Image Actions - Show only when image is generated */}
    {image && (
      <div className="w-full max-w-[600px] flex flex-col gap-4">
        {/* Download Button */}
        <button
          onClick={handleDownload}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-200 hover:scale-105 shadow-lg"
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
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200 hover:scale-105 shadow-lg"
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
