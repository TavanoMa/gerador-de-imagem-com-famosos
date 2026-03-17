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
      try {
        if (!user.email) {
          console.error("NO EMAIL FROM GOOGLE")
          return false
        }

        // 🔍 busca usuário
        const { data: profile, error: fetchError } = await supabaseServer
          .from("profiles")
          .select("id, credits")
          .eq("email", user.email)
          .maybeSingle()

        if (fetchError) {
          console.error("PROFILE FETCH ERROR:", fetchError)
          return false
        }

        // 🆕 usuário novo
        if (!profile) {
          const { error: insertError } = await supabaseServer
            .from("profiles")
            .insert({
              email: user.email,
              name: user.name,
              image: user.image,
              credits: 2,
            })

          if (insertError) {
            console.error("CREATE PROFILE ERROR:", insertError)
            return false
          }

          return true
        }

        // 🔄 usuário existente → atualiza dados básicos
        const { error: updateError } = await supabaseServer
          .from("profiles")
          .update({
            name: user.name,
            image: user.image,
          })
          .eq("email", user.email)

        if (updateError) {
          console.error("UPDATE PROFILE ERROR:", updateError)
          return false
        }

        return true
      } catch (err) {
        console.error("SIGNIN FATAL ERROR:", err)
        return false
      }
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