"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";

interface LanguageSelectorProps {
  locale: 'pt' | 'en';
}

export default function LanguageSelector({ locale }: LanguageSelectorProps) {
  const pathname = usePathname();
  
  // Generate the alternate URL
  const getAlternateUrl = () => {
    if (locale === 'pt') {
      // Current is PT, link to EN
      return pathname === '/' ? '/en' : `/en${pathname}`;
    } else {
      // Current is EN, link to PT
      return pathname.replace('/en', '') || '/';
    }
  };

  const alternateUrl = getAlternateUrl();

  return (
    <div className="flex items-center gap-2">
      <Link
        href={alternateUrl}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all text-sm font-medium"
      >
        {locale === 'en' ? (
          <>
            <span className="text-lg">🇺🇸</span>
            <span>EN</span>
          </>
        ) : (
          <>
            <span className="text-lg">🇧🇷</span>
            <span>PT</span>
          </>
        )}
      </Link>
    </div>
  );
}
