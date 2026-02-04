import { NextResponse } from "next/server"
import OpenAI, { toFile } from "openai"
import sharp from "sharp"
import { auth } from "@/lib/auth"
import { supabaseServer } from "@/lib/supabase-server"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const formData = await req.formData()

    const prompt = formData.get("prompt") as string | null
    const img1 = formData.get("image1") as File | null
    const img2 = formData.get("image2") as File | null

    if (!prompt || !img1 || !img2) {
      return NextResponse.json(
        { error: "Prompt e duas imagens são obrigatórios" },
        { status: 400 }
      )
    }

    const { data: profile } = await supabaseServer
      .from("profiles")
      .select("credits")
      .eq("id", session.user.id)
      .single()

    if (!profile || profile.credits <= 0) {
      return NextResponse.json({ error: "Sem créditos" }, { status: 403 })
    }

    const buffer1 = Buffer.from(await img1.arrayBuffer())
    const buffer2 = Buffer.from(await img2.arrayBuffer())

    const height = 1024

    const imgA = await sharp(buffer1).resize({ height }).toBuffer()
    const imgB = await sharp(buffer2).resize({ height }).toBuffer()

    const metaA = await sharp(imgA).metadata()
    const metaB = await sharp(imgB).metadata()

    const composed = await sharp({
      create: {
        width: (metaA.width || 512) + (metaB.width || 512),
        height,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 1 },
      },
    })
      .composite([
        { input: imgA, left: 0, top: 0 },
        { input: imgB, left: metaA.width || 512, top: 0 },
      ])
      .png()
      .toBuffer()

    const openAiImage = await toFile(composed, "combined.png", {
      type: "image/png",
    })

    const result = await openai.images.edit({
      model: "gpt-image-1",
      image: openAiImage,
      prompt,
      size: "auto",
    })

    const newCredits = profile.credits - 1

    await supabaseServer
      .from("profiles")
      .update({ credits: newCredits })
      .eq("id", session.user.id)

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

  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
