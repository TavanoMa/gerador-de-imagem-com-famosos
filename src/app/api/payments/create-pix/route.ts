import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { supabaseServer } from "@/lib/supabase-server"
import { createPixPayment } from "@/lib/mercadopago"

function extFromType(type: string): string {
  if (type.includes("jpeg") || type.includes("jpg")) return "jpg"
  if (type.includes("webp")) return "webp"
  return "png"
}

function getBaseUrl() {
  return (
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  )
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const formData = await req.formData()
    const existingId = (formData.get("generationId") as string | null)?.trim() || null

    const { data: profile } = await supabaseServer
      .from("profiles")
      .select("id")
      .eq("email", session.user.email)
      .single()

    if (!profile) {
      return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 })
    }

    let generationId: string

    if (existingId) {
      // Modo "baixar sem marca": a geração já existe (foto grátis com marca).
      const { data: existing } = await supabaseServer
        .from("generations")
        .select("id, paid")
        .eq("id", existingId)
        .eq("profile_id", profile.id)
        .single()

      if (!existing) {
        return NextResponse.json({ error: "Geração não encontrada" }, { status: 404 })
      }
      if (existing.paid) {
        return NextResponse.json({ error: "Geração já paga", alreadyPaid: true }, { status: 409 })
      }
      generationId = existing.id
    } else {
      // Modo pré-pago (6ª foto+): cria geração PENDENTE e sobe as imagens pra gerar depois.
      const userPrompt = formData.get("prompt") as string | null
      const famousSlug = formData.get("famousSlug") as string | null
      const userImages = formData.getAll("images") as File[]

      if (!famousSlug) {
        return NextResponse.json({ error: "Famoso não informado" }, { status: 400 })
      }
      const validImages = userImages.filter((f) => f && f.size > 0)
      if (validImages.length === 0) {
        return NextResponse.json({ error: "Nenhuma imagem válida" }, { status: 400 })
      }

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
        console.error("create-pix insert error:", genError)
        return NextResponse.json({ error: "Erro ao iniciar geração" }, { status: 500 })
      }
      generationId = generation.id

      for (let i = 0; i < validImages.length; i++) {
        const img = validImages[i]
        const buffer = Buffer.from(await img.arrayBuffer())
        const inputPath = `inputs/${generationId}/user-${i}.${extFromType(img.type)}`
        const { error: upErr } = await supabaseServer.storage
          .from("generated_images")
          .upload(inputPath, buffer, { contentType: img.type || "image/png", upsert: true })
        if (upErr) {
          console.error("create-pix input upload error:", upErr)
          await supabaseServer.from("generations").delete().eq("id", generationId)
          return NextResponse.json({ error: "Erro ao enviar imagens" }, { status: 500 })
        }
      }
    }

    const base = getBaseUrl()
    const notificationUrl = base.startsWith("https")
      ? `${base}/api/payments/mercadopago-webhook`
      : undefined

    const pix = await createPixPayment({
      amount: 1,
      description: "Foto sem marca d'água",
      payerEmail: session.user.email,
      externalReference: generationId,
      notificationUrl,
    })

    if (!pix.ok) {
      // Se criamos a geração agora (pré-pago), remove pra não deixar lixo.
      if (!existingId) {
        await supabaseServer.from("generations").delete().eq("id", generationId)
      }
      return NextResponse.json({ error: pix.error }, { status: 500 })
    }

    return NextResponse.json({
      generationId,
      paymentId: pix.paymentId,
      qrCodeBase64: pix.qrCodeBase64,
      copiaECola: pix.copiaECola,
    })
  } catch (err) {
    console.error("CREATE PIX ERROR:", err)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
