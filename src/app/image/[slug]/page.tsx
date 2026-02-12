import { auth } from "@/lib/auth"
import { supabaseServer } from "@/lib/supabase-server"
import famosos from "@/src/data/famosos.json"
import PageClient from "@/src/components/PageClient"
import { Metadata } from "next"

// Force dynamic rendering - no caching
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

  let credits = 0

  if (session?.user?.email) {
    console.log('🔍 Session user:', { 
      id: session.user.id, 
      email: session.user.email 
    })
    
    // Try by email first (more reliable)
    const { data: profileByEmail, error: emailError } = await supabaseServer
      .from("profiles")
      .select("credits, id")
      .eq("email", session.user.email)
      .single()

    if (emailError) {
      console.error('❌ Error fetching by email:', emailError)
    } else if (profileByEmail) {
      console.log('✅ Profile found by email:', profileByEmail)
      credits = profileByEmail.credits ?? 0
    } else {
      console.log('⚠️ No profile found for email:', session.user.email)
    }
  } else {
    console.log('⚠️ No session or user email')
  }

  console.log('📊 Final credits value:', credits)

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <PageClient
        famousSlug={famoso.slug}
        famousName={famoso.name}
        initialCredits={credits}
        isLogged={!!session}
        locale="pt"
        userEmail={session?.user?.email || undefined}
      />
    </div>
  )
}

// Remove static generation since we need dynamic data
// export async function generateStaticParams() {
//   return famosos.map((famoso) => ({
//     slug: famoso.slug,
//   }))
// }

export default page

