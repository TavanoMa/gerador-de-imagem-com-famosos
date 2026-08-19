import Link from "next/link";
import Header from "@/src/components/Header";
import Hero from "@/src/components/Hero";
import FamousGrid from "@/src/components/FamousGrid";
import famosos from "@/src/data/famosos.json";
import { auth } from "@/lib/auth";

const CANDIDATE_IDS = new Set([1087,1088,1089,1090,1091,1092,1093,1094,1095,1096,1097,1098,1099,1100,1101,1102,1103,1104,1105,1106]);

export default async function EnHome() {
  const session = await auth();
  const isLogged = !!session;

  const candidatos = famosos.filter(f => CANDIDATE_IDS.has(f.id));
  const outros = famosos.filter(f => !CANDIDATE_IDS.has(f.id));
  const famososOrdenados = [...candidatos, ...outros];

  return (
    <div className="bg-white text-gray-900 min-h-screen">
      <Header
        title="AI Celebrity Photo Generator"
        isLogged={isLogged}
        locale="en"
        userEmail={session?.user?.email || undefined}
      />

      {/* Hero Section */}
      <Hero locale="en" />

      {/* Famous Grid Section */}
      <FamousGrid famosos={famososOrdenados} locale="en" />
    </div>
  );
}
