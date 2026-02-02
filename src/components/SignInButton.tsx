"use client";

import { signIn } from "next-auth/react";

export default function SignInButton() {
  return (
    <button
      onClick={() => signIn("google")}
      className="
    w-42
    border border-[#3a3a3a]
    bg-transparent
    px-[18px] py-[10px]
    text-[0.9rem]
    rounded-md
    transition-all duration-200
    hover:border-[#7c7cff]
    hover:text-[#7c7cff]
    font-bold
    "
    >
      Entrar com Google
    </button>
  );
}
