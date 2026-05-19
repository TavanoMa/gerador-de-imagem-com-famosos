import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"
import fs from "fs"
import path from "path"

dotenv.config({ path: ".env.local" })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const famososPath = path.join(process.cwd(), "src/data/famosos.json")
const famosos = JSON.parse(fs.readFileSync(famososPath, "utf-8"))

async function fillFamousTable() {
  for (const famoso of famosos) {
    const { name, slug } = famoso

    console.log(`\n🔍 Inserindo: ${name}`)

    // 🔎 Verifica se já existe (evita duplicado)
    const { data: existing } = await supabase
      .from("famous")
      .select("id")
      .eq("slug", slug)
      .maybeSingle()

    if (existing) {
      console.log("⚠️ Já existe. Pulando...")
      continue
    }

    // 📥 Inserir no banco
    const { error } = await supabase
      .from("famous")
      .insert([
        {
          name,
          slug
        }
      ])

    if (error) {
      console.log("❌ Erro ao inserir:", error.message)
      continue
    }

    console.log("✅ Inserido com sucesso")

    // Delay leve (boa prática)
    await new Promise((res) => setTimeout(res, 300))
  }

  console.log("\n🚀 Finalizado!")
}

fillFamousTable()