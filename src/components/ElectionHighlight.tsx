"use client"

import Link from "next/link"
import { useState, useCallback } from "react"
import {
  getFeaturedPoliticians,
  getFeaturedCombo,
  getSecondaryPolitician,
  getSecondaryCombo,
  getOtherPoliticians,
  displayImageIndex,
  type FamousEntry,
} from "@/src/data/politics"

interface Props {
  locale?: "pt" | "en"
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL

function imgCandidates(slug: string, name: string) {
  const base = `${SUPABASE_URL}/storage/v1/object/public/famous_image/${slug}/${displayImageIndex(slug)}`
  return [
    `${base}.jpg?v4`,
    `${base}.png?v4`,
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=512`,
  ]
}

// Fallback jpg -> png -> avatar. Precisa de dois gatilhos: o onError (erros após
// a hidratação) e uma checagem no mount, porque a imagem é renderizada no SSR e
// o erro de carregamento pode disparar ANTES do React hidratar (onError perdido).
function PoliticianImg({
  slug,
  name,
  className,
  loading,
}: {
  slug: string
  name: string
  className: string
  loading?: "lazy" | "eager"
}) {
  const candidates = imgCandidates(slug, name)
  const lastStage = candidates.length - 1
  const [stage, setStage] = useState(0)

  const advance = () => setStage((s) => Math.min(s + 1, lastStage))

  // Callback ref: no mount, detecta imagem que já falhou no SSR (erro perdido
  // antes da hidratação, quando o onError não chega a rodar).
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
      alt={name}
      onError={advance}
      loading={loading}
      className={className}
    />
  )
}

function ComboFaces({ members, className }: { members: string[]; className: string }) {
  return (
    <div className={`relative flex ${className}`}>
      {members.map((m, i) => (
        <div key={m} className="relative h-full w-1/2 overflow-hidden">
          <PoliticianImg
            slug={m}
            name={m}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {i === 0 && (
            <span className="absolute right-0 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full bg-white text-sm font-black text-purple-600 shadow-lg ring-2 ring-purple-200">
              +
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

export default function ElectionHighlight({ locale = "pt" }: Props) {
  const basePath = locale === "en" ? "/en/image" : "/image"

  const t =
    locale === "en"
      ? {
          badge: "Election Special",
          title: "Take a photo with the candidates",
          subtitle:
            "The most talked-about names of the election — create your realistic photo with AI.",
          featuredCta: "Create my photo",
          comboBadge: "The two together",
          comboDesc: "Put yourself in the same photo as both at once.",
          comboCta: "Photo with both",
          secondaryTitle: "Also featured",
          othersTitle: "Other politicians",
        }
      : {
          badge: "Especial Eleições",
          title: "Tire sua foto com os candidatos à presidência",
          subtitle:
            "Os nomes mais comentados da eleição — crie sua foto realista com IA.",
          featuredCta: "Criar minha foto",
          comboBadge: "Os dois juntos",
          comboDesc: "Apareça na mesma foto com os dois ao mesmo tempo.",
          comboCta: "Foto com os dois",
          secondaryTitle: "Também em destaque",
          othersTitle: "Outros políticos",
        }

  const featured = getFeaturedPoliticians()
  const mainCombo = getFeaturedCombo()
  const secondaryPol = getSecondaryPolitician()
  const secondaryCombo = getSecondaryCombo()
  const others = getOtherPoliticians()

  const comboLabels = {
    badge: t.comboBadge,
    desc: t.comboDesc,
    cta: t.comboCta,
  }

  return (
    <section className="bg-gradient-to-b from-gray-50 to-white py-14 sm:py-20" id="eleicoes">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-yellow-100 px-4 py-1.5 text-sm font-semibold text-yellow-800 ring-1 ring-yellow-300">
            🗳️ {t.badge}
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            {t.title}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-gray-600">{t.subtitle}</p>
        </div>

        {/* Destaque principal: Lula + Flávio */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {featured.map((p) => (
            <FeaturedCard
              key={p.slug}
              famoso={p}
              href={`${basePath}/${p.slug}`}
              cta={t.featuredCta}
              heightClass="h-80 sm:h-96"
            />
          ))}
        </div>

        {/* Combo principal: Lula + Flávio */}
        {mainCombo && (
          <ComboCard
            combo={mainCombo}
            href={`${basePath}/${mainCombo.slug}`}
            labels={comboLabels}
            variant="wide"
            highlight
          />
        )}

        {/* Destaque secundário: Jair + combo Lula+Jair */}
        {(secondaryPol || secondaryCombo) && (
          <div className="mt-14">
            <h3 className="mb-5 text-lg font-semibold text-gray-900">
              {t.secondaryTitle}
            </h3>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {secondaryPol && (
                <FeaturedCard
                  famoso={secondaryPol}
                  href={`${basePath}/${secondaryPol.slug}`}
                  cta={t.featuredCta}
                  heightClass="h-72 sm:h-80"
                />
              )}
              {secondaryCombo && (
                <ComboCard
                  combo={secondaryCombo}
                  href={`${basePath}/${secondaryCombo.slug}`}
                  labels={comboLabels}
                  variant="stacked"
                />
              )}
            </div>
          </div>
        )}

        {/* Outros políticos */}
        {others.length > 0 && (
          <div className="mt-14">
            <h3 className="mb-5 text-lg font-semibold text-gray-900">
              {t.othersTitle}
            </h3>
            <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
              {others.map((p) => (
                <li key={p.slug}>
                  <Link
                    href={`${basePath}/${p.slug}`}
                    className="group block overflow-hidden rounded-xl border border-gray-200 bg-white transition-all hover:border-purple-300 hover:shadow-md"
                  >
                    <div className="relative aspect-square bg-gray-100">
                      <PoliticianImg
                        slug={p.slug}
                        name={p.name}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <p className="truncate px-2 py-2 text-center text-xs font-medium text-gray-800 group-hover:text-purple-600">
                      {p.name}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  )
}

function FeaturedCard({
  famoso,
  href,
  cta,
  heightClass,
}: {
  famoso: FamousEntry
  href: string
  cta: string
  heightClass: string
}) {
  return (
    <Link
      href={href}
      className="group relative block overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition-all hover:border-purple-300 hover:shadow-xl"
    >
      <div className={`relative w-full overflow-hidden ${heightClass}`}>
        <PoliticianImg
          slug={famoso.slug}
          name={famoso.name}
          loading="eager"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h3 className="text-2xl font-bold text-white drop-shadow sm:text-3xl">
            {famoso.name}
          </h3>
          <p className="mt-1 line-clamp-1 text-sm text-gray-200">
            {famoso.description}
          </p>
          <span className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white/95 px-5 py-2.5 text-sm font-semibold text-gray-900 shadow transition-all group-hover:bg-white">
            {cta} →
          </span>
        </div>
      </div>
    </Link>
  )
}

function ComboCard({
  combo,
  href,
  labels,
  variant,
  highlight = false,
}: {
  combo: FamousEntry
  href: string
  labels: { badge: string; desc: string; cta: string }
  variant: "wide" | "stacked"
  highlight?: boolean
}) {
  const members = (combo.members ?? []).slice(0, 2)
  const border = highlight ? "border-2 border-purple-200 hover:border-purple-400" : "border border-gray-200 hover:border-purple-300"

  if (variant === "stacked") {
    return (
      <Link
        href={href}
        className={`group flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-sm transition-all hover:shadow-xl ${border}`}
      >
        <ComboFaces members={members} className="h-48 w-full sm:h-56" />
        <div className="flex flex-1 flex-col justify-center gap-3 p-6">
          <span className="w-fit rounded-full bg-purple-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-purple-700">
            {labels.badge}
          </span>
          <h3 className="text-xl font-bold text-gray-900 sm:text-2xl">
            {combo.name}
          </h3>
          <p className="text-gray-600">{labels.desc}</p>
          <span className="mt-1 inline-flex w-fit items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-2.5 font-semibold text-white transition-all group-hover:from-purple-700 group-hover:to-pink-700">
            {labels.cta} →
          </span>
        </div>
      </Link>
    )
  }

  return (
    <Link
      href={href}
      className={`group mt-6 block overflow-hidden rounded-3xl bg-white shadow-sm transition-all hover:shadow-xl ${border}`}
    >
      <div className="flex flex-col items-stretch sm:flex-row">
        <ComboFaces members={members} className="h-56 w-full sm:h-64 sm:w-2/5" />
        <div className="flex flex-1 flex-col justify-center gap-3 p-6 sm:p-8">
          <span className="w-fit rounded-full bg-purple-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-purple-700">
            {labels.badge}
          </span>
          <h3 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            {combo.name}
          </h3>
          <p className="text-gray-600">{labels.desc}</p>
          <span className="mt-2 inline-flex w-fit items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 font-semibold text-white transition-all group-hover:from-purple-700 group-hover:to-pink-700">
            {labels.cta} →
          </span>
        </div>
      </div>
    </Link>
  )
}
