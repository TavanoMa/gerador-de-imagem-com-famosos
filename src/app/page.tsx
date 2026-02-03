
import Link from "next/link";
import Header from "../components/Header";
import famosos from "@/src/data/famosos.json";
import { auth } from "@/lib/auth";


export default async function Home() {

   const session = await auth();

   const isLogged = !!session

  return (
    <div className="bg-[#252525] text-gray-100">
      <Header title="Gerador de Imagens com Famosos" credits={undefined} isLogged={isLogged}/>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-semibold mb-6 text-center">
          Selecione o famoso
        </h2>
        
        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {famosos.map((famoso) => (
            <li key={famoso.id}>
              <Link
                href={`/famosos/${famoso.slug}`}
                className="block bg-[#2e2e2e] rounded-xl p-4 text-center font-medium transition hover:bg-[#3a3a3a] hover:scale-[1.03]  hover:shadow-lg"
              >
                {famoso.name}
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
