import Header from "@/src/components/Header"
import { auth } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import famosos from "@/src/data/famosos.json"
import GenerateImage from "@/src/components/GenerateImage"
import PageClient from "@/src/components/PageClient"

const page = async ({
  params,
}: {
  params: Promise<{ slug: string }>
}) => {

  const { slug } = await params

  const session = await auth()

  const famoso = famosos.find(f => f.slug === slug)

  if (!famoso) {
    return <div>Famoso não encontrado</div>
  }

  let credits: number | undefined

  if (session?.user?.id) {
    const { data } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", session.user.id)
      .single()

    credits = data?.credits
  }

  return (
    <PageClient
      famousName={famoso.name}
      initialCredits={credits}
      isLogged={!!session}
    />
  )
}

export default page