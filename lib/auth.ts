import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { supabaseServer } from "@/lib/supabase-server"
import "server-only"

export const {
  handlers: { GET, POST },
  auth,
} = NextAuth({
  secret: process.env.AUTH_SECRET,

  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],

  session: { strategy: "jwt" },

  callbacks: {
    async signIn({ user }) {
  if (!user.id || !user.email) return false

  const { error } = await supabaseServer
    .from("profiles")
    .upsert(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        credits: 5,
      },
      { onConflict: "id" }
    )

  if (error) {
    console.error("UPSERT PROFILE ERROR:", error)
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
