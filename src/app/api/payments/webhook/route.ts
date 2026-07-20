import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"
import crypto from "node:crypto"

const ABACATEPAY_API_URL = "https://api.abacatepay.com"

function getWebhookSecretFromRequest(req: Request): string | null {
  const url = new URL(req.url)
  return url.searchParams.get("webhookSecret") ?? url.searchParams.get("secret")
}

function timingSafeEqual(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, "utf8")
    const bufB = Buffer.from(b, "utf8")
    if (bufA.length !== bufB.length) return false
    return crypto.timingSafeEqual(bufA, bufB)
  } catch {
    return false
  }
}

export async function POST(req: Request) {
  try {
    const expectedSecret = process.env.ABACATEPAY_WEBHOOK_SECRET
    if (expectedSecret) {
      const received = getWebhookSecretFromRequest(req)
      if (!received || !timingSafeEqual(received, expectedSecret)) {
        console.warn("[Webhook] Invalid or missing webhook secret")
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    }

    const body = await req.json()
    const event = body.event ?? body.type
    const data = body.data ?? body

    if (event !== "billing.paid") {
      return NextResponse.json({ received: true })
    }

    let billing = data?.billing ?? data
    const billingId = billing?.id ?? data?.id

    if (!billingId || typeof billingId !== "string" || billingId.length > 128) {
      console.error("[Webhook] Invalid or missing billing id")
      return NextResponse.json({ error: "Payload inválido" }, { status: 400 })
    }

    if (!billing?.metadata?.generationId) {
      const getRes = await fetch(`${ABACATEPAY_API_URL}/v1/billing/get?id=${encodeURIComponent(billingId)}`, {
        headers: {
          accept: "application/json",
          authorization: `Bearer ${process.env.ABACATEPAY_API_KEY}`,
        },
      })
      const getData = await getRes.json()
      if (getData?.data) billing = getData.data
    }

    const generationId =
      (billing?.metadata?.generationId as string | undefined) ??
      (Array.isArray(billing?.products) && billing.products[0]?.externalId
        ? String(billing.products[0].externalId).replace("download-", "")
        : undefined)

    if (!generationId) {
      console.error("[Webhook] Missing generationId. billing.metadata:", billing?.metadata)
      return NextResponse.json({ error: "Metadata inválido" }, { status: 400 })
    }

    const { error: updateError } = await supabaseServer
      .from("generations")
      .update({ paid: true })
      .eq("id", generationId)

    if (updateError) {
      console.error("[Webhook] Failed to mark generation as paid:", updateError)
      return NextResponse.json({ error: "Erro ao atualizar geração" }, { status: 500 })
    }

    console.log(`[Webhook] Generation ${generationId} marked as paid`)

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error("WEBHOOK ERROR:", err)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
