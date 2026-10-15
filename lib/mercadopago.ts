import "server-only"
import crypto from "node:crypto"

const MP_API = "https://api.mercadopago.com"

type CreatePixResult =
  | {
      ok: true
      paymentId: string
      qrCodeBase64: string
      copiaECola: string
      ticketUrl: string | null
      status: string
    }
  | { ok: false; error: string; status?: number }

// Cria uma cobrança PIX no Mercado Pago. Não exige CPF (testado ao vivo).
export async function createPixPayment(opts: {
  amount: number
  description: string
  payerEmail: string
  externalReference: string
  notificationUrl?: string
}): Promise<CreatePixResult> {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN
  if (!token) return { ok: false, error: "MERCADOPAGO_ACCESS_TOKEN ausente" }

  const body: Record<string, unknown> = {
    transaction_amount: opts.amount,
    description: opts.description,
    payment_method_id: "pix",
    external_reference: opts.externalReference,
    payer: {
      email: opts.payerEmail,
      first_name: "Cliente",
      last_name: "FotoComFamosos",
    },
  }
  if (opts.notificationUrl) body.notification_url = opts.notificationUrl

  const res = await fetch(`${MP_API}/v1/payments`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      "X-Idempotency-Key": crypto.randomUUID(),
    },
    body: JSON.stringify(body),
  })

  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    console.error("MP create pix error:", JSON.stringify(json).slice(0, 500))
    return { ok: false, error: json?.message || "Erro ao criar PIX", status: res.status }
  }

  const tx = json?.point_of_interaction?.transaction_data
  if (!tx?.qr_code || !tx?.qr_code_base64) {
    return { ok: false, error: "PIX criado sem QR code" }
  }

  return {
    ok: true,
    paymentId: String(json.id),
    qrCodeBase64: tx.qr_code_base64,
    copiaECola: tx.qr_code,
    ticketUrl: tx.ticket_url ?? null,
    status: json.status,
  }
}

type StatusResult =
  | { ok: true; status: string; externalReference: string | null }
  | { ok: false; error: string; status?: number }

// Consulta o status de um pagamento. status === "approved" quando pago.
export async function getPaymentStatus(paymentId: string): Promise<StatusResult> {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN
  if (!token) return { ok: false, error: "MERCADOPAGO_ACCESS_TOKEN ausente" }

  const res = await fetch(`${MP_API}/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: { authorization: `Bearer ${token}` },
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { ok: false, error: json?.message || "Erro ao consultar pagamento", status: res.status }
  }
  return {
    ok: true,
    status: String(json.status),
    externalReference: json.external_reference ?? null,
  }
}

// Valida a assinatura (x-signature) do webhook do Mercado Pago.
// Autoridade final é reconsultar o pagamento; isto é uma camada extra.
export function verifyWebhookSignature(opts: {
  xSignature: string | null
  xRequestId: string | null
  dataId: string | null
}): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET
  if (!secret || !opts.xSignature || !opts.dataId) return false

  const parts: Record<string, string> = {}
  for (const kv of opts.xSignature.split(",")) {
    const [k, v] = kv.split("=")
    if (k && v) parts[k.trim()] = v.trim()
  }
  const ts = parts.ts
  const v1 = parts.v1
  if (!ts || !v1) return false

  const id = /^[a-zA-Z0-9]+$/.test(opts.dataId) ? opts.dataId.toLowerCase() : opts.dataId
  const manifest = `id:${id};request-id:${opts.xRequestId ?? ""};ts:${ts};`
  const hmac = crypto.createHmac("sha256", secret).update(manifest).digest("hex")
  try {
    return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(v1))
  } catch {
    return false
  }
}
