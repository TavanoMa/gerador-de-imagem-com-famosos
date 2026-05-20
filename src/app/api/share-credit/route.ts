import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { supabaseServer } from "@/lib/supabase-server"

export async function POST() {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      )
    }

    const { data: profile } = await supabaseServer
      .from("profiles")
      .select("id, credits, referral_credits_used")
      .eq("email", session.user.email)
      .single()

    if (!profile) {
      return NextResponse.json(
        { error: "Perfil não encontrado" },
        { status: 404 }
      )
    }

    if (profile.referral_credits_used >= 3) {
      return NextResponse.json(
        { error: "Limite atingido" },
        { status: 403 }
      )
    }

    const newCredits = profile.credits + 1
    const newReferralCount =
      profile.referral_credits_used + 1

    await supabaseServer
      .from("profiles")
      .update({
        credits: newCredits,
        referral_credits_used: newReferralCount,
      })
      .eq("id", profile.id)

    return NextResponse.json({
      credits: newCredits,
      referralCreditsUsed: newReferralCount,
    })
  } catch (err) {
    console.error(err)

    return NextResponse.json(
      { error: "Erro interno" },
      { status: 500 }
    )
  }
}