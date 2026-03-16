import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"
import { CREDIT_PACKAGES } from "../create-billing/route"
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
    console.log("[Webhook] event:", body.event ?? body.type)

    // AbacatePay v1: { event, devMode, data: { id, amount, status, customer: { id, email }, ... } }
    // v1 payload does NOT include our custom metadata; we must fetch the billing by id to get it.
    const event = body.event ?? body.type
    const data = body.data ?? body

    if (event !== "billing.paid") {
      console.log("[Webhook] Ignoring event:", event)
      return NextResponse.json({ received: true })
    }

    let billing = data?.billing ?? data
    const billingId = billing?.id ?? data?.id

    if (!billingId || typeof billingId !== "string" || billingId.length > 128) {
      console.error("[Webhook] Invalid or missing billing id")
      return NextResponse.json({ error: "Payload inválido" }, { status: 400 })
    }

    // v1 webhook does not send metadata; fetch full billing to get userEmail, packageId, credits
    if (!billing?.metadata?.userEmail || !billing?.metadata?.packageId) {
      console.log("[Webhook] Fetching billing from API (v1 payload has no metadata):", billingId)
      const getRes = await fetch(`${ABACATEPAY_API_URL}/v1/billing/get?id=${encodeURIComponent(billingId)}`, {
        headers: {
          accept: "application/json",
          authorization: `Bearer ${process.env.ABACATEPAY_API_KEY}`,
        },
      })
      const getData = await getRes.json()
      if (getData?.data) billing = getData.data
    }

    const userEmail =
      (billing?.metadata?.userEmail as string | undefined) ??
      (billing?.customer?.email as string | undefined)
    const packageId = billing?.metadata?.packageId as string | undefined

    if (!userEmail || !packageId) {
      console.error("[Webhook] Missing metadata after fetch. billing.metadata:", billing?.metadata)
      return NextResponse.json({ error: "Metadata inválido" }, { status: 400 })
    }

    // Validate the package and use its credits (never trust payload amount)
    const pkg = CREDIT_PACKAGES.find((p) => p.id === packageId)
    if (!pkg) {
      console.error("Unknown package from webhook:", packageId)
      return NextResponse.json({ error: "Pacote inválido" }, { status: 400 })
    }

    const creditsToAdd = pkg.credits

    // Fetch current credits
    const { data: profile, error: fetchError } = await supabaseServer
      .from("profiles")
      .select("credits")
      .eq("email", userEmail)
      .single()

    if (fetchError || !profile) {
      console.error("Profile not found for webhook:", userEmail, fetchError)
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    const newCredits = (profile.credits ?? 0) + creditsToAdd

    const { error: updateError } = await supabaseServer
      .from("profiles")
      .update({ credits: newCredits })
      .eq("email", userEmail)

    if (updateError) {
      console.error("Failed to update credits:", updateError)
      return NextResponse.json({ error: "Erro ao atualizar créditos" }, { status: 500 })
    }

    console.log(`✅ Credits updated for ${userEmail}: +${creditsToAdd} → total ${newCredits}`)

    return NextResponse.json({ received: true, credits: newCredits })
  } catch (err) {
    console.error("WEBHOOK ERROR:", err)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
