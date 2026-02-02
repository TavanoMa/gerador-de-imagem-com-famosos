import { NextResponse } from "next/server"
import OpenAI from 'openai'
import { auth } from "@/lib/auth"
import { supabase } from "@/lib/supabase"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

export async function POST(req: Request) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const { prompt } = await req.json()

  if (!prompt) {
    return NextResponse.json({ error: "Prompt inválido" }, { status: 400 })
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("credits")
    .eq("id", session.user.id)
    .single()

  if (!profile || profile.credits <= 0) {
    return NextResponse.json({ error: "Sem créditos" }, { status: 403 })
  }

  const result = await openai.images.generate({
    model: "gpt-image-1-mini",
    prompt,
    size: "auto",
    n: 1,
  })

  const newCredits = profile.credits - 1

  await supabase
    .from("profiles")
    .update({ credits: newCredits })
    .eq("id", session.user.id)

  if (!result.data || result.data.length === 0) {
  return Response.json(
    { error: "Falha ao gerar imagem" },
    { status: 500 }
  )
}

const imageBase64 = result.data[0].b64_json

return Response.json({
  image: imageBase64,
  credits: newCredits,
})
}