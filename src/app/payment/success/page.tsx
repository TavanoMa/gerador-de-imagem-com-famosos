import Link from "next/link"
import AutoRedirect from "@/src/components/AutoRedirect"

export const dynamic = "force-dynamic"

const PACKAGE_LABELS: Record<string, { pt: string; en: string }> = {
  "credits-5": { pt: "5 créditos", en: "5 credits" },
  "credits-15": { pt: "15 créditos", en: "15 credits" },
  "credits-30": { pt: "30 créditos", en: "30 credits" },
}

type Props = {
  searchParams: Promise<{ package?: string; locale?: string; returnTo?: string }>
}

function isSafeReturnTo(path: string): boolean {
  return (
    path.length > 0 &&
    path.length <= 512 &&
    path.startsWith("/") &&
    !path.startsWith("//") &&
    !path.includes("//")
  )
}

export default async function PaymentSuccessPage({ searchParams }: Props) {
  const params = await searchParams
  const packageId = params.package ?? ""
  const locale = (params.locale === "en" ? "en" : "pt") as "pt" | "en"
  const rawReturn = params.returnTo ?? ""
  const returnTo = rawReturn && isSafeReturnTo(rawReturn) ? rawReturn : null

  const label = PACKAGE_LABELS[packageId]?.[locale] ?? (packageId || (locale === "en" ? "credits" : "créditos"))

  const t = {
    pt: {
      title: "Pagamento recebido",
      message: "Seus créditos foram adicionados à sua conta. Você já pode gerar imagens.",
      package: "Pacote:",
      home: "Voltar ao início",
      back: "Continuar",
      clickHere: "Clique aqui se não for redirecionado",
      en: "English",
    },
    en: {
      title: "Payment received",
      message: "Your credits have been added to your account. You can generate images now.",
      package: "Package:",
      home: "Back to home",
      back: "Continue",
      clickHere: "Click here if you are not redirected",
      en: "English",
    },
  }

  const text = t[locale]
  const redirectHref = returnTo ?? (locale === "en" ? "/en" : "/")
  const redirectingLabel = locale === "en" ? "Redirecting..." : "Redirecionando..."

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <svg
            className="h-8 w-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{text.title}</h1>
        <p className="text-gray-600 mb-4">{text.message}</p>
        {packageId && (
          <p className="text-sm text-gray-500 mb-2">
            {text.package} <span className="font-medium text-gray-700">{label}</span>
          </p>
        )}
        <AutoRedirect href={redirectHref} delaySeconds={2} redirectingLabel={redirectingLabel} />
        <p className="mt-2">
          <Link href={redirectHref} className="text-sm text-purple-600 hover:text-purple-700 underline">
            {text.clickHere}
          </Link>
        </p>
        <p className="mt-6">
          <Link
            href={
              locale === "en"
                ? "/payment/success?package=" + packageId + (returnTo ? "&returnTo=" + encodeURIComponent(returnTo) : "")
                : "/payment/success?package=" + packageId + "&locale=en" + (returnTo ? "&returnTo=" + encodeURIComponent(returnTo) : "")
            }
            className="text-sm text-gray-500 hover:text-gray-700 "
          >
            {locale === "en" ? "Português" : text.en}
          </Link>
        </p>
      </div>
    </div>
  )
}
