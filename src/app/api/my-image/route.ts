import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { supabaseServer } from "@/lib/supabase-server"
import { addWatermark } from "@/lib/watermark"

// Serve a foto do próprio usuário: LIMPA se paga, COM marca d'água se não paga.
// Nunca entrega a versão limpa de uma geração não paga.
export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const id = new URL(req.url).searchParams.get("id")
    if (!id) {
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

    const { data: gen } = await supabaseServer
      .from("generations")
      .select("id, paid, storage_path")
      .eq("id", id)
      .eq("profile_id", profile.id)
      .single()

    if (!gen || !gen.storage_path) {
      return NextResponse.json({ error: "Imagem não disponível" }, { status: 404 })
    }

    const { data: fileData, error: downloadError } = await supabaseServer.storage
      .from("generated_images")
      .download(gen.storage_path)

    if (downloadError || !fileData) {
      console.error("my-image download error:", downloadError)
      return NextResponse.json({ error: "Erro ao baixar imagem" }, { status: 500 })
    }

    let buffer: Buffer = Buffer.from(await fileData.arrayBuffer())
    if (!gen.paid) {
      buffer = await addWatermark(buffer)
    }

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "private, max-age=300",
      },
    })
  } catch (err) {
    console.error("MY IMAGE ERROR:", err)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
