import { auth } from "@/lib/auth"
import { supabaseServer } from "@/lib/supabase-server"
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
      title: "Famoso não encontrado",
      description: "Página não encontrada",
    }
  }

  const seoData = famoso.seo?.pt || {
    title: `${famoso.name} com você em imagem realista`,
    description: `Crie uma imagem realista sua ao lado de ${famoso.name} usando inteligência artificial.`
  }

  const baseUrl = getBaseUrl()
  const pageUrl = `${baseUrl}/image/${slug}`
  const enUrl = `${baseUrl}/en/image/${slug}`

  return {
    title: seoData.title,
    description: seoData.description,
    alternates: {
      canonical: pageUrl,
      languages: {
        'pt-BR': pageUrl,
        'en': enUrl,
      }
    },
    openGraph: {
      title: seoData.title,
      description: seoData.description,
      type: "website",
      url: pageUrl,
      locale: 'pt-BR',
      alternateLocale: 'en',
    },
    twitter: {
      card: 'summary_large_image',
      title: seoData.title,
      description: seoData.description,
    },
  }
}

const page = async ({ params }: Props) => {
  const { slug } = await params
  const session = await auth()
  const famoso = famosos.find((f) => f.slug === slug)

  if (!famoso) {
    return <div>Famoso não encontrado</div>
  }

  let hasSavedPaymentInfo = false

  if (session?.user?.email) {
    const { data: profile } = await supabaseServer
      .from("profiles")
      .select("tax_id, cellphone")
      .eq("email", session.user.email)
      .single()

    if (profile?.tax_id && profile?.cellphone) {
      hasSavedPaymentInfo = true
    }
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">
      <PageClient
        famousSlug={famoso.slug}
        famousName={famoso.name}
        isLogged={!!session}
        locale="pt"
        userEmail={session?.user?.email || undefined}
        hasSavedPaymentInfo={hasSavedPaymentInfo}
      />
    </div>
  )
}

export default page
