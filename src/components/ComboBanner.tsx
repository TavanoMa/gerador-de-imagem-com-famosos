"use client"

import Link from "next/link"
import { useState, useCallback } from "react"
import { getFamous, displayImageIndex } from "@/src/data/politics"

interface Props {
  comboSlug: string
  locale?: "pt" | "en"
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL

function MemberAvatar({ slug }: { slug: string }) {
  const base = `${SUPABASE_URL}/storage/v1/object/public/famous_image/${slug}/${displayImageIndex(slug)}`
  const candidates = [
    `${base}.jpg?v4`,
    `${base}.png?v4`,
    `https://ui-avatars.com/api/?name=${encodeURIComponent(slug)}&size=128`,
  ]
  const lastStage = candidates.length - 1
  const [stage, setStage] = useState(0)
  const advance = () => setStage((s) => Math.min(s + 1, lastStage))

  const measureRef = useCallback((el: HTMLImageElement | null) => {
    if (el && el.complete && el.naturalWidth === 0) {
      setStage((s) => (s < lastStage ? s + 1 : s))
    }
  }, [lastStage])

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={measureRef}
      src={candidates[stage]}
      alt={slug}
      onError={advance}
      className="h-12 w-12 rounded-full border-2 border-white object-cover shadow"
    />
  )
}

function shortName(slug: string, fallback: string) {
  const map: Record<string, string> = {
    lula: "Lula",
    "jair-bolsonaro": "Jair Bolsonaro",
    "flavio-bolsonaro": "Flávio Bolsonaro",
  }
  return map[slug] ?? fallback
}

export default function ComboBanner({ comboSlug, locale = "pt" }: Props) {
  const combo = getFamous(comboSlug)
  if (!combo?.members || combo.members.length < 2) return null

  const basePath = locale === "en" ? "/en/image" : "/image"
  const members = combo.members.slice(0, 2)
  const names = members.map((m) => shortName(m, getFamous(m)?.name ?? m))
  const pair = names.join(locale === "en" ? " and " : " e ")

  const t =
    locale === "en"
      ? {
          title: "Want both in the same photo?",
          desc: `Create a photo with ${pair} together.`,
          cta: "Photo with both →",
        }
      : {
          title: "Quer os dois na mesma foto?",
          desc: `Crie uma foto com ${pair} juntos.`,
          cta: "Foto com os dois →",
        }

  return (
    <div className="mx-auto w-full max-w-[600px] px-4 sm:px-6">
      <Link
        href={`${basePath}/${combo.slug}`}
        className="group flex flex-col gap-3 rounded-2xl border-2 border-purple-200 bg-purple-50 p-4 transition-all hover:border-purple-400 hover:bg-purple-100 sm:flex-row sm:items-center sm:gap-4"
      >
        <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
          <div className="flex -space-x-3 shrink-0">
            {members.map((m) => (
              <MemberAvatar key={m} slug={m} />
            ))}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-gray-900">{t.title}</p>
            <p className="text-sm text-gray-600">{t.desc}</p>
          </div>
        </div>
        <span className="w-full shrink-0 whitespace-nowrap rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2.5 text-center text-sm font-semibold text-white sm:w-auto">
          {t.cta}
        </span>
      </Link>
    </div>
  )
}
