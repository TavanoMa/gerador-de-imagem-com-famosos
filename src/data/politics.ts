import famosos from "@/src/data/famosos.json"

export interface FamousEntry {
  id: number
  name: string
  slug: string
  description: string
  image: string
  members?: string[]
  seo?: {
    pt?: { title: string; description: string }
    en?: { title: string; description: string }
  }
}

const all = famosos as FamousEntry[]

// Destaque principal das eleições: Lula e Flávio Bolsonaro (os presidenciáveis).
export const FEATURED_POLITICIAN_SLUGS = ["lula", "flavio-bolsonaro"]

// Combo em destaque principal (foto com os dois juntos).
export const FEATURED_COMBO_SLUG = "lula-e-flavio"

// Destaque secundário: Jair Bolsonaro + combo com ele.
export const SECONDARY_POLITICIAN_SLUG = "jair-bolsonaro"
export const SECONDARY_COMBO_SLUG = "lula-e-bolsonaro"

// Qual foto do storage usar para EXIBIÇÃO nos destaques (1 por padrão).
// A geração continua usando todas as fotos (1..3) como referência.
export const DISPLAY_IMAGE_INDEX: Record<string, number> = {
  // A foto 1 do Jair é um retrato vertical que o card corta; a 2 é landscape
  // e enquadra melhor o rosto.
  "jair-bolsonaro": 2,
}

export function displayImageIndex(slug: string): number {
  return DISPLAY_IMAGE_INDEX[slug] ?? 1
}

// Mapa página-do-político -> combo sugerido no banner.
export const COMBO_BY_POLITICIAN: Record<string, string> = {
  lula: FEATURED_COMBO_SLUG,
  "flavio-bolsonaro": FEATURED_COMBO_SLUG,
  "jair-bolsonaro": SECONDARY_COMBO_SLUG,
}

// Demais políticos, na ordem em que aparecem após o destaque.
export const OTHER_POLITICIAN_SLUGS = [
  "nikolas-ferreira",
  "pablo-marcal",
  "tarcisio-de-freitas",
  "sergio-moro",
  "ciro-gomes",
  "simone-tebet",
  "marina-silva",
  "fernando-haddad",
  "guilherme-boulos",
  "eduardo-bolsonaro",
  "tabata-amaral",
  "ratinho-jr",
  "romeu-zema",
  "damares-alves",
  "helder-barbalho",
  "joao-doria",
]

const bySlug = new Map(all.map((f) => [f.slug, f]))

export function getFamous(slug: string): FamousEntry | undefined {
  return bySlug.get(slug)
}

/** Um combo é uma entrada que agrupa dois ou mais famosos. */
export function isCombo(slug: string): boolean {
  const f = bySlug.get(slug)
  return !!f?.members && f.members.length > 1
}

/** Retorna os slugs que compõem o combo (vazio se não for combo). */
export function getComboMembers(slug: string): string[] {
  const f = bySlug.get(slug)
  return f?.members && f.members.length > 1 ? f.members : []
}

/** Slugs que NÃO devem aparecer no grid genérico (combos, sem foto única). */
export const COMBO_SLUGS = all
  .filter((f) => f.members && f.members.length > 1)
  .map((f) => f.slug)

export function getFeaturedPoliticians(): FamousEntry[] {
  return FEATURED_POLITICIAN_SLUGS.map((s) => bySlug.get(s)).filter(
    (f): f is FamousEntry => !!f
  )
}

export function getFeaturedCombo(): FamousEntry | undefined {
  return bySlug.get(FEATURED_COMBO_SLUG)
}

export function getSecondaryPolitician(): FamousEntry | undefined {
  return bySlug.get(SECONDARY_POLITICIAN_SLUG)
}

export function getSecondaryCombo(): FamousEntry | undefined {
  return bySlug.get(SECONDARY_COMBO_SLUG)
}

export function getOtherPoliticians(): FamousEntry[] {
  return OTHER_POLITICIAN_SLUGS.map((s) => bySlug.get(s)).filter(
    (f): f is FamousEntry => !!f
  )
}
