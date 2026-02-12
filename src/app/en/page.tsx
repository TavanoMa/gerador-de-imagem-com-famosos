import Link from "next/link";
import Header from "@/src/components/Header";
import Hero from "@/src/components/Hero";
import FamousGrid from "@/src/components/FamousGrid";
import famosos from "@/src/data/famosos.json";
import { auth } from "@/lib/auth";

export default async function EnHome() {
  const session = await auth();
  const isLogged = !!session;

  return (
    <div className="bg-white text-gray-900 min-h-screen">
      <Header 
        title="AI Celebrity Photo Generator" 
        credits={undefined} 
        isLogged={isLogged} 
        locale="en"
        userEmail={session?.user?.email || undefined}
      />
      
      {/* Hero Section */}
      <Hero locale="en" />
      
      {/* Famous Grid Section */}
      <FamousGrid famosos={famosos} locale="en" />
    </div>
  );
}
