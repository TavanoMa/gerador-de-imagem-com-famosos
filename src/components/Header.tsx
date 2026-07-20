"use client"

import Link from "next/link"
import { useState } from "react"
import SignInButton from "../components/SignInButton"
import SignOutButton from "../components/SignOutButton"
import LanguageSelector from "./LanguageSelector"

type HeaderProps = {
  title?: string
  isLogged: boolean
  locale?: "pt" | "en"
  userEmail?: string
}

const Header = ({
  title,
  isLogged,
  locale = "pt",
  userEmail,
}: HeaderProps) => {
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const translations = {
    pt: { signOut: "Sair da conta" },
    en: { signOut: "Sign Out" },
  }

  const t = translations[locale]
  const homeUrl = locale === "en" ? "/en" : "/"

  const getInitials = (email?: string) => {
    if (!email) return "U"
    const name = email.split("@")[0]
    return name.charAt(0).toUpperCase()
  }

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200/70 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-[72px] max-w-[1200px] items-center justify-between px-4 sm:px-6">

        <div className="min-w-0">
          <Link href={homeUrl}>
            <h1 className="truncate text-lg font-bold tracking-tight text-gray-900 transition hover:text-purple-600 sm:text-xl md:text-2xl">
              {title}
            </h1>
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSelector locale={locale} />

          {isLogged ? (
            <div className="relative">
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
