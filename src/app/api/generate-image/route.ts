import { NextResponse } from "next/server"
import OpenAI, { toFile } from "openai"
import { auth } from "@/lib/auth"
import { supabaseServer } from "@/lib/supabase-server"

export async function GET() {
  return NextResponse.json({ ok: true })
}



const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

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
      .select("credits")
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

   
    const result = await openai.images.edit({
      model: "gpt-image-1.5",
      image: imageFiles,
      prompt: finalPrompt,
      size: "auto",
    })


    const newCredits = profile.credits - 1
    await supabaseServer
      .from("profiles")
      .update({ credits: newCredits })
      .eq("email", session.user.email)

    if (!result.data || result.data.length === 0) {
      return NextResponse.json(
        { error: "Falha ao gerar imagem" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      image: result.data[0].b64_json,
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
