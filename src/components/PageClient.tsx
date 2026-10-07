"use client"

import Header from "@/src/components/Header"
import GenerateImage from "@/src/components/GenerateImage"
import ComboBanner from "@/src/components/ComboBanner"
import { COMBO_BY_POLITICIAN } from "@/src/data/politics"

interface Props {
  famousName: string
  isLogged: boolean
  famousSlug: string
  locale?: 'pt' | 'en'
  userEmail?: string
  hasSavedPaymentInfo?: boolean
}

export default function PageClient({
  famousName,
  isLogged,
  famousSlug,
  locale = 'pt',
  userEmail,
  hasSavedPaymentInfo = false,
}: Props) {
  const comboSlug = COMBO_BY_POLITICIAN[famousSlug]

  return (
    <div className="bg-white text-gray-900 overflow-x-hidden">
      <Header
        title={famousName}
        isLogged={isLogged}
        locale={locale}
        userEmail={userEmail}
      />
      {comboSlug && (
        <div className="pt-6">
          <ComboBanner comboSlug={comboSlug} locale={locale} />
        </div>
      )}
      <GenerateImage
        isLogged={isLogged}
        famousSlug={famousSlug}
        famousName={famousName}
        locale={locale}
        hasSavedPaymentInfo={hasSavedPaymentInfo}
      />
    </div>
  )
}
