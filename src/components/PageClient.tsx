"use client"

import { useState } from "react"
import Header from "@/src/components/Header"
import GenerateImage from "@/src/components/GenerateImage"

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


  return (
    <div className="bg-white text-gray-900">
      <Header 
        title={famousName} 
        credits={credits} 
        isLogged={isLogged} 
        locale={locale}
        userEmail={userEmail}
      />
      <GenerateImage
        isLogged={isLogged}
        credits={credits}
        onCreditsUpdate={setCredits}
        famousSlug={famousSlug}
        famousName={famousName}
        locale={locale}
      />
    </div>
  )
}
