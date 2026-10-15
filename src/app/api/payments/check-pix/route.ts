import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { supabaseServer } from "@/lib/supabase-server"
import { getPaymentStatus } from "@/lib/mercadopago"

// Consulta o status do PIX (polling da tela). Quando aprovado, marca a geração
// como paga (escopada ao usuário logado) e responde { approved: true }.
export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const paymentId = new URL(req.url).searchParams.get("paymentId")
    if (!paymentId) {
      return NextResponse.json({ error: "paymentId não informado" }, { status: 400 })
    }

    const result = await getPaymentStatus(paymentId)
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 502 })
    }

    const approved = result.status === "approved"

    if (approved && result.externalReference) {
      const { data: profile } = await supabaseServer
        .from("profiles")
        .select("id")
        .eq("email", session.user.email)
        .single()

      if (profile) {
        await supabaseServer
          .from("generations")
          .update({ paid: true })
          .eq("id", result.externalReference)
          .eq("profile_id", profile.id)
      }
    }

    return NextResponse.json({ status: result.status, approved })
  } catch (err) {
    console.error("CHECK PIX ERROR:", err)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
