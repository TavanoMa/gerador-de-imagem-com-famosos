"use client"

import Header from "@/src/components/Header"
import GenerateImage from "@/src/components/GenerateImage"

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
  return (
    <div className="bg-white text-gray-900 overflow-x-hidden">
      <Header
        title={famousName}
        isLogged={isLogged}
        locale={locale}
        userEmail={userEmail}
      />
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
