import { NextResponse } from "next/server";
import OpenAI, { toFile } from "openai";
import { auth } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase-server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const formData = await req.formData();

    const prompt = formData.get("prompt") as string | null;
    const images = formData.getAll("images") as File[];

    if (
      !prompt ||
      images.length === 0 ||
      images.some((img) => !img || img.size === 0)
    ) {
      return NextResponse.json(
        { error: "Arquivos de imagem inválidos" },
        { status: 400 },
      );
    }

    const { data: profile } = await supabaseServer
      .from("profiles")
      .select("credits")
      .eq("id", session.user.id)
      .single();

    if (!profile || profile.credits <= 0) {
      return NextResponse.json({ error: "Sem créditos" }, { status: 403 });
    }

    const imageFiles = [];

    for (let i = 0; i < images.length; i++) {
      const img = images[i];

      if (!img || img.size === 0) {
        return NextResponse.json(
          { error: "Imagem inválida enviada" },
          { status: 400 },
        );
      }

      const buffer = Buffer.from(await img.arrayBuffer());

      imageFiles.push(
        await toFile(buffer, `image-${i}.png`, {
          type: img.type || "image/png",
        }),
      );
    }

    const result = await openai.images.edit({
      model: "gpt-image-1.5",
      image: imageFiles,
      prompt,
      size: "auto",
    });

    const newCredits = profile.credits - 1;

    await supabaseServer
      .from("profiles")
      .update({ credits: newCredits })
      .eq("id", session.user.id);

    if (!result.data || result.data.length === 0) {
      return NextResponse.json(
        { error: "Falha ao gerar imagem" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      image: result.data[0].b64_json,
      credits: newCredits,
    });
  } catch (err: any) {
    console.error("GENERATE IMAGE ERROR:", err?.message || err);
    return NextResponse.json(
      { error: err?.message || "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
