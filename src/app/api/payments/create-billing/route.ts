import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

const ABACATEPAY_API_URL = "https://api.abacatepay.com"

export interface CreditPackage {
  id: string
  name: string
  credits: number
  price: number // in cents
  description: string
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: "credits-5",
    name: "5 Créditos",
    credits: 5,
    price: 990,
    description: "Pacote básico — 5 gerações de imagem",
  },
  {
    id: "credits-15",
    name: "15 Créditos",
    credits: 15,
    price: 2490,
    description: "Pacote intermediário — 15 gerações de imagem",
  },
  {
    id: "credits-30",
    name: "30 Créditos",
    credits: 30,
    price: 3990,
    description: "Pacote premium — 30 gerações de imagem",
  },
]

export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const body = await req.json()
    const { packageId, taxId, cellphone, returnTo } = body

    const safeReturnTo =
      typeof returnTo === "string" &&
      returnTo.length <= 512 &&
      returnTo.startsWith("/") &&
      !returnTo.startsWith("//") &&
      !returnTo.includes("//")
        ? returnTo
        : null

    const pkg = CREDIT_PACKAGES.find((p) => p.id === packageId)
    if (!pkg) {
      return NextResponse.json({ error: "Pacote inválido" }, { status: 400 })
    }

    if (!taxId || typeof taxId !== "string" || !cellphone || typeof cellphone !== "string") {
      return NextResponse.json(
        { error: "CPF e telefone são obrigatórios para o pagamento" },
        { status: 400 }
      )
    }

    const formatCpf = (raw: string) => {
      const digits = raw.replace(/\D/g, "").slice(0, 11)
      if (digits.length !== 11) return raw
      return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
    }

    const formatPhone = (raw: string) => {
      const digits = raw.replace(/\D/g, "")
      if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
      if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
      return raw
    }

    const apiHeaders = {
      accept: "application/json",
      authorization: `Bearer ${process.env.ABACATEPAY_API_KEY}`,
      "content-type": "application/json",
    }

    const customerPayload = {
      name: session.user.name ?? "Usuário",
      email: session.user.email,
      cellphone: formatPhone(cellphone),
      taxId: formatCpf(taxId),
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
          externalId: pkg.id,
          name: pkg.name,
          description: pkg.description,
          quantity: 1,
          price: pkg.price,
        },
      ],
      returnUrl: `${baseUrl}${safeReturnTo ?? "/"}`,
      completionUrl: `${baseUrl}/payment/success?package=${pkg.id}${safeReturnTo ? "&returnTo=" + encodeURIComponent(safeReturnTo) : ""}`,
      customerId,
      metadata: {
        userEmail: session.user.email,
        packageId: pkg.id,
        credits: pkg.credits,
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
