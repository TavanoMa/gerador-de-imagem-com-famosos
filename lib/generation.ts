import { toFile } from "openai"
import { supabaseServer } from "@/lib/supabase-server"
import { getComboMembers, getFamous } from "@/src/data/politics"
import "server-only"

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"

// Gerações grátis por usuário (vitalício). A partir daí, paga antes de gerar.
export const FREE_GENERATION_LIMIT = 2

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

export type UserImageInput = { buffer: Buffer; type: string; name: string }

function bufferToDataUri(buffer: Buffer, type: string): string {
  const base64 = buffer.toString("base64")
  const mime = type || "image/png"
  return `data:${mime};base64,${base64}`
}

function dataUriToBase64(dataUri: string): string {
  const match = dataUri.match(/^data:[^;]+;base64,(.+)$/)
  return match ? match[1] : dataUri
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

async function downloadRefImages(
  slug: string
): Promise<Awaited<ReturnType<typeof toFile>>[]> {
  const files: Awaited<ReturnType<typeof toFile>>[] = []

  for (let i = 1; i <= 3; i++) {
    let data = null
    let extension = "png"

    let storagePath = `${slug}/${i}.png`
    let response = await supabaseServer.storage
      .from("famous_image")
      .download(storagePath)

    if (!response.error && response.data) {
      data = response.data
      extension = "png"
    } else {
      storagePath = `${slug}/${i}.jpg`
      response = await supabaseServer.storage
        .from("famous_image")
        .download(storagePath)

      if (!response.error && response.data) {
        data = response.data
        extension = "jpg"
      }
    }

    if (!data) continue

    const buffer = Buffer.from(await data.arrayBuffer())
    files.push(
      await toFile(buffer, `${slug}-${i}.${extension}`, {
        type: extension === "jpg" ? "image/jpeg" : "image/png",
      })
    )
  }

  return files
}

function buildPrompt(famousNames: string[], userPrompt: string | null): string {
  const joined = famousNames.join(" e ")

  const famousBlock =
    famousNames.length > 1
      ? `Os famosos (TODOS devem aparecer juntos na mesma imagem, ao lado do usuário): ${joined}
- cada famoso com aparência fiel a si mesmo
- sem exageros ou caricatura
- os famosos e o usuário juntos na mesma cena, de forma natural e realista
- não misturar ou fundir os rostos dos famosos entre si`
      : `O famoso: ${joined}
- aparência fiel ao famoso
- sem exageros ou caricatura
- aparência respeitosa e realista`

  const basePrompt = `
Fotografia hiper-realista, qualidade profissional.

Identidade:
- o rosto do usuário deve ser preservado com fidelidade máxima
- não alterar traços faciais do usuário
- não suavizar, não reestilizar, não reimaginar o rosto do usuário
- manter formato do rosto, nariz, olhos, boca e proporções originais

${famousBlock}

Estilo:
- fotografia real
- iluminação natural
- textura de pele realista
- sem aparência de pintura, ilustração ou CGI
`

  return userPrompt
    ? `${basePrompt}\nPedido do usuário: ${userPrompt}`
    : `${basePrompt}\n crie uma foto seguindo os padrões acima com ${joined} junto com o usuário que está na foto.`
}

/** Resolve nome(s) do(s) famoso(s) e as pastas de referência (combo-aware). */
async function resolveFamous(
  famousSlug: string
): Promise<{ names: string[]; refSlugs: string[] } | { error: string }> {
  const comboMembers = getComboMembers(famousSlug)

  if (comboMembers.length > 1) {
    return {
      refSlugs: comboMembers,
      names: comboMembers.map((m) => getFamous(m)?.name ?? m),
    }
  }

  const { data: famous } = await supabaseServer
    .from("famous")
    .select("name")
    .eq("slug", famousSlug)
    .single()

  if (!famous) return { error: "Famoso não encontrado" }

  return { refSlugs: [famousSlug], names: [famous.name] }
}

/**
 * Gera a imagem (combo-aware), salva a versão LIMPA em generated_images/{id}.png
 * e atualiza storage_path. Retorna o buffer limpo (sem marca d'água).
 * Reutilizado pela geração grátis e pela finalização pós-pagamento.
 */
export async function runGeneration(opts: {
  generationId: string
  famousSlug: string
  prompt: string | null
  userImages: UserImageInput[]
}): Promise<{ cleanBuffer: Buffer } | { error: string; status?: number }> {
  const { generationId, famousSlug, prompt, userImages } = opts

  const resolved = await resolveFamous(famousSlug)
  if ("error" in resolved) return { error: resolved.error, status: 404 }

  const finalPrompt = buildPrompt(resolved.names, prompt)

  const imageFiles: Awaited<ReturnType<typeof toFile>>[] = []
  for (const refSlug of resolved.refSlugs) {
    const refs = await downloadRefImages(refSlug)
    imageFiles.push(...refs)
  }

  for (let i = 0; i < userImages.length; i++) {
    const img = userImages[i]
    if (!img || img.buffer.length === 0) continue
    imageFiles.push(
      await toFile(img.buffer, img.name || `user-${i}.png`, {
        type: img.type || "image/png",
      })
    )
  }

  if (imageFiles.length === 0) {
    return { error: "Nenhuma imagem válida encontrada", status: 400 }
  }

  const apiKey = process.env.NANOBANANA_API_KEY || process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return { error: "NANOBANANA_API_KEY ou OPENROUTER_API_KEY não configurada", status: 500 }
  }

  const imageDataUris = await Promise.all(
    imageFiles.map(async (f) => {
      const buffer = Buffer.from(await f.arrayBuffer())
      return bufferToDataUri(buffer, f.type)
    })
  )

  const result = await generateImageOpenRouter(finalPrompt, imageDataUris, apiKey)
  if ("error" in result) {
    console.error("OpenRouter image gen error:", result.error)
    return { error: "Falha ao gerar imagem", status: 500 }
  }

  const cleanBase64 = dataUriToBase64(result.imageDataUri)
  const cleanBuffer = Buffer.from(cleanBase64, "base64")

  const storagePath = `${generationId}.png`
  const { error: uploadError } = await supabaseServer.storage
    .from("generated_images")
    .upload(storagePath, cleanBuffer, {
      contentType: "image/png",
      upsert: true,
    })

  if (uploadError) {
    console.error("Storage upload error:", uploadError)
    return { error: "Erro ao salvar imagem", status: 500 }
  }

  await supabaseServer
    .from("generations")
    .update({ storage_path: storagePath })
    .eq("id", generationId)

  return { cleanBuffer }
}
