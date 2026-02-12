"use client"

import Link from "next/link";
import { useState } from "react";
import SignInButton from "../components/SignInButton";
import SignOutButton from "../components/SignOutButton";
import LanguageSelector from "./LanguageSelector";

type HeaderProps = {
  title?: string
  isLogged: boolean
  credits?: number
  locale?: 'pt' | 'en'
  userEmail?: string
}

const Header = ({title, credits, isLogged, locale = 'pt', userEmail}: HeaderProps) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const translations = {
    pt: {
      creditsTooltip: "Cada geração custa 1 crédito",
      signOut: "Sair da conta",
      signIn: "Entrar"
    },
    en: {
      creditsTooltip: "Each generation costs 1 credit",
      signOut: "Sign Out",
      signIn: "Sign In"
    }
  };

  const t = translations[locale];
  const homeUrl = locale === 'en' ? '/en' : '/';

  // Get initials from email or use default
  const getInitials = (email?: string) => {
    if (!email) return "U";
    const name = email.split('@')[0];
    return name.charAt(0).toUpperCase();
  };

  return (
    <header className="border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto max-w-[1200px] flex items-center justify-between px-4 py-4 sm:px-6 h-[70px]">
        
        {/* Left: Title */}
        <div>
          <Link href={homeUrl}>
            <h1 className="text-lg sm:text-xl md:text-2xl font-semibold leading-tight text-gray-900 hover:text-purple-600 transition">
              {title}
            </h1>
          </Link>
        </div>

        

        {/* Right: Credits, Language, Avatar/Login */}
        <div className="flex items-center gap-3 sm:gap-4">
                    {/* Language Selector */}
                    <LanguageSelector locale={locale} />
          {/* Credits Display - Only when logged in and credits are defined */}
          {isLogged && typeof credits === "number" && (
            <div className="group relative">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-lg text-purple-700 font-semibold">
                <span className="text-lg">💵</span>
                <span className="text-sm">{credits}</span>
              </div>
              {/* Tooltip */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-50">
                {t.creditsTooltip}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 -mb-1 border-4 border-transparent border-b-gray-900"></div>
              </div>
            </div>
          )}

          {/* Avatar with Dropdown or Sign In Button */}
          {isLogged ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold flex items-center justify-center hover:scale-105 transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 cursor-pointer"
              >
                {getInitials(userEmail)}
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <>
                  {/* Backdrop to close dropdown */}
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setDropdownOpen(false)}
                  />
                  
                  {/* Dropdown Content */}
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                    {userEmail && (
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                      </div>
                    )}
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        // Trigger sign out
                        document.getElementById('signout-trigger')?.click();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      {t.signOut}
                    </button>
                  </div>
                </>
              )}

              {/* Hidden SignOutButton to trigger actual sign out */}
              <div className="hidden">
                <SignOutButton id="signout-trigger" />
                
              </div>
            </div>
          ) : (
            <SignInButton />
          )}
        </div>
      </div>
    </header>
  )
}

export default Header