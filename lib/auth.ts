import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { supabaseServer } from "@/lib/supabase-server"
import "server-only"

export const {
  handlers: { GET, POST },
  auth,
} = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,

  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  session: { strategy: "jwt" },

  callbacks: {
    async signIn({ user }) {
  if (!user.email) return false


  const { data: profile } = await supabaseServer
    .from("profiles")
    .select("id, credits")
    .eq("email", user.email)
    .single()


  if (!profile) {
    const { error } = await supabaseServer
      .from("profiles")
      .insert({
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        credits: 3,
      })

    if (error) {
      console.error("CREATE PROFILE ERROR:", error)
      return false
    }

    return true
  }

 
  const { error } = await supabaseServer
    .from("profiles")
    .update({
      id: user.id,
      name: user.name,
      image: user.image,
    })
    .eq("email", user.email)

  if (error) {
    console.error("UPDATE PROFILE ERROR:", error)
    return false
  }

  return true
},

    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id
      }
      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string
      }
      return session
    },
  },
})
