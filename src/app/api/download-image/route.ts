import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { supabaseServer } from "@/lib/supabase-server"

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
      .select("id, profile_id, paid, storage_path")
      .eq("id", generationId)
      .eq("profile_id", profile.id)
      .single()

    if (!generation) {
      return NextResponse.json({ error: "Geração não encontrada" }, { status: 404 })
    }

    if (!generation.paid) {
      return NextResponse.json({ error: "Pagamento não confirmado" }, { status: 403 })
    }

    if (!generation.storage_path) {
      return NextResponse.json({ error: "Imagem não disponível" }, { status: 404 })
    }

    const { data: fileData, error: downloadError } = await supabaseServer.storage
      .from("generated_images")
      .download(generation.storage_path)

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
