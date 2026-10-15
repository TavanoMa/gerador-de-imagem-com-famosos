import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { supabaseServer } from "@/lib/supabase-server"
import { runGeneration, type UserImageInput } from "@/lib/generation"

// Gera uma geração pré-paga pendente (paga, mas ainda sem imagem) a partir das
// imagens enviadas antes do pagamento. Retorna o storage_path final ou null.
async function finalizePrepaid(generation: {
  id: string
  famous_slug: string
  prompt: string | null
}): Promise<string | null> {
  // Outra requisição pode já ter gerado nesse meio tempo.
  const { data: fresh } = await supabaseServer
    .from("generations")
    .select("storage_path")
    .eq("id", generation.id)
    .single()
  if (fresh?.storage_path) return fresh.storage_path

  const { data: list } = await supabaseServer.storage
    .from("generated_images")
    .list(`inputs/${generation.id}`)

  if (!list || list.length === 0) return null

  const userImages: UserImageInput[] = []
  for (const file of list) {
    const { data, error } = await supabaseServer.storage
      .from("generated_images")
      .download(`inputs/${generation.id}/${file.name}`)
    if (error || !data) continue
    const buffer = Buffer.from(await data.arrayBuffer())
    userImages.push({
      buffer,
      type: data.type || "image/png",
      name: file.name,
    })
  }

  if (userImages.length === 0) return null

  const result = await runGeneration({
    generationId: generation.id,
    famousSlug: generation.famous_slug,
    prompt: generation.prompt,
    userImages,
  })

  if ("error" in result) {
    console.error("Prepaid finalize error:", result.error)
    return null
  }

  return `${generation.id}.png`
}

export async function GET(req: Request) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const url = new URL(req.url)
    const generationId = url.searchParams.get("id")

    if (!generationId) {
      return NextResponse.json({ error: "ID não informado" }, { status: 400 })
    }

    const { data: profile } = await supabaseServer
      .from("profiles")
      .select("id")
      .eq("email", session.user.email)
      .single()

    if (!profile) {
      return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 })
    }

    const { data: generation } = await supabaseServer
      .from("generations")
      .select("id, profile_id, paid, storage_path, famous_slug, prompt")
      .eq("id", generationId)
      .eq("profile_id", profile.id)
      .single()

    if (!generation) {
      return NextResponse.json({ error: "Geração não encontrada" }, { status: 404 })
    }

    if (!generation.paid) {
      return NextResponse.json({ error: "Pagamento não confirmado" }, { status: 403 })
    }

    let storagePath = generation.storage_path

    // Geração pré-paga: paga mas ainda não gerada → gera agora (sem marca d'água).
    if (!storagePath) {
      storagePath = await finalizePrepaid(generation)
      if (!storagePath) {
        return NextResponse.json({ error: "Imagem não disponível" }, { status: 404 })
      }
    }

    const { data: fileData, error: downloadError } = await supabaseServer.storage
      .from("generated_images")
      .download(storagePath)

    if (downloadError || !fileData) {
      console.error("Storage download error:", downloadError)
      return NextResponse.json({ error: "Erro ao baixar imagem" }, { status: 500 })
    }

    const buffer = Buffer.from(await fileData.arrayBuffer())

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "private, max-age=3600",
      },
    })
  } catch (err) {
    console.error("DOWNLOAD IMAGE ERROR:", err)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
