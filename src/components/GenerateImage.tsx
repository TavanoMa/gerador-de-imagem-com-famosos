"use client"

import { useRef, useState } from "react"

type Props = {
  isLogged: boolean
  credits: number
  onCreditsUpdate: (credits: number) => void
  famousSlug: string
  famousName: string
}

export default function GenerateImage({
  isLogged,
  credits,
  onCreditsUpdate,
  famousSlug,
  famousName,
}: Props) {
  const [image, setImage] = useState<string | null>(null)
  const [prompt, setPrompt] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [inputKey, setInputKey] = useState(0)

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    setFiles(selectedFiles)
  }

  const generateImage = async () => {
    if (loading || files.length === 0) return

    setLoading(true)
    setImage(null)

    try {
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
      setInputKey((k) => k + 1)
    } finally {
      setLoading(false)
    }
  }

  const hasFiles = files.length > 0

  return (
    <div className="mt-8 flex flex-col items-center gap-8 px-4 sm:px-6 bg-[#252525]">

  <div
  onClick={() => fileInputRef.current?.click()}
  className={`
    w-full max-w-[320px] sm:max-w-[420px] md:max-w-[550px]
    aspect-square rounded-[14px]
    flex items-center justify-center
    overflow-hidden
    cursor-pointer transition
    ${
      image
        ? ""
        : files.length > 0
        ? "bg-[#1f1f1f] border border-solid border-[#555] text-[#e5e5e5] hover:border-[#7c7cff]"
        : "bg-[#1f1f1f] border border-dashed border-[#333] text-[#777] hover:border-[#555]"
    }
  `}
>
  {loading ? (
    <div className="flex flex-col items-center gap-2">
      <div className="h-[27px] w-[27px] animate-spin rounded-full border-4 border-[#f4f4f5] border-t-[#404142]" />
      <p className="text-sm">Gerando...</p>
    </div>
  ) : image ? (
    <img
      src={image}
      alt="Imagem gerada"
      className="h-full w-full object-contain"
    />
  ) : files.length > 0 ? (
    <div className="flex flex-col items-center gap-1 text-center px-4">
      <p className="text-sm font-medium">
        {files.length} imagem{files.length > 1 ? "s" : ""} selecionada
        {files.length > 1 ? "s" : ""}
      </p>
      <p className="text-xs opacity-60">
        Clique para alterar
      </p>
    </div>
  ) : (
    <div className="flex flex-col items-center gap-2 text-center px-4">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-8 w-8 opacity-60"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M3 16.5V6.75A2.25 2.25 0 015.25 4.5h13.5A2.25 2.25 0 0121 6.75v9.75M3 16.5l4.5-4.5a2.25 2.25 0 013.182 0L15 16.5m-12 0h18"
        />
      </svg>

      <p className="text-sm font-medium">
        Faça o upload da sua imagem
      </p>
      <p className="text-xs opacity-60">
        Clique aqui para selecionar
      </p>
    </div>
  )}
</div>

  <input
    ref={fileInputRef}
    key={inputKey}
    type="file"
    accept="image/*"
    multiple
    onChange={(e) => setFiles(Array.from(e.target.files || []))}
    disabled={!isLogged || loading || credits <= 0}
    className="hidden"
  />

  <p className="max-w-[550px] text-sm text-center px-2">
    Adicione pelo menos uma imagem sua, para te colocarmos ao lado do(a){" "}
    {famousName}
  </p>

  <div className="flex flex-col sm:flex-row gap-3 w-full max-w-[600px]">
    <input
      type="text"
      className="w-full rounded-lg border border-[#333] bg-[#1a1a1a] px-4 py-3 text-base outline-none focus:border-[#7c7cff] disabled:opacity-60"
      placeholder={
        !isLogged
          ? "Faça login para gerar imagens"
          : credits <= 0
          ? "Você não tem mais créditos"
          : "Descreva a imagem desejada (opcional)"
      }
      disabled={!isLogged || loading || credits <= 0}
      value={prompt}
      onChange={(e) => setPrompt(e.target.value)}
    />

    <button
      onClick={generateImage}
      disabled={!isLogged || loading || credits <= 0}
      className="
        w-full sm:w-auto
        rounded-lg px-6 py-3 text-base
        bg-gradient-to-br from-[#7c7cff] to-[#5a5aff]
        hover:-translate-y-0.5 transition
        disabled:opacity-60 cursor-pointer
      "
    >
      {loading ? "Gerando..." : "Enviar"}
    </button>
  </div>
</div>
  )
}
