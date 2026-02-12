"use client"

import Link from "next/link";
import Image from "next/image";

interface Famous {
  id: number;
  name: string;
  slug: string;
  description: string;
  image: string;
}

interface FamousGridProps {
  famosos: Famous[];
  locale?: 'pt' | 'en';
}

export default function FamousGrid({ famosos, locale = 'pt' }: FamousGridProps) {
  const content = {
    pt: {
      title: "Escolha seu Famoso Favorito",
      subtitle: "Selecione uma celebridade e crie sua foto personalizada com IA"
    },
    en: {
      title: "Choose Your Favorite Celebrity",
      subtitle: "Select a celebrity and create your personalized AI photo"
    }
  };

  const t = content[locale];
  const basePath = locale === 'en' ? '/en/image' : '/image';
  const sectionId = locale === 'en' ? 'celebrities' : 'famosos';

  return (
    <section id={sectionId} className="py-16 sm:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {t.title}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t.subtitle}
          </p>
        </div>

        {/* Grid */}
        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
          {famosos.map((famoso) => (
            <li key={famoso.id}>
              <Link
                href={`${basePath}/${famoso.slug}`}
                className="group block bg-white rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl border border-gray-200 hover:border-purple-300 hover:scale-105"
              >
                {/* Image Container */}
                <div className="relative aspect-square bg-gradient-to-br from-gray-100 to-gray-200">
                  <Image
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(famoso.name)}&size=400&background=random&bold=true`}
                    alt={famoso.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>

                {/* Name */}
                <div className="p-3 sm:p-4 text-center bg-white">
                  <h3 className="font-semibold text-sm sm:text-base text-gray-900 group-hover:text-purple-600 transition-colors">
                    {famoso.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                    {famoso.description}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
