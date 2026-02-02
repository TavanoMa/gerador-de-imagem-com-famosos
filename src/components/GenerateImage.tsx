"use client"

import { useState } from "react"

type Props = {
  isLogged: boolean
  credits: number
  onCreditsUpdate: (credits: number) => void
}

const GenerateImage = ({ isLogged, credits, onCreditsUpdate }: Props) => {
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
    <div className="flex flex-col gap-6">

      <div className={`h-[400px] rounded-lg border border-dashed border-[#333] flex items-center justify-center`}>
        {!image ? (
          loading ? <p>Gerando...</p> : <p>A imagem gerada aparecerá aqui</p>
        ) : (
          <img src={image} alt="Imagem gerada" className="rounded-lg" />
        )}
      </div>

      <div className="flex gap-2">
        <input
          className="flex-1 rounded-md bg-[#1f1f1f] px-4 py-3"
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
          className="rounded-md bg-purple-600 px-6 disabled:opacity-50"
        >
          {loading ? "Gerando..." : credits <= 0 ? "Sem créditos" : "Enviar"}
        </button>
      </div>

    </div>
  )
}

export default GenerateImage
