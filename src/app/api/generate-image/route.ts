import { NextResponse } from "next/server"
import OpenAI from "openai"
import { auth } from "@/lib/auth"
import { supabaseServer } from "@/lib/supabase-server"

console.log("OPENAI KEY:", process.env.OPENAI_API_KEY)

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

  const { data: profile, error } = await supabaseServer
    .from("profiles")
    .select("credits")
    .eq("id", session.user.id)
    .single()

  if (error || !profile || profile.credits <= 0) {
    return NextResponse.json({ error: "Sem créditos" }, { status: 403 })
  }

  const result = await openai.images.generate({
    model: "gpt-image-1-mini",
    prompt,
    size: "auto",
  })

  if (!result.data?.length) {
    return NextResponse.json(
      { error: "Falha ao gerar imagem" },
      { status: 500 }
    )
  }

  const newCredits = profile.credits - 1

  await supabaseServer
    .from("profiles")
    .update({ credits: newCredits })
    .eq("id", session.user.id)

  return NextResponse.json({
    image: result.data[0].b64_json,
    credits: newCredits,
  })
}
