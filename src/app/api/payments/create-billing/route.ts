import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { supabaseServer } from "@/lib/supabase-server"

const ABACATEPAY_API_URL = "https://api.abacatepay.com"

function formatCpf(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 11)
  if (digits.length !== 11) return raw
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

function formatPhone(raw: string) {
  const digits = raw.replace(/\D/g, "")
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return raw
}

export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const body = await req.json()
    const { generationId, taxId, cellphone } = body

    if (!generationId || typeof generationId !== "string") {
      return NextResponse.json({ error: "ID da geração inválido" }, { status: 400 })
    }

    const { data: profile } = await supabaseServer
      .from("profiles")
      .select("id, tax_id, cellphone")
      .eq("email", session.user.email)
      .single()

    if (!profile) {
      return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 })
    }

    const { data: generation } = await supabaseServer
      .from("generations")
      .select("id, profile_id, paid")
      .eq("id", generationId)
      .eq("profile_id", profile.id)
      .single()

    if (!generation) {
      return NextResponse.json({ error: "Geração não encontrada" }, { status: 404 })
    }

    if (generation.paid) {
      return NextResponse.json({ error: "Esta imagem já foi paga" }, { status: 400 })
    }

    const finalTaxId = taxId || profile.tax_id
    const finalCellphone = cellphone || profile.cellphone

    if (!finalTaxId || !finalCellphone) {
      return NextResponse.json(
        { error: "CPF e telefone são obrigatórios" },
        { status: 400 }
      )
    }

    if (taxId && cellphone) {
      await supabaseServer
        .from("profiles")
        .update({ tax_id: taxId, cellphone })
        .eq("id", profile.id)
    }

    const apiHeaders = {
      accept: "application/json",
      authorization: `Bearer ${process.env.ABACATEPAY_API_KEY}`,
      "content-type": "application/json",
    }

    const customerPayload = {
      name: session.user.name ?? "Usuário",
      email: session.user.email,
      cellphone: formatPhone(finalCellphone),
      taxId: formatCpf(finalTaxId),
    }

    const createCustomerRes = await fetch(`${ABACATEPAY_API_URL}/v1/customer/create`, {
      method: "POST",
      headers: apiHeaders,
      body: JSON.stringify(customerPayload),
    })

    const customerData = await createCustomerRes.json()
    if (!createCustomerRes.ok || customerData.error || !customerData.data?.id) {
      console.error("AbacatePay customer error:", customerData)
      return NextResponse.json(
        { error: customerData.error ?? "Erro ao cadastrar dados para pagamento" },
        { status: 500 }
      )
    }

    const customerId = customerData.data.id
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"

    const billingPayload = {
      frequency: "ONE_TIME",
      methods: ["PIX", "CARD"],
      products: [
        {
          externalId: `download-${generationId}`,
          name: "Download sem marca d'água",
          description: "Baixar imagem gerada sem marca d'água",
          quantity: 1,
          price: 100,
        },
      ],
      returnUrl: `${baseUrl}/`,
      completionUrl: `${baseUrl}/payment/success?generationId=${encodeURIComponent(generationId)}`,
      customerId,
      metadata: {
        userEmail: session.user.email,
        generationId,
      },
    }

    const response = await fetch(`${ABACATEPAY_API_URL}/v1/billing/create`, {
      method: "POST",
      headers: apiHeaders,
      body: JSON.stringify(billingPayload),
    })

    const data = await response.json()

    if (!response.ok || data.error) {
      console.error("AbacatePay billing error:", data)
      return NextResponse.json(
        { error: data.error || "Erro ao criar cobrança" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      url: data.data.url,
      billingId: data.data.id,
    })
  } catch (err) {
    console.error("CREATE BILLING ERROR:", err)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
