import Link from "next/link"
import SuccessActions from "./SuccessActions"

export const dynamic = "force-dynamic"

type Props = {
  searchParams: Promise<{ generationId?: string; locale?: string }>
}

export default async function PaymentSuccessPage({ searchParams }: Props) {
  const params = await searchParams
  const generationId = params.generationId ?? ""
  const locale = (params.locale === "en" ? "en" : "pt") as "pt" | "en"

  const t = {
    pt: {
      title: "Pagamento confirmado!",
      message: "Sua imagem sem marca d'água está pronta.",
      home: "Voltar ao início",
      noGeneration: "Nenhuma geração encontrada.",
    },
    en: {
      title: "Payment confirmed!",
      message: "Your image without watermark is ready.",
      home: "Back to home",
      noGeneration: "No generation found.",
    },
  }

  const text = t[locale]
  const homeHref = locale === "en" ? "/en" : "/"

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
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

        {generationId ? (
          <>
            <p className="text-gray-600 mb-6">{text.message}</p>
            <SuccessActions generationId={generationId} locale={locale} />
          </>
        ) : (
          <p className="text-gray-500 mb-6">{text.noGeneration}</p>
        )}

        <p className="mt-8">
          <Link
            href={homeHref}
            className="text-sm text-purple-600 hover:text-purple-700 underline"
          >
            {text.home}
          </Link>
        </p>
      </div>
    </div>
  )
}
