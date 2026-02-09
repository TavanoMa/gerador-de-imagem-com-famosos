"use client"

import { useState } from "react"

type Props = {
  isLogged: boolean
  credits: number
  onCreditsUpdate: (credits: number) => void
  famousSlug: string
}

const GenerateImage = ({ isLogged, credits, onCreditsUpdate, famousSlug }: Props) => {
  const [image, setImage] = useState<string | null>(null)
  const [prompt, setPrompt] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [inputKey, setInputKey] = useState(0)
  const [loading, setLoading] = useState(false)

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
    <div className="mt-8 flex flex-col items-center gap-10 px-6 bg-[#252525]">

      <div
        className={`
          w-full max-w-[550px] aspect-square rounded-[14px]
          flex items-center justify-center overflow-hidden
          ${!image ? "bg-[#1f1f1f] border border-dashed border-[#333] text-[#777]" : ""}
        `}
      >
        {!image ? (
          loading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="h-[27px] w-[27px] animate-spin rounded-full border-4 border-[#f4f4f5] border-t-[#404142]" />
              <p className="text-sm">Gerando...</p>
            </div>
          ) : (
            <p className="text-sm text-center px-4">
              A imagem gerada aparecerá aqui
            </p>
          )
        ) : (
          <img
            src={image}
            alt="Imagem gerada"
            className="h-full w-full object-contain"
          />
        )}
      </div>

      <input
        key={inputKey}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => setFiles(Array.from(e.target.files || []))}
        disabled={!isLogged || loading || credits <= 0}
        className="text-sm text-[#aaa]"
      />

      <div className="flex gap-3 w-full max-w-[600px]">
        <input
          type="text"
          className="flex-1 rounded-lg border border-[#333] bg-[#1a1a1a] px-4 py-3 text-base outline-none focus:border-[#7c7cff] disabled:opacity-60"
          placeholder={
            !isLogged
              ? "Faça login para gerar imagens"
              : credits <= 0
              ? "Você não tem mais créditos"
              : "Descreva a imagem desejada"
          }
          disabled={!isLogged || loading || credits <= 0}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />

        <button
          onClick={generateImage}
          disabled={!isLogged || loading || credits <= 0}
          className="rounded-lg px-7 text-base bg-gradient-to-br from-[#7c7cff] to-[#5a5aff] hover:-translate-y-0.5 transition disabled:opacity-60"
        >
          {loading ? "Gerando..." : "Enviar"}
        </button>
      </div>
    </div>
  )
}

export default GenerateImage
