"use client"

import Link from "next/link"
import { useState } from "react"
import SignInButton from "../components/SignInButton"
import SignOutButton from "../components/SignOutButton"
import LanguageSelector from "./LanguageSelector"

type HeaderProps = {
  title?: string
  isLogged: boolean
  credits?: number
  locale?: "pt" | "en"
  userEmail?: string
  onCreditsClick?: () => void
}

const Header = ({
  title,
  credits,
  isLogged,
  locale = "pt",
  userEmail,
  onCreditsClick,
}: HeaderProps) => {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [shareLoading, setShareLoading] = useState(false)
  const [shareSuccess, setShareSuccess] = useState(false)

  const translations = {
    pt: {
      creditsTooltip: "Clique para comprar mais créditos",
      signOut: "Sair da conta",
      share: "Ganhar crédito",
      shareTooltip: "Compartilhe o site e ganhe +1 crédito grátis",
      copied: "Link copiado!",
    },

    en: {
      creditsTooltip: "Click to buy more credits",
      signOut: "Sign Out",
      share: "Earn credit",
      shareTooltip: "Share the site and earn +1 free credit",
      copied: "Link copied!",
    },
  }

  const t = translations[locale]

  const homeUrl = locale === "en" ? "/en" : "/"

  const getInitials = (email?: string) => {
    if (!email) return "U"

    const name = email.split("@")[0]

    return name.charAt(0).toUpperCase()
  }

  const handleShare = async () => {
    try {
      if (shareLoading) return

      setShareLoading(true)

      const shareUrl = window.location.origin

      if (navigator.share) {
        await navigator.share({
          title: title || "Foto com famosos",
          text: "Crie fotos incríveis com famosos usando IA",
          url: shareUrl,
        })
      } else {
        await navigator.clipboard.writeText(shareUrl)
      }

      const res = await fetch("/api/share-credit", {
        method: "POST",
      })

      if (!res.ok) return

      setShareSuccess(true)

      setTimeout(() => {
        window.location.reload()
      }, 1200)
    } catch (err) {
      console.error(err)
    } finally {
      setShareLoading(false)
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200/70 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-[72px] max-w-[1200px] items-center justify-between px-4 sm:px-6">

        {/* LEFT */}
        <div className="min-w-0">
          <Link href={homeUrl}>
            <h1 className="truncate text-lg font-bold tracking-tight text-gray-900 transition hover:text-purple-600 sm:text-xl md:text-2xl">
              {title}
            </h1>
          </Link>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-2 sm:gap-3">

          {/* Language */}
          <LanguageSelector locale={locale} />

          {/* Credits */}
          {isLogged && typeof credits === "number" && (
            <div className="flex items-center gap-2">

              {/* Credits Button */}
              <div className="group relative">
                <button
                  onClick={onCreditsClick}
                  className="
                    flex items-center gap-2
                    rounded-xl border border-purple-200
                    bg-gradient-to-r from-purple-50 to-pink-50
                    px-3 py-2
                    font-semibold text-purple-700
                    shadow-xs
                    transition-all
                    hover:scale-[1.02]
                    hover:border-purple-300
                    hover:shadow-md
                  "
                >
                  <span className="text-base">💵</span>

                  <span className="text-sm">
                    {credits}
                  </span>
                </button>

                {/* Tooltip */}
                <div className="pointer-events-none absolute left-1/2 top-full z-50 mt-2 invisible -translate-x-1/2 rounded-lg bg-gray-900 px-3 py-2 text-xs whitespace-nowrap text-white opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100">
                  {t.creditsTooltip}

                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-gray-900" />
                </div>
              </div>

              {/* Share Reward */}
              <div className="group relative">
                <button
                  onClick={handleShare}
                  disabled={shareLoading}
                  className={`
                    relative overflow-hidden
                    flex items-center gap-2
                    rounded-xl border
                    px-3 py-2
                    font-medium
                    transition-all duration-200
                    ${
                      shareSuccess
                        ? "border-green-300 bg-green-100 text-green-700"
                        : "border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 hover:scale-[1.02] hover:border-green-300 hover:shadow-md"
                    }
                  `}
                >
                  {/* glow */}
                  <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-white/20" />

                  <span className="relative text-base">
                    {shareSuccess ? "✅" : "🎁"}
                  </span>

                  <span className="relative hidden text-sm sm:block">
                    {shareLoading
                      ? "..."
                      : shareSuccess
                      ? "+1"
                      : "+1"}
                  </span>
                </button>

                {/* Tooltip */}
                <div className="pointer-events-none absolute left-1/2 top-full z-50 mt-2 invisible -translate-x-1/2 rounded-lg bg-gray-900 px-3 py-2 text-xs whitespace-nowrap text-white opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100">
                  {t.shareTooltip}

                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-gray-900" />
                </div>
              </div>
            </div>
          )}

          {/* USER */}
          {isLogged ? (
            <div className="relative">

              {/* Avatar */}
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="
                  flex h-10 w-10 items-center justify-center
                  rounded-full
                  bg-gradient-to-br from-purple-500 to-pink-500
                  text-sm font-bold text-white
                  shadow-md
                  transition-all duration-200
                  hover:scale-105
                  hover:shadow-lg
                  focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2
                "
              >
                {getInitials(userEmail)}
              </button>

              {/* Dropdown */}
              {dropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setDropdownOpen(false)}
                  />

                  <div
                    className="
                      absolute right-0 z-20 mt-3
                      w-56 overflow-hidden
                      rounded-2xl border border-gray-200
                      bg-white
                      shadow-2xl
                    "
                  >
                    {userEmail && (
                      <div className="border-b border-gray-100 px-4 py-3">
                        <p className="truncate text-xs text-gray-500">
                          {userEmail}
                        </p>
                      </div>
                    )}

                    <button
                      onClick={() => {
                        setDropdownOpen(false)

                        document
                          .getElementById("signout-trigger")
                          ?.click()
                      }}
                      className="
                        w-full px-4 py-3 text-left text-sm
                        text-gray-700
                        transition-colors
                        hover:bg-gray-50
                      "
                    >
                      {t.signOut}
                    </button>
                  </div>
                </>
              )}

              {/* Hidden SignOut */}
              <div className="hidden">
                <SignOutButton id="signout-trigger" />
              </div>
            </div>
          ) : (
            <SignInButton locale={locale} />
          )}
        </div>
      </div>
    </header>
  )
}

export default Header