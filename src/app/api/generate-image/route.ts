import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { supabaseServer } from "@/lib/supabase-server"
import { runGeneration, FREE_GENERATION_LIMIT, type UserImageInput } from "@/lib/generation"
import { addWatermark } from "@/lib/watermark"

export async function GET() {
  return NextResponse.json({ ok: true })
}

export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const formData = await req.formData()

    const userPrompt = formData.get("prompt") as string | null
    const famousSlug = formData.get("famousSlug") as string | null
    const userImages = formData.getAll("images") as File[]

    if (!famousSlug) {
      return NextResponse.json({ error: "Famoso não informado" }, { status: 400 })
    }

    const { data: profile } = await supabaseServer
      .from("profiles")
      .select("id")
      .eq("email", session.user.email)
      .single()

    if (!profile) {
      return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 })
    }

    // Limite de gerações grátis: conta só as NÃO compradas e já geradas.
    // Fotos compradas (paid=true) e tentativas abandonadas (sem imagem) não contam.
    const { count } = await supabaseServer
      .from("generations")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", profile.id)
      .eq("paid", false)
      .not("storage_path", "is", null)

    const used = count ?? 0
    if (used >= FREE_GENERATION_LIMIT) {
      return NextResponse.json(
        { requiresPayment: true, freeUsed: used, freeLimit: FREE_GENERATION_LIMIT },
        { status: 402 }
      )
    }

    // Prepara as imagens do usuário.
    const inputs: UserImageInput[] = []
    for (let i = 0; i < userImages.length; i++) {
      const img = userImages[i]
      if (!img || img.size === 0) continue
      const buffer = Buffer.from(await img.arrayBuffer())
      inputs.push({ buffer, type: img.type || "image/png", name: `user-${i}.png` })
    }

    if (inputs.length === 0) {
      return NextResponse.json({ error: "Nenhuma imagem válida encontrada" }, { status: 400 })
    }

    // Cria a geração (conta para o limite) e gera.
    const { data: generation, error: genError } = await supabaseServer
      .from("generations")
      .insert({
        profile_id: profile.id,
        famous_slug: famousSlug,
        prompt: userPrompt?.trim() || null,
        paid: false,
      })
      .select("id")
      .single()

    if (genError || !generation) {
      console.error("Generation insert error:", genError)
      return NextResponse.json({ error: "Erro ao salvar geração" }, { status: 500 })
    }

    const result = await runGeneration({
      generationId: generation.id,
      famousSlug,
      prompt: userPrompt,
      userImages: inputs,
    })

    if ("error" in result) {
      // Falha: remove a linha para não consumir uma geração grátis.
      await supabaseServer.from("generations").delete().eq("id", generation.id)
      return NextResponse.json({ error: result.error }, { status: result.status ?? 500 })
    }

    const watermarkedBuffer = await addWatermark(result.cleanBuffer)
    const watermarkedBase64 = watermarkedBuffer.toString("base64")

    return NextResponse.json({
      image: watermarkedBase64,
      generationId: generation.id,
    })
  } catch (err: unknown) {
    console.error("GENERATE IMAGE ERROR:", err)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
