import { NextResponse } from "next/server"
import { toFile } from "openai"
import { auth } from "@/lib/auth"
import { supabaseServer } from "@/lib/supabase-server"

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"

export async function GET() {
  return NextResponse.json({ ok: true })
}

// --- OpenRouter / Nanobanana (image gen via OpenRouter) ---

interface OpenRouterImageUrl {
  url: string
}

interface OpenRouterRequestContent {
  type: string
  text?: string
  image_url?: OpenRouterImageUrl
}

interface OpenRouterRequestBody {
  model: string
  messages: { role: string; content: OpenRouterRequestContent[] }[]
  modalities: string[]
  image_config?: { aspect_ratio: string }
}

interface OpenRouterResponse {
  choices: {
    message: { images?: { image_url?: { url: string } }[] }
    native_finish_reason?: string
  }[]
}

async function fileToDataUri(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer())
  const base64 = buffer.toString("base64")
  const mime = file.type || "image/png"
  return `data:${mime};base64,${base64}`
}

async function generateImageOpenRouter(
  prompt: string,
  imageDataUris: string[],
  apiKey: string
): Promise<{ imageDataUri: string } | { error: string }> {
  const content: OpenRouterRequestContent[] = [{ type: "text", text: prompt }]
  for (const url of imageDataUris) {
    content.push({ type: "image_url", image_url: { url } })
  }

  const body: OpenRouterRequestBody = {
    model: "google/gemini-3-pro-image-preview",
    messages: [{ role: "user", content }],
    modalities: ["image", "text"],
  }

  const res = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const errText = await res.text()
    console.error("OpenRouter error:", res.status, errText)
    return { error: errText || res.statusText }
  }

  const data = (await res.json()) as OpenRouterResponse
  const imageDataUri = data.choices?.[0]?.message?.images?.[0]?.image_url?.url

  if (!imageDataUri) {
    return { error: "No image in response" }
  }

  return { imageDataUri }
}

function dataUriToBase64(dataUri: string): string {
  const match = dataUri.match(/^data:[^;]+;base64,(.+)$/)
  return match ? match[1] : dataUri
}

export async function POST(req: Request) {

  console.log("🔥 POST /api/generate-image CHAMADO")

  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const formData = await req.formData()

    const userPrompt = formData.get("prompt") as string | null
    const famousSlug = formData.get("famousSlug") as string | null
    const userImages = formData.getAll("images") as File[]

    console.log("🧩 famousSlug recebido:", famousSlug)

    if (!famousSlug) {
      return NextResponse.json(
        { error: "Famoso não informado" },
        { status: 400 }
      )
    }


    const { data: profile } = await supabaseServer
      .from("profiles")
      .select("id, credits")
      .eq("email", session.user.email)
      .single()

    if (!profile || profile.credits <= 0) {
      return NextResponse.json({ error: "Sem créditos" }, { status: 403 })
    }


    const { data: famous } = await supabaseServer
      .from("famous")
      .select("name")
      .eq("slug", famousSlug)
      .single()

    console.log("🧩 famous do banco:", famous)

    if (!famous) {
      return NextResponse.json(
        { error: "Famoso não encontrado" },
        { status: 404 }
      )
    }

    const basePrompt = `
Fotografia hiper-realista, qualidade profissional.

Identidade:
- o rosto do usuário deve ser preservado com fidelidade máxima
- não alterar traços faciais do usuário
- não suavizar, não reestilizar, não reimaginar o rosto do usuário
- manter formato do rosto, nariz, olhos, boca e proporções originais

O famoso: ${famous.name}
- aparência fiel ao famoso
- sem exageros ou caricatura
- aparência respeitosa e realista



Estilo:
- fotografia real
- iluminação natural
- textura de pele realista
- sem aparência de pintura, ilustração ou CGI
`

    const finalPrompt = userPrompt
      ? `${basePrompt}\nPedido do usuário: ${userPrompt}`
      : `${basePrompt}\n crie uma foto seguindo os padrões acima do ${famous.name} junto com o usuário que está na foto.`

    
    const imageFiles: any[] = []

    for (let i = 1; i <= 3; i++) {
  let data = null
  let error = null
  let extension = "png"

  // tenta PNG primeiro
  let path = `${famousSlug}/${i}.png`
  let response = await supabaseServer.storage
    .from("famous_image")
    .download(path)

  if (!response.error && response.data) {
    data = response.data
    extension = "png"
  } else {
    // tenta JPG
    path = `${famousSlug}/${i}.jpg`
    response = await supabaseServer.storage
      .from("famous_image")
      .download(path)

    if (!response.error && response.data) {
      data = response.data
      extension = "jpg"
    }
  }

  if (!data) {
    console.warn(`⚠️ Imagem não encontrada: ${famousSlug}/${i}.png ou .jpg`)
    continue
  }

  const buffer = Buffer.from(await data.arrayBuffer())

  imageFiles.push(
    await toFile(buffer, `${famousSlug}-${i}.${extension}`, {
      type: extension === "jpg" ? "image/jpeg" : "image/png",
    })
  )
}

    for (let i = 0; i < userImages.length; i++) {
      const img = userImages[i]
      if (!img || img.size === 0) continue

      const buffer = Buffer.from(await img.arrayBuffer())

      imageFiles.push(
        await toFile(buffer, `user-${i}.png`, {
          type: img.type || "image/png",
        })
      )
    }

    if (imageFiles.length === 0) {
      return NextResponse.json(
        { error: "Nenhuma imagem válida encontrada" },
        { status: 400 }
      )
    }

    const apiKey = process.env.NANOBANANA_API_KEY || process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "NANOBANANA_API_KEY ou OPENROUTER_API_KEY não configurada" },
        { status: 500 }
      )
    }

    const imageDataUris = await Promise.all(imageFiles.map(fileToDataUri))
    const result = await generateImageOpenRouter(finalPrompt, imageDataUris, apiKey)

    if ("error" in result) {
      console.error("OpenRouter image gen error:", result.error)
      return NextResponse.json(
        { error: "Falha ao gerar imagem" },
        { status: 500 }
      )
    }

    const newCredits = profile.credits - 1
    await supabaseServer
      .from("profiles")
      .update({ credits: newCredits })
      .eq("email", session.user.email)

    const base64Image = dataUriToBase64(result.imageDataUri)

    await supabaseServer.from("generations").insert({
      profile_id: profile.id,
      famous_slug: famousSlug,
      prompt: userPrompt?.trim() || null,
    })

    return NextResponse.json({
      image: base64Image,
      credits: newCredits,
    })

  } catch (err: any) {
    console.error("GENERATE IMAGE ERROR:", err)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
