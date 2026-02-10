import Link from "next/link";
import SignInButton from "../components/SignInButton";
import SignOutButton from "../components/SignOutButton";



type HeaderProps = {
  title?: string
  isLogged: boolean
  credits?: number
}

const Header = ({title, credits, isLogged}: HeaderProps) => {
  


  return (
    <header className="border-b border-[#2a2a2a] bg-[#252525]">
  <div
    className="
      mx-auto max-w-[1200px]
      flex flex-col items-center text-center gap-2
      px-4 py-4
      sm:flex-row sm:items-center sm:justify-between sm:text-left sm:px-6 sm:h-[80px]
      text-[#dfdfdfde]
    "
  >

    <div className="flex flex-col items-center sm:items-start">
      <Link href="/">
        <h1 className="text-lg sm:text-xl md:text-2xl font-semibold leading-tight">
          {title}
        </h1>
      </Link>

      {typeof credits === "number" && (
        <span className="text-xs sm:text-sm text-[#9a9a9a]">
          {!isLogged ? (
            <p>Faça login para checar seus créditos</p>
          ) : (
            <p>Créditos restantes: {credits}</p>
          )}
        </span>
      )}
    </div>

    <div className="mt-2 sm:mt-0">
      {isLogged ? <SignOutButton /> : <SignInButton />}
    </div>

  </div>
</header>
  )
}

export default Header