import { auth } from "@/lib/auth"
import { supabaseServer } from "@/lib/supabase-server"
import famosos from "@/src/data/famosos.json"
import PageClient from "@/src/components/PageClient"
import { Metadata } from "next"

type Props = {
  params: Promise<{ slug: string }>
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

  return {
    title: `${famoso.name} com você em imagem realista`,
    description: `Crie uma imagem realista sua ao lado de ${famoso.name} usando inteligência artificial.`,
    openGraph: {
      title: `${famoso.name} com você`,
      description: `Gere uma imagem realista sua junto com ${famoso.name}.`,
      type: "website",
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

  if (session?.user?.id) {
    const { data } = await supabaseServer
      .from("profiles")
      .select("credits")
      .eq("id", session.user.id)
      .single()

    credits = data?.credits ?? 0
  }

  return (
    <div className="min-h-screen bg-[#252525] text-gray-100">
      <PageClient
        famousSlug={famoso.slug}
        famousName={famoso.name}
        initialCredits={credits}
        isLogged={!!session}
      />
    </div>
  )
}

export default page

