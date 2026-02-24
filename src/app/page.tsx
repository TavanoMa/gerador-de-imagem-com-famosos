
import Link from "next/link";
import Header from "../components/Header";
import Hero from "../components/Hero";
import FamousGrid from "../components/FamousGrid";
import famosos from "@/src/data/famosos.json";
import { auth } from "@/lib/auth";


export default async function Home() {

   const session = await auth();

   const isLogged = !!session

   console.log(famosos.length)

  return (
    <div className="bg-white text-gray-900 min-h-screen">
      <Header 
        title="Gerador de Imagens com Famosos" 
        credits={undefined} 
        isLogged={isLogged} 
        locale="pt"
        userEmail={session?.user?.email || undefined}
      />
      
      {/* Hero Section */}
      <Hero locale="pt" />
      
      {/* Famous Grid Section */}
      <FamousGrid famosos={famosos} locale="pt" />
    </div>
  );
}
