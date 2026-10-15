"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"

type Item = { id: string; paid: boolean; famousName: string; createdAt: string }
type Pix = { generationId: string; paymentId: string; qrCodeBase64: string; copiaECola: string }

export default function MyPhotosClient({
  items,
  locale,
}: {
  items: Item[]
  locale: "pt" | "en"
}) {
  const [list, setList] = useState<Item[]>(items)
  const [pix, setPix] = useState<Pix | null>(null)
  const [copied, setCopied] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [bust, setBust] = useState<Record<string, number>>({})

  const t = {
    pt: {
      title: "Minhas fotos",
      paidSection: "Sem marca d'água (pagas)",
      unpaidSection: "Com marca d'água",
      download: "Baixar",
      pay: "Pagar R$1 e baixar sem marca",
      generating: "Gerando PIX...",
      empty: "Você ainda não gerou nenhuma foto.",
      emptyCta: "Criar minha primeira foto",
      createdOn: "Criada em",
      pixTitle: "Pague R$1,00 no PIX",
      pixScan: "Escaneie o QR Code no app do seu banco",
      pixOr: "ou copie o código",
      pixCopy: "Copiar código PIX",
      pixCopied: "Copiado!",
      pixWaiting: "Aguardando pagamento...",
      pixNotice: "Assim que o pagamento cair, sua foto sem marca libera aqui automaticamente.",
      cancel: "Cancelar",
      paidBadge: "Sem marca ✓",
    },
    en: {
      title: "My photos",
      paidSection: "Without watermark (paid)",
      unpaidSection: "With watermark",
      download: "Download",
      pay: "Pay R$1 & download without watermark",
      generating: "Generating PIX...",
      empty: "You haven't generated any photos yet.",
      emptyCta: "Create my first photo",
      createdOn: "Created on",
      pixTitle: "Pay R$1.00 with PIX",
      pixScan: "Scan the QR Code in your bank app",
      pixOr: "or copy the code",
      pixCopy: "Copy PIX code",
      pixCopied: "Copied!",
      pixWaiting: "Waiting for payment...",
      pixNotice: "As soon as the payment lands, your watermark-free photo unlocks here.",
      cancel: "Cancel",
      paidBadge: "No watermark ✓",
    },
  }[locale]

  const homeHref = locale === "en" ? "/en" : "/"
  const dateFmt = (iso: string) =>
    new Date(iso).toLocaleDateString(locale === "en" ? "en-US" : "pt-BR")

  const paid = list.filter((i) => i.paid)
  const unpaid = list.filter((i) => !i.paid)

  const imgSrc = (id: string) =>
    `/api/my-image?id=${encodeURIComponent(id)}${bust[id] ? `&v=${bust[id]}` : ""}`

  const startPay = async (id: string) => {
    if (busyId) return
    setBusyId(id)
    setCopied(false)
    try {
      const fd = new FormData()
      fd.append("generationId", id)
      const res = await fetch("/api/payments/create-pix", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok || !data.qrCodeBase64) {
        alert(data.error || (locale === "en" ? "Error creating PIX" : "Erro ao gerar PIX"))
        return
      }
      setPix({
        generationId: data.generationId,
        paymentId: data.paymentId,
        qrCodeBase64: data.qrCodeBase64,
        copiaECola: data.copiaECola,
      })
    } catch {
      alert(locale === "en" ? "Network error. Try again." : "Erro de rede. Tente novamente.")
    } finally {
      setBusyId(null)
    }
  }

  const onApproved = useCallback((genId: string) => {
    setList((prev) => prev.map((i) => (i.id === genId ? { ...i, paid: true } : i)))
    setBust((prev) => ({ ...prev, [genId]: Date.now() }))
    setPix(null)
  }, [])

  useEffect(() => {
    if (!pix) return
    let active = true
    const check = async () => {
      try {
        const res = await fetch(`/api/payments/check-pix?paymentId=${encodeURIComponent(pix.paymentId)}`)
        const data = await res.json()
        if (active && data.approved) onApproved(pix.generationId)
      } catch {
        /* tenta no próximo tick */
      }
    }
    const timer = setInterval(check, 3500)
    check()
    return () => {
      active = false
      clearInterval(timer)
    }
  }, [pix, onApproved])

  const copyCode = async () => {
    if (!pix) return
    try {
      await navigator.clipboard.writeText(pix.copiaECola)
    } catch {
      const ta = document.createElement("textarea")
      ta.value = pix.copiaECola
      document.body.appendChild(ta)
      ta.select()
      try { document.execCommand("copy") } catch {}
      ta.remove()
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const download = async (id: string) => {
    try {
      const res = await fetch(imgSrc(id))
      if (!res.ok) {
        alert(locale === "en" ? "Could not download." : "Não foi possível baixar.")
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `fotocomfamosos-${id}.png`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {
      alert(locale === "en" ? "Network error." : "Erro de rede.")
    }
  }

  const Card = ({ item }: { item: Item }) => (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="relative aspect-square bg-gray-50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imgSrc(item.id)} alt={item.famousName} className="h-full w-full object-cover" />
        {item.paid && (
          <span className="absolute left-2 top-2 rounded-full bg-green-600 px-2 py-1 text-[11px] font-semibold text-white">
            {t.paidBadge}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div>
          <p className="truncate text-sm font-semibold text-gray-900">{item.famousName}</p>
          <p className="text-xs text-gray-400">{t.createdOn} {dateFmt(item.createdAt)}</p>
        </div>
        {item.paid ? (
          <button
            onClick={() => download(item.id)}
            className="mt-auto w-full rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 px-3 py-2.5 text-sm font-semibold text-white hover:from-green-600 hover:to-emerald-700"
          >
            {t.download}
          </button>
        ) : (
          <button
            onClick={() => startPay(item.id)}
            disabled={!!busyId}
            className="mt-auto w-full rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-3 py-2.5 text-sm font-semibold text-white hover:from-purple-700 hover:to-pink-700 disabled:opacity-60"
          >
            {busyId === item.id ? t.generating : t.pay}
          </button>
        )}
      </div>
    </div>
  )

  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 py-8 sm:px-6">
      {list.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <p className="text-gray-500">{t.empty}</p>
          <Link
            href={homeHref}
            className="rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 font-semibold text-white"
          >
            {t.emptyCta}
          </Link>
        </div>
      ) : (
        <>
          {unpaid.length > 0 && (
            <section className="mb-10">
              <h2 className="mb-4 text-lg font-bold text-gray-900">
                {t.unpaidSection} <span className="text-gray-400">({unpaid.length})</span>
              </h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {unpaid.map((item) => <Card key={item.id} item={item} />)}
              </div>
            </section>
          )}

          {paid.length > 0 && (
            <section>
              <h2 className="mb-4 text-lg font-bold text-gray-900">
                {t.paidSection} <span className="text-gray-400">({paid.length})</span>
              </h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {paid.map((item) => <Card key={item.id} item={item} />)}
              </div>
            </section>
          )}
        </>
      )}

      {pix && (
        <>
          <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setPix(null)} />
          <div className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-center text-lg font-semibold text-gray-900">{t.pixTitle}</h3>
            <p className="mt-1 text-center text-sm text-gray-500">{t.pixScan}</p>
            <div className="mt-4 flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`data:image/png;base64,${pix.qrCodeBase64}`}
                alt="QR Code PIX"
                className="h-52 w-52 rounded-lg border border-gray-200"
              />
            </div>
            <p className="mt-4 text-center text-xs font-medium uppercase tracking-wide text-gray-400">
              {t.pixOr}
            </p>
            <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
              <p className="break-all text-[11px] leading-snug text-gray-600">{pix.copiaECola}</p>
            </div>
            <button
              onClick={copyCode}
              className="mt-2 w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
            >
              {copied ? t.pixCopied : t.pixCopy}
            </button>
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-green-600" />
              <span>{t.pixWaiting}</span>
            </div>
            <p className="mt-2 text-center text-xs text-gray-400">{t.pixNotice}</p>
            <button
              onClick={() => setPix(null)}
              className="mt-3 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              {t.cancel}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
