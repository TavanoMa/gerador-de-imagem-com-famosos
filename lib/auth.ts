import "server-only"

import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { supabaseServer } from "@/lib/supabase-server"

export const {
  handlers: { GET, POST },
  auth,
} = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,

  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false

      await supabaseServer
        .from("profiles")
        .upsert(
          {
            email: user.email,
            name: user.name,
            image: user.image,
            credits: 5,
          },
          { onConflict: "email" }
        )

      return true
    },

    async jwt({ token }) {
      if (!token.userId && token.email) {
        const { data } = await supabaseServer
          .from("profiles")
          .select("id")
          .eq("email", token.email)
          .single()

        if (data) {
          token.userId = data.id
        }
      }

      return token
    },

    async session({ session, token }) {
      if (session.user && token.userId) {
        session.user.id = token.userId as string
      }

      return session
    },
  },
})
