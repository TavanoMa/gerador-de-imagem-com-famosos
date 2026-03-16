"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"

function formatCpfInput(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

function formatPhoneInput(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 11)
  if (d.length <= 2) return d.length ? `(${d}` : d
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

interface CreditPackage {
  id: string
  name: string
  credits: number
  price: number
  description: string
}

const PACKAGES: CreditPackage[] = [
  {
    id: "credits-5",
    name: "5 Créditos",
    credits: 5,
    price: 990,
    description: "5 gerações de imagem",
  },
  {
    id: "credits-15",
    name: "15 Créditos",
    credits: 15,
    price: 2490,
    description: "15 gerações de imagem",
  },
  {
    id: "credits-30",
    name: "30 Créditos",
    credits: 30,
    price: 3990,
    description: "30 gerações de imagem",
  },
]

const EN_PACKAGES: CreditPackage[] = [
  {
    id: "credits-5",
    name: "5 Credits",
    credits: 5,
    price: 990,
    description: "5 image generations",
  },
  {
    id: "credits-15",
    name: "15 Credits",
    credits: 15,
    price: 2490,
    description: "15 image generations",
  },
  {
    id: "credits-30",
    name: "30 Credits",
    credits: 30,
    price: 3990,
    description: "30 image generations",
  },
]

type Props = {
  isLogged: boolean
  locale?: "pt" | "en"
  returnTo?: string
}

const formatPrice = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

export default function BuyCredits({ isLogged, locale = "pt", returnTo }: Props) {
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [selectedPkg, setSelectedPkg] = useState<CreditPackage | null>(null)
  const [taxId, setTaxId] = useState("")
  const [cellphone, setCellphone] = useState("")

  const packages = locale === "en" ? EN_PACKAGES : PACKAGES

  const t = {
    title: locale === "en" ? "Buy more credits" : "Comprar mais créditos",
    subtitle:
      locale === "en"
        ? "Each credit = 1 image generation with your favourite celebrity"
        : "Cada crédito = 1 geração de imagem com seu famoso favorito",
    loginCta:
      locale === "en"
        ? "Log in to buy credits"
        : "Faça login para comprar créditos",
    buyBtn: locale === "en" ? "Buy" : "Comprar",
    loading: locale === "en" ? "Redirecting..." : "Redirecionando...",
    pixCard: locale === "en" ? "PIX or Card" : "PIX ou Cartão",
    best: locale === "en" ? "Best value" : "Melhor custo-benefício",
    formTitle: locale === "en" ? "Payment details" : "Dados para pagamento",
    formCpf: locale === "en" ? "CPF (Brazilian tax ID)" : "CPF",
    formPhone: locale === "en" ? "Phone (with area code)" : "Telefone (com DDD)",
    formContinue: locale === "en" ? "Continue to payment" : "Ir para pagamento",
    formRequired: locale === "en" ? "CPF and phone are required" : "CPF e telefone são obrigatórios",
  }

  const openForm = (pkg: CreditPackage) => {
    setSelectedPkg(pkg)
    setTaxId("")
    setCellphone("")
    setFormOpen(true)
  }

  const handleBuyClick = (pkg: CreditPackage) => {
    if (!isLogged) {
      signIn("google")
      return
    }
    openForm(pkg)
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPkg) return
    const rawCpf = taxId.replace(/\D/g, "")
    const rawPhone = cellphone.replace(/\D/g, "")
    if (rawCpf.length !== 11 || rawPhone.length < 10) {
      alert(t.formRequired)
      return
    }
    setLoadingId(selectedPkg.id)
    try {
      const res = await fetch("/api/payments/create-billing", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          packageId: selectedPkg.id,
          taxId: rawCpf,
          cellphone: rawPhone,
          returnTo: returnTo ?? undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.url) {
        alert(data.error || (locale === "en" ? "Failed to create payment" : "Erro ao criar pagamento"))
        return
      }

      window.location.href = data.url
    } catch {
      alert(locale === "en" ? "Network error. Try again." : "Erro de rede. Tente novamente.")
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <section className="w-full max-w-2xl mx-auto px-4 py-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{t.title}</h2>
        <p className="text-gray-500 mt-1 text-sm">{t.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {packages.map((pkg, index) => {
          const isBest = index === 1
          const isLoading = loadingId === pkg.id

          return (
            <div
              key={pkg.id}
              className={`
                relative flex flex-col items-center gap-3 rounded-2xl border p-5 transition-all
                ${isBest
                  ? "border-purple-500 bg-purple-50 shadow-lg scale-[1.02]"
                  : "border-gray-200 bg-white hover:border-purple-300 hover:shadow"
                }
              `}
            >
              {isBest && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  {t.best}
                </span>
              )}

              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">{pkg.credits}</p>
                <p className="text-sm text-gray-500">
                  {locale === "en" ? "credits" : "créditos"}
                </p>
              </div>

              <p className="text-xs text-gray-400 text-center">{pkg.description}</p>

              <div className="text-center">
                <p className="text-xl font-bold text-purple-700">{formatPrice(pkg.price)}</p>
                <p className="text-[11px] text-gray-400">{t.pixCard}</p>
              </div>

              <button
                onClick={() => handleBuyClick(pkg)}
                disabled={isLoading}
                className={`
                  w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition-all
                  ${isBest
                    ? "bg-linear-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow"
                    : "bg-gray-900 text-white hover:bg-gray-700"
                  }
                  disabled:opacity-60 disabled:cursor-not-allowed
                `}
              >
                {isLoading ? t.loading : t.buyBtn}
              </button>
            </div>
          )
        })}
      </div>

      {/* Form modal: CPF + Phone */}
      {formOpen && selectedPkg && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50"
            onClick={() => setFormOpen(false)}
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.formTitle}</h3>
            <p className="text-sm text-gray-500 mb-4">
              {selectedPkg.name} — {formatPrice(selectedPkg.price)}
            </p>
            <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.formCpf}</label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="000.000.000-00"
                  value={taxId}
                  onChange={(e) => setTaxId(formatCpfInput(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.formPhone}</label>
                <input
                  type="text"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="(11) 99999-9999"
                  value={cellphone}
                  onChange={(e) => setCellphone(formatPhoneInput(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  {locale === "en" ? "Cancel" : "Cancelar"}
                </button>
                <button
                  type="submit"
                  disabled={loadingId === selectedPkg.id}
                  className="flex-1 rounded-lg bg-linear-to-r from-purple-600 to-pink-600 px-4 py-2 text-sm font-semibold text-white hover:from-purple-700 hover:to-pink-700 disabled:opacity-60"
                >
                  {loadingId === selectedPkg.id ? t.loading : t.formContinue}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </section>
  )
}
