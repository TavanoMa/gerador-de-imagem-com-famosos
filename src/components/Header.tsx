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
    <header className="border-b border-[#2a2a2a]">
      <div className="mx-auto flex h-[80px] max-w-[1200px] items-center justify-between px-12 text-[#dfdfdfde]">
        
        <div className="flex flex-col">
            <Link href="/">
                <h1 className="text-2xl font-semibold">{title}</h1>
            </Link>

          
          {typeof credits === "number" && (
            <span className="text-sm text-[#9a9a9a]">
              {!isLogged ? (
                <p>Faça Login para checar seus créditos</p>
              ) : (
                <p>Créditos restantes: {credits}</p>
              )}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isLogged ? <SignOutButton /> : <SignInButton />}
        </div>

      </div>
    </header>
  )
}

export default Header