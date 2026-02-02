import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { supabase } from "@/lib/supabase"

console.log("AUTH.TS CARREGADO")

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

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async signIn({ user }) {
  if (!user.email) return false

  await supabase.from("profiles").upsert(
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
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", token.email)
      .limit(1)

    if (data?.[0]) {
      token.userId = data[0].id
    }
  }

  return token
},
    async session({ session, token }) {
  console.log("SESSION CALLBACK")
  console.log("TOKEN:", token)

  if (session.user) {
    session.user.id = token.userId as string
  }

  console.log("SESSION FINAL:", session)
  return session
},
  },
})
