"use client"

import { useEffect, useState } from "react"

type Props = {
  href: string
  delaySeconds?: number
  redirectingLabel?: string
}

export default function AutoRedirect({
  href,
  delaySeconds = 2,
  redirectingLabel = "Redirecionando...",
}: Props) {
  const [secondsLeft, setSecondsLeft] = useState(delaySeconds)

  useEffect(() => {
    const redirectTimer = setTimeout(() => {
      window.location.href = href
    }, delaySeconds * 1000)
    const interval = setInterval(() => {
      setSecondsLeft((s) => (s <= 1 ? 0 : s - 1))
    }, 1000)
    return () => {
      clearTimeout(redirectTimer)
      clearInterval(interval)
    }
  }, [href, delaySeconds])

  return (
    <p className="text-sm text-gray-500 mt-4">
      {redirectingLabel} {secondsLeft > 0 && `(${secondsLeft})`}
    </p>
  )
}
