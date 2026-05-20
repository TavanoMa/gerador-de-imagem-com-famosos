"use client"
 
import { useState } from "react"
 
type Props = {
  referralCreditsEarned: number // 0–3, quantos créditos de indicação já ganhou
  locale?: "pt" | "en"
  onShare?: () => Promise<{ success: boolean; credits: number }>
  onCreditsUpdate?: (credits: number) => void
}
 
const MAX_REFERRAL_CREDITS = 3
 
const ReferralCredits = ({
  referralCreditsEarned,
  locale = "pt",
  onShare,
  onCreditsUpdate,
}: Props) => {
  const [copied, setCopied] = useState(false)
  const [whatsappSent, setWhatsappSent] = useState(false)
  const [earned, setEarned] = useState(referralCreditsEarned)
  const [loading, setLoading] = useState(false)
 
  const t = {
    pt: {
      title: "Indique um amigo",
      subtitle: "Ganhe créditos compartilhando o link",
      maxReached: "Você já ganhou o máximo de créditos por indicação!",
      earned: "créditos ganhos",
      whatsapp: "Compartilhar no WhatsApp",
      copy: "Copiar link",
      copied: "Link copiado!",
      sent: "Enviado!",
      creditEarned: "+1 crédito adicionado!",
    },
    en: {
      title: "Refer a friend",
      subtitle: "Earn credits by sharing the link",
      maxReached: "You've already earned the maximum referral credits!",
      earned: "credits earned",
      whatsapp: "Share on WhatsApp",
      copy: "Copy link",
      copied: "Copied!",
      sent: "Sent!",
      creditEarned: "+1 credit added!",
    },
  }[locale]
 
  const [justEarned, setJustEarned] = useState(false)
  const maxReached = earned >= MAX_REFERRAL_CREDITS
 
  const handleShare = async () => {
    if (loading || maxReached) return
 
    setLoading(true)
 
    try {
      if (onShare) {
        const result = await onShare()
        if (result.success) {
          const newEarned = Math.min(earned + 1, MAX_REFERRAL_CREDITS)
          setEarned(newEarned)
          onCreditsUpdate?.(result.credits)
          setJustEarned(true)
          setTimeout(() => setJustEarned(false), 2000)
        }
      } else {
        // fallback sem backend (dev/preview)
        const newEarned = Math.min(earned + 1, MAX_REFERRAL_CREDITS)
        setEarned(newEarned)
        setJustEarned(true)
        setTimeout(() => setJustEarned(false), 2000)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }
 
  const handleWhatsApp = async () => {
    const url = window.location.href
    const message =
      locale === "pt"
        ? `Olha esse site incrível! ${url}`
        : `Check out this amazing site! ${url}`
 
    window.open(
      `https://wa.me/?text=${encodeURIComponent(message)}`,
      "_blank"
    )
 
    setWhatsappSent(true)
    setTimeout(() => setWhatsappSent(false), 2500)
 
    await handleShare()
  }
 
  const handleCopy = async () => {
    const url = window.location.href
 
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      // fallback para mobile antigo
      const el = document.createElement("textarea")
      el.value = url
      document.body.appendChild(el)
      el.select()
      document.execCommand("copy")
      document.body.removeChild(el)
    }
 
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
 
    await handleShare()
  }
 
  return (
    <div className="w-full max-w-[600px] mx-auto rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50 to-pink-50 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">{t.title}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{t.subtitle}</p>
        </div>
 
        {/* Progress dots */}
        <div className="flex items-center gap-1.5">
          {Array.from({ length: MAX_REFERRAL_CREDITS }).map((_, i) => (
            <div
              key={i}
              className={`
                w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                transition-all duration-300
                ${
                  i < earned
                    ? "bg-gradient-to-br from-purple-500 to-pink-500 text-white scale-110"
                    : "bg-white border-2 border-purple-200 text-purple-200"
                }
              `}
            >
              {i < earned ? "💵" : ""}
            </div>
          ))}
          <span className="text-xs text-gray-400 ml-1">
            {earned}/{MAX_REFERRAL_CREDITS} {t.earned}
          </span>
        </div>
      </div>
 
      {/* Max reached */}
      {maxReached ? (
        <div className="flex items-center gap-2 justify-center py-3 rounded-xl bg-green-50 border border-green-100 text-green-600 text-sm font-medium">
          <span>🎉</span>
          <span>{t.maxReached}</span>
        </div>
      ) : (
        <div className="flex gap-2">
          {/* WhatsApp */}
          <button
            onClick={handleWhatsApp}
            disabled={loading}
            className="
              flex-1 flex items-center justify-center gap-2
              py-3 rounded-xl
              bg-[#25D366] hover:bg-[#20bb5a] active:scale-95
              text-white text-sm font-semibold
              transition-all duration-150
              disabled:opacity-60 disabled:cursor-not-allowed
            "
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white shrink-0">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.555 4.116 1.527 5.845L.057 23.52a.5.5 0 0 0 .612.612l5.675-1.47A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.006-1.374l-.36-.214-3.706.96.98-3.59-.234-.369A9.818 9.818 0 1 1 12 21.818z" />
            </svg>
            <span>{whatsappSent ? t.sent : t.whatsapp}</span>
          </button>
 
          {/* Copy */}
          <button
            onClick={handleCopy}
            disabled={loading}
            className="
              flex items-center justify-center gap-2
              px-4 py-3 rounded-xl
              bg-white border-2 border-purple-200
              hover:border-purple-400 hover:bg-purple-50 active:scale-95
              text-purple-700 text-sm font-semibold
              transition-all duration-150
              disabled:opacity-60 disabled:cursor-not-allowed
              shrink-0
            "
          >
            {copied ? (
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
            <span>{copied ? t.copied : t.copy}</span>
          </button>
        </div>
      )}
 
      {/* Credit earned flash */}
      {justEarned && (
        <p className="text-center text-xs text-purple-600 font-semibold mt-3 animate-pulse">
          {t.creditEarned}
        </p>
      )}
    </div>
  )
}
 
export default ReferralCredits