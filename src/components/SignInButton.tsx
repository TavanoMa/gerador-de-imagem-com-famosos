"use client";

import { signIn } from "next-auth/react";

type Props = {
  locale?: "pt" | "en";
};

export default function SignInButton({ locale = "pt" }: Props) {
  const label = locale === "en" ? "Sign In" : "Entrar";

  return (
    <button
      onClick={() => signIn("google", { callbackUrl: window.location.href })}
      className="
    w-22
    h-10
    flex items-center justify-center
    bg-[#1a1a1a]
    text-white
    px-[18px] py-[10px]
    text-[0.9rem]
    rounded-xl
    cursor-pointer
    transition-all duration-200
    hover:bg-[#2e2e2e]
    font-bold
    border border-transparent
    "
    >
      {label}
    </button>
  );
}
