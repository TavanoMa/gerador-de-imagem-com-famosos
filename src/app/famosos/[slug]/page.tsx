
import { auth } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase-server";
import famosos from "@/src/data/famosos.json";

import PageClient from "@/src/components/PageClient";

const page = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;

  const session = await auth();

  const famoso = famosos.find((f) => f.slug === slug);

  if (!famoso) {
    return <div>Famoso não encontrado</div>;
  }

  let credits: number | undefined;

  if (session?.user?.id) {
    const { data } = await supabaseServer
      .from("profiles")
      .select("credits")
      .eq("id", session.user.id)
      .single();

    credits = data?.credits;
  }

  return (
    <div className="min-h-screen bg-[#252525] text-gray-100">
    <PageClient
      famousName={famoso.name}
      initialCredits={credits}
      isLogged={!!session}
    />
    </div>
    
  );
};

export default page;
