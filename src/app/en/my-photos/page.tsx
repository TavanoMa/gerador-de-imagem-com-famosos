import Link from "next/link"
import { auth } from "@/lib/auth"
import { supabaseServer } from "@/lib/supabase-server"
import famosos from "@/src/data/famosos.json"
import Header from "@/src/components/Header"
import MyPhotosClient from "@/src/components/MyPhotosClient"
import SignInButton from "@/src/components/SignInButton"

export const dynamic = "force-dynamic"
export const revalidate = 0

export const metadata = {
  title: "My photos",
  robots: { index: false, follow: false },
}

type Item = { id: string; paid: boolean; famousName: string; createdAt: string }

export default async function MyPhotosPage() {
  const session = await auth()

  if (!session?.user?.email) {
    return (
      <div className="min-h-screen bg-white text-gray-900">
        <Header title="My photos" isLogged={false} locale="en" />
        <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
          <p className="text-gray-600">Log in to see your photos.</p>
          <SignInButton locale="en" />
        </div>
      </div>
    )
  }

  const { data: profile } = await supabaseServer
    .from("profiles")
    .select("id")
    .eq("email", session.user.email)
    .single()

  let items: Item[] = []
  if (profile) {
    const { data } = await supabaseServer
      .from("generations")
      .select("id, paid, storage_path, famous_slug, created_at")
      .eq("profile_id", profile.id)
      .not("storage_path", "is", null)
      .order("created_at", { ascending: false })

    items = (data || []).map((g) => ({
      id: g.id,
      paid: !!g.paid,
      famousName: famosos.find((f) => f.slug === g.famous_slug)?.name || g.famous_slug,
      createdAt: g.created_at,
    }))
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Header title="My photos" isLogged={true} locale="en" userEmail={session.user.email} />
      <MyPhotosClient items={items} locale="en" />
      <div className="pb-10 text-center">
        <Link href="/en" className="text-sm text-purple-600 underline hover:text-purple-700">
          Back to home
        </Link>
      </div>
    </div>
  )
}
