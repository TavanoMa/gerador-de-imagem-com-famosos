"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useMemo } from "react";

interface Famous {
  id: number;
  name: string;
  slug: string;
  description: string;
  image: string;
}

interface FamousGridProps {
  famosos: Famous[];
  locale?: "pt" | "en";
}

export default function FamousGrid({ famosos, locale = "pt" }: FamousGridProps) {
  const [search, setSearch] = useState("");

  const content = {
    pt: {
      title: "Escolha seu Famoso Favorito",
      subtitle: "Selecione uma celebridade e crie sua foto personalizada com IA",
      placeholder: "Buscar famoso..."
    },
    en: {
      title: "Choose Your Favorite Celebrity",
      subtitle: "Select a celebrity and create your personalized AI photo",
      placeholder: "Search celebrity..."
    }
  };

  const t = content[locale];

  const basePath = locale === "en" ? "/en/image" : "/image";

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

  const getImageUrls = (slug: string) => {
    const version = "v4";
    const base = `${SUPABASE_URL}/storage/v1/object/public/famous_image/${slug}/1`;

    return {
      jpg: `${base}.jpg?${version}`,
      png: `${base}.png?${version}`,
    };
  };

  // 🔥 FILTRO OTIMIZADO
  const filteredFamosos = useMemo(() => {
    return famosos.filter((f) =>
      f.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, famosos]);

  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            {t.title}
          </h2>
          <p className="text-gray-600">{t.subtitle}</p>
        </div>

        {/* 🔍 SEARCH BAR */}
        <div className="mb-10 flex justify-center">
          <input
            type="text"
            placeholder={t.placeholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="
              w-full max-w-md
              px-4 py-3
              border border-gray-300
              rounded-xl
              outline-none
              focus:ring-2 focus:ring-purple-500
              focus:border-transparent
            "
          />
        </div>

        {/* Grid */}
        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
          {filteredFamosos.map((famoso) => {
            const imageUrls = getImageUrls(famoso.slug);

            return (
              <li key={famoso.id}>
                <Link
                  href={`${basePath}/${famoso.slug}`}
                  className="group block bg-white rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl border border-gray-200 hover:border-purple-300 hover:scale-105"
                >
                  <div className="relative aspect-square bg-gray-100">
                    <Image
                      src={imageUrls.jpg}
                      alt={`Foto de ${famoso.name}`}
                      fill
                      className="object-cover"
                      loading="lazy"
                      unoptimized
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;

                        if (target.src.includes(".jpg")) {
                          target.src = imageUrls.png;
                          return;
                        }

                        target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          famoso.name
                        )}`;
                      }}
                    />
                  </div>

                  <div className="p-3 text-center">
                    <h3 className="font-semibold text-sm text-gray-900 group-hover:text-purple-600">
                      {famoso.name}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-1">
                      {famoso.description}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* 🔥 Feedback quando não acha */}
        {filteredFamosos.length === 0 && (
          <p className="text-center text-gray-500 mt-10">
            Nenhum resultado encontrado.
          </p>
        )}
      </div>
    </section>
  );
}