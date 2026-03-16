"use client"

import { useState } from "react"
import Header from "@/src/components/Header"
import GenerateImage from "@/src/components/GenerateImage"
import BuyCredits from "@/src/components/BuyCredits"

interface Props {
  famousName: string
  initialCredits?: number
  isLogged: boolean
  famousSlug: string
  locale?: 'pt' | 'en'
  userEmail?: string
}

export default function PageClient({
  famousName,
  initialCredits,
  isLogged,
  famousSlug,
  locale = 'pt',
  userEmail
}: Props) {
  const [credits, setCredits] = useState<number>(initialCredits ?? 0)
  const [buyModalOpen, setBuyModalOpen] = useState(false)

  return (
    <div className="bg-white text-gray-900">
      <Header 
        title={famousName} 
        credits={credits} 
        isLogged={isLogged} 
        locale={locale}
        userEmail={userEmail}
        onCreditsClick={() => setBuyModalOpen(true)}
      />
      <GenerateImage
        isLogged={isLogged}
        credits={credits}
        onCreditsUpdate={setCredits}
        famousSlug={famousSlug}
        famousName={famousName}
        locale={locale}
        onBuyCredits={() => setBuyModalOpen(true)}
      />

      {/* Buy Credits Modal */}
      {buyModalOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setBuyModalOpen(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-white shadow-2xl sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:w-full sm:max-w-lg overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-end px-5 pt-5 pb-2">
              <button
                onClick={() => setBuyModalOpen(false)}
                className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
                aria-label="Fechar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <BuyCredits isLogged={isLogged} locale={locale} returnTo={locale === "en" ? `/en/image/${famousSlug}` : `/image/${famousSlug}`} />
          </div>
        </>
      )}
    </div>
  )
}
