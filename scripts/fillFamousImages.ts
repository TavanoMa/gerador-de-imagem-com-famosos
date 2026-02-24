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

async function fillImages() {
  for (const famoso of famosos) {
    const { name, slug } = famoso

    console.log(`\n🔍 Processando: ${name}`)

    // 1️⃣ Verificar imagens existentes
    const { data: existing } = await supabase
      .storage
      .from("famous_image")
      .list(slug)

    if (existing && existing.length >= 3) {
      console.log("✅ Já possui 3 imagens. Pulando...")
      continue
    }

    // 2️⃣ Buscar imagens no Bing via SerpAPI
    const serpResponse = await fetch(
      `https://serpapi.com/search.json?engine=bing_images&q=${encodeURIComponent(
        `${name} portrait`
      )}&api_key=${process.env.SERP_API_KEY}`
    )

    const serpData = await serpResponse.json()

    const rawImages =
      serpData.images_results
        ?.map((img: any) => img.original || img.contentUrl || img.image)
        .filter(Boolean) || []

    if (rawImages.length === 0) {
      console.log("❌ Nenhuma imagem encontrada.")
      continue
    }

    let uploaded = 0
    const usedUrls = new Set<string>()

    // 3️⃣ Baixar até conseguir 3 válidas
    for (const imageUrl of rawImages) {
      if (uploaded >= 3) break
      if (usedUrls.has(imageUrl)) continue

      try {
        const imgResponse = await fetch(imageUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0"
          }
        })

        if (!imgResponse.ok) continue

        const contentType =
          imgResponse.headers.get("content-type") || ""

        // Ignorar HTML
        if (!contentType.startsWith("image/")) continue

        const buffer = await imgResponse.arrayBuffer()

        // Ignorar imagens muito pequenas
        if (buffer.byteLength < 40000) continue

        let extension = "jpg"
        if (contentType.includes("png")) extension = "png"
        if (contentType.includes("webp")) extension = "webp"

        const filePath = `${slug}/${uploaded + 1}.${extension}`

        const { error } = await supabase.storage
          .from("famous_image")
          .upload(filePath, buffer, {
            contentType,
            upsert: true
          })

        if (error) continue

        usedUrls.add(imageUrl)
        uploaded++

        console.log(`📸 Upload ${uploaded} feito (${extension})`)

      } catch {
        continue
      }
    }

    if (uploaded < 3) {
      console.log("⚠️ Não conseguiu 3 imagens válidas.")
    }

    // Delay para evitar rate limit
    await new Promise((res) => setTimeout(res, 1500))
  }

  console.log("\n🚀 Finalizado!")
}

fillImages()