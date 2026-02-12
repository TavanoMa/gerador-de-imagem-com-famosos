"use client"

import Link from "next/link";

interface HeroProps {
  locale?: 'pt' | 'en';
}

export default function Hero({ locale = 'pt' }: HeroProps) {
  const content = {
    pt: {
      title: "Crie Fotos com Famosos",
      subtitle: "Usando Inteligência Artificial",
      description: "Gere imagens realistas ao lado das suas celebridades favoritas. Compartilhe nas redes sociais e impressione seus amigos!",
      cta: "ESCOLHER MEU FAMOSO →",
      feature1: "✨ Imagens Realistas",
      feature2: "⚡ Geração Instantânea",
      feature3: "📱 Compartilhe Facilmente"
    },
    en: {
      title: "Create Photos with Celebrities",
      subtitle: "Using Artificial Intelligence",
      description: "Generate realistic images next to your favorite celebrities. Share on social media and impress your friends!",
      cta: "CHOOSE MY CELEBRITY →",
      feature1: "✨ Realistic Images",
      feature2: "⚡ Instant Generation",
      feature3: "📱 Easy Sharing"
    }
  };

  const t = content[locale];
  const ctaLink = locale === 'en' ? '#celebrities' : '#famosos';

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-white via-gray-50 to-purple-50 py-20 sm:py-32">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 border border-purple-200 mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-600"></span>
            </span>
            <span className="text-sm text-purple-700 font-medium">AI-Powered</span>
          </div>

          {/* Main heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-4 leading-tight">
            {t.title}
            <br />
            <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
              {t.subtitle}
            </span>
          </h1>

          {/* Description */}
          <p className="mt-6 text-lg sm:text-xl text-gray-700 max-w-2xl mx-auto leading-relaxed">
            {t.description}
          </p>

          {/* CTA Button */}
          <div className="mt-10">
            <a
              href={ctaLink}
              className="inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-full hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
            >
              {t.cta}
            </a>
          </div>

          {/* Features */}
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-2 text-gray-700">
              <span className="text-2xl">{t.feature1.split(' ')[0]}</span>
              <span className="text-sm font-medium">{t.feature1.substring(t.feature1.indexOf(' ') + 1)}</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-gray-700">
              <span className="text-2xl">{t.feature2.split(' ')[0]}</span>
              <span className="text-sm font-medium">{t.feature2.substring(t.feature2.indexOf(' ') + 1)}</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-gray-700">
              <span className="text-2xl">{t.feature3.split(' ')[0]}</span>
              <span className="text-sm font-medium">{t.feature3.substring(t.feature3.indexOf(' ') + 1)}</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </section>
  );
}
