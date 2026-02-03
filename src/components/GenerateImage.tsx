"use client"

import { useState } from "react"

type Props = {
  isLogged: boolean
  credits: number
  onCreditsUpdate: (credits: number) => void
}

const GenerateImage =  ({ isLogged, credits, onCreditsUpdate }: Props) => {
  const [image, setImage] = useState<string | null>(null)
  const [prompt, setPrompt] = useState("")
  const [loading, setLoading] = useState(false)

  const generateImage = async () => {
    setLoading(true)

    const res = await fetch("/api/generate-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    })

    if (!res.ok) {
      alert("Erro ao gerar imagem")
      setLoading(false)
      return
    }

    const data = await res.json()

    setImage(`data:image/png;base64,${data.image}`)
    onCreditsUpdate(data.credits)
    setPrompt("")
    setLoading(false)
  }

  return (
    <div className="mt-8 flex flex-col items-center gap-10 px-6 bg-[#252525]">

      <div className={`
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
            className="h-full w-full object-cover"
          />
        )}
      </div>



      <div className="flex w-full max-w-[600px] gap-3">
        <input
          type="text"
          className="flex-1 rounded-lg border border-[#333] bg-[#1a1a1a] px-4 py-3 text-base outline-none trasition focus:border-[#7c7cff] disabled:opacity-60 disabled:cursor-not-allowed "
          placeholder={
            !isLogged
              ? "Faça login para gerar imagens"
              : credits <= 0
              ? "Você não tem mais créditos"
              : "Descreva a imagem que você deseja"
          }
          disabled={!isLogged || loading || credits <= 0}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />

        <button
          onClick={generateImage}
          disabled={!isLogged || loading || credits <= 0}
          className="rounded-lg px-7 text-base bg-gradient-to-br from-[#7c7cff] to-[#5a5aff] transitionhover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(124,124,255,0.35)] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Gerando..." : !isLogged ? "Faça Login" : credits <= 0 ? "Sem créditos" : "Enviar"}
        </button>
      </div>

    </div>
  )
}

export default GenerateImage
