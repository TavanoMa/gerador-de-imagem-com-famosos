"use client"

import { useState } from "react"
import Header from "@/src/components/Header"
import GenerateImage from "@/src/components/GenerateImage"

interface Props {
  famousName: string
  initialCredits?: number
  isLogged: boolean
  famousSlug: string
}

export default function PageClient({
  famousName,
  initialCredits,
  isLogged,
  famousSlug
}: Props) {
  const [credits, setCredits] = useState<number>(initialCredits ?? 0)


  return (
    <div className="bg-[#252525] text-gray-100">
      <Header title={famousName} credits={credits} isLogged={isLogged} />
      <GenerateImage
        isLogged={isLogged}
        credits={credits}
        onCreditsUpdate={setCredits}
        famousSlug={famousSlug}
        famousName={famousName}
      />
    </div>
  )
}
