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

function extFromType(type: string): string {
  if (type.includes("jpeg") || type.includes("jpg")) return "jpg"
  if (type.includes("webp")) return "webp"
  return "png"
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const formData = await req.formData()
    const userPrompt = formData.get("prompt") as string | null
    const famousSlug = formData.get("famousSlug") as string | null
    const taxId = formData.get("taxId") as string | null
    const cellphone = formData.get("cellphone") as string | null
    const userImages = formData.getAll("images") as File[]

    if (!famousSlug) {
      return NextResponse.json({ error: "Famoso não informado" }, { status: 400 })
    }

    const validImages = userImages.filter((f) => f && f.size > 0)
    if (validImages.length === 0) {
      return NextResponse.json({ error: "Nenhuma imagem válida" }, { status: 400 })
    }

    const { data: profile } = await supabaseServer
      .from("profiles")
      .select("id, tax_id, cellphone")
      .eq("email", session.user.email)
      .single()

    if (!profile) {
      return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 })
    }

    const finalTaxId = taxId || profile.tax_id
    const finalCellphone = cellphone || profile.cellphone
    if (!finalTaxId || !finalCellphone) {
      return NextResponse.json({ error: "CPF e telefone são obrigatórios" }, { status: 400 })
    }
    if (taxId && cellphone) {
      await supabaseServer
        .from("profiles")
        .update({ tax_id: taxId, cellphone })
        .eq("id", profile.id)
    }

    // Cria a geração PENDENTE (sem storage_path = ainda não gerada).
    const { data: generation, error: genError } = await supabaseServer
      .from("generations")
      .insert({
        profile_id: profile.id,
        famous_slug: famousSlug,
        prompt: userPrompt?.trim() || null,
        paid: false,
      })
      .select("id")
      .single()

    if (genError || !generation) {
      console.error("Prepaid generation insert error:", genError)
      return NextResponse.json({ error: "Erro ao iniciar geração" }, { status: 500 })
    }

    // Sobe as imagens do usuário para gerar DEPOIS do pagamento.
    for (let i = 0; i < validImages.length; i++) {
      const img = validImages[i]
      const buffer = Buffer.from(await img.arrayBuffer())
      const inputPath = `inputs/${generation.id}/user-${i}.${extFromType(img.type)}`
      const { error: upErr } = await supabaseServer.storage
        .from("generated_images")
        .upload(inputPath, buffer, {
          contentType: img.type || "image/png",
          upsert: true,
        })
      if (upErr) {
        console.error("Input upload error:", upErr)
        await supabaseServer.from("generations").delete().eq("id", generation.id)
        return NextResponse.json({ error: "Erro ao enviar imagens" }, { status: 500 })
      }
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
      await supabaseServer.from("generations").delete().eq("id", generation.id)
      return NextResponse.json(
        { error: customerData.error ?? "Erro ao cadastrar dados para pagamento" },
        { status: 500 }
      )
    }

    const customerId = customerData.data.id
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"

    const billingPayload = {
      frequency: "ONE_TIME",
      methods: ["PIX"],
      products: [
        {
          externalId: `download-${generation.id}`,
          name: "Foto com famoso",
          description: "Gerar foto sem marca d'água",
          quantity: 1,
          price: 100,
        },
      ],
      returnUrl: `${baseUrl}/`,
      completionUrl: `${baseUrl}/payment/success?generationId=${encodeURIComponent(generation.id)}`,
      customerId,
      metadata: {
        userEmail: session.user.email,
        generationId: generation.id,
      },
    }

    const response = await fetch(`${ABACATEPAY_API_URL}/v1/billing/create`, {
      method: "POST",
      headers: apiHeaders,
      body: JSON.stringify(billingPayload),
    })
    const data = await response.json()

    if (!response.ok || data.error || !data.data?.url) {
      console.error("AbacatePay billing error:", data)
      await supabaseServer.from("generations").delete().eq("id", generation.id)
      return NextResponse.json({ error: data.error || "Erro ao criar cobrança" }, { status: 500 })
    }

    return NextResponse.json({ url: data.data.url, generationId: generation.id })
  } catch (err) {
    console.error("CREATE PREPAID BILLING ERROR:", err)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
