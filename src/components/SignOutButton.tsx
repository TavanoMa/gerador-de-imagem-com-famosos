"use client";

import { signOut } from "next-auth/react";

interface SignOutButtonProps {
  id?: string;
}

export default function SignOutButton({ id }: SignOutButtonProps) {
  return (
    <button
      id={id}
      onClick={() => signOut({ callbackUrl: "/" })}
      className="
    w-40
    items-center
    border border-gray-300
    bg-transparent
    px-[18px] py-[10px]
    text-[0.9rem]
    rounded-md
    cursor-pointer
    transition-all duration-200
    hover:border-purple-500
    hover:text-purple-600
    font-bold
    "
    >
      Sair da conta
    </button>
  );
}
