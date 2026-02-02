"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="
    w-40
    items-center
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
      Sair da conta
    </button>
  );
}
