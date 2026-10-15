import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"
import { getPaymentStatus, verifyWebhookSignature } from "@/lib/mercadopago"

// Webhook do Mercado Pago (reforço do polling). A autoridade final é reconsultar
// o pagamento com nosso token — um webhook forjado não consegue fingir "approved".
export async function POST(req: Request) {
  try {
    const url = new URL(req.url)
    const bodyText = await req.text()
    let body: Record<string, unknown> = {}
    try {
      body = bodyText ? JSON.parse(bodyText) : {}
    } catch {
      body = {}
    }

    const type =
      url.searchParams.get("type") ||
      url.searchParams.get("topic") ||
      (body.type as string | undefined) ||
      (body.action ? String(body.action).split(".")[0] : undefined)

    const dataId =
      url.searchParams.get("data.id") ||
      ((body.data as { id?: string } | undefined)?.id ?? null) ||
      (body.id ? String(body.id) : null)

    // Só tratamos eventos de pagamento.
    if (type && type !== "payment") {
      return NextResponse.json({ received: true })
    }
    if (!dataId) {
      return NextResponse.json({ received: true })
    }

    // Validação de assinatura (camada extra; não bloqueia, pois reconsultamos).
    const validSig = verifyWebhookSignature({
      xSignature: req.headers.get("x-signature"),
      xRequestId: req.headers.get("x-request-id"),
      dataId: url.searchParams.get("data.id") || dataId,
    })
    if (!validSig) {
      console.warn("[MP Webhook] assinatura inválida ou ausente — validando via reconsulta")
    }

    const status = await getPaymentStatus(String(dataId))
    if (status.ok && status.status === "approved" && status.externalReference) {
      const { error } = await supabaseServer
        .from("generations")
        .update({ paid: true })
        .eq("id", status.externalReference)
      if (error) {
        console.error("[MP Webhook] erro ao marcar paga:", error)
        return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 })
      }
      console.log(`[MP Webhook] geração ${status.externalReference} marcada como paga`)
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error("MP WEBHOOK ERROR:", err)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

// MP às vezes faz um GET de validação da URL.
export async function GET() {
  return NextResponse.json({ ok: true })
}
