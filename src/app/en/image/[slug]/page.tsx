import { auth } from "@/lib/auth"
import { supabaseServer } from "@/lib/supabase-server"
import { FREE_GENERATION_LIMIT } from "@/lib/generation"
import famosos from "@/src/data/famosos.json"
import PageClient from "@/src/components/PageClient"
import { Metadata } from "next"

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Props = {
  params: Promise<{ slug: string }>
}

function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  return 'http://localhost:3000'
}

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const { slug } = await params
  const famoso = famosos.find(f => f.slug === slug)

  if (!famoso) {
    return {
      title: "Celebrity not found",
      description: "Page not found",
    }
  }

  const seoData = famoso.seo?.en || {
    title: `${famoso.name} with you in realistic image`,
    description: `Create a realistic image of yourself next to ${famoso.name} using artificial intelligence.`
  }

  const baseUrl = getBaseUrl()
  const pageUrl = `${baseUrl}/en/image/${slug}`
  const ptUrl = `${baseUrl}/image/${slug}`

  return {
    title: seoData.title,
    description: seoData.description,
    alternates: {
      canonical: pageUrl,
      languages: {
        'en': pageUrl,
        'pt-BR': ptUrl,
      }
    },
    openGraph: {
      title: seoData.title,
      description: seoData.description,
      type: "website",
      url: pageUrl,
      locale: 'en',
      alternateLocale: 'pt-BR',
    },
    twitter: {
      card: 'summary_large_image',
      title: seoData.title,
      description: seoData.description,
    },
  }
}

export async function generateStaticParams() {
  return famosos.map((famoso) => ({
    slug: famoso.slug,
  }))
}

const page = async ({ params }: Props) => {
  const { slug } = await params
  const session = await auth()
  const famoso = famosos.find((f) => f.slug === slug)

  if (!famoso) {
    return <div>Celebrity not found</div>
  }

  let hasSavedPaymentInfo = false
  let freeUsed = 0

  if (session?.user?.email) {
    const { data: profile } = await supabaseServer
      .from("profiles")
      .select("id, tax_id, cellphone")
      .eq("email", session.user.email)
      .single()

    if (profile?.tax_id && profile?.cellphone) {
      hasSavedPaymentInfo = true
    }

    if (profile?.id) {
      const { count } = await supabaseServer
        .from("generations")
        .select("id", { count: "exact", head: true })
        .eq("profile_id", profile.id)
        .eq("paid", false)
        .not("storage_path", "is", null)
      freeUsed = count ?? 0
    }
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <PageClient
        famousSlug={famoso.slug}
        famousName={famoso.name}
        isLogged={!!session}
        locale="en"
        userEmail={session?.user?.email || undefined}
        hasSavedPaymentInfo={hasSavedPaymentInfo}
        freeUsed={freeUsed}
        freeLimit={FREE_GENERATION_LIMIT}
      />
    </div>
  )
}

export default page
