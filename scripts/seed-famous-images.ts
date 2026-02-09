// scripts/seed-famous-images.ts
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'
import fetch from 'node-fetch'

/* ================= CONFIG ================= */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const BUCKET_NAME = 'famous_image'

const IMAGES_REQUIRED = 3      // quantas imagens boas queremos
const IMAGES_TO_FETCH = 8      // quantas vamos buscar para garantir
const REQUEST_DELAY = 1200     // ms entre famosos

/* ================= SUPABASE ================= */

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
)

/* ================= WIKIMEDIA SEARCH ================= */

async function searchImages(query: string): Promise<string[]> {
  const url =
    `https://commons.wikimedia.org/w/api.php` +
    `?action=query` +
    `&format=json` +
    `&origin=*` +
    `&generator=search` +
    `&gsrsearch=${encodeURIComponent(query)}` +
    `&gsrlimit=${IMAGES_TO_FETCH}` +
    `&gsrnamespace=6` +
    `&prop=imageinfo` +
    `&iiprop=url`

  const res = await fetch(url)
  const data = await res.json() as any

  if (!data.query?.pages) return []

  return Object.values(data.query.pages)
    .map((page: any) => page.imageinfo?.[0]?.url)
    .filter((url: string) =>
      url &&
      !url.endsWith('.svg') &&
      !url.toLowerCase().includes('logo')
    )
}

/* ================= IMAGE DOWNLOAD + UPLOAD ================= */

async function uploadImage(imageUrl: string, path: string): Promise<boolean> {
  const res = await fetch(imageUrl, {
    headers: {
      'User-Agent': 'FamousImageSeeder/1.0 (https://localhost)'
    }
  })

  if (!res.ok) {
    console.warn(`⚠️ Download falhou: ${imageUrl}`)
    return false
  }

  const buffer = await res.arrayBuffer()

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, Buffer.from(buffer), {
      contentType: 'image/jpeg',
      upsert: true
    })

  if (error) {
    console.warn(`⚠️ Upload falhou: ${path}`, error.message)
    return false
  }

  return true
}

/* ================= MAIN ================= */

async function main() {
  const { data: famosos, error } = await supabase
    .from('famous')
    .select('id, name, slug')

  if (error) throw error
  if (!famosos || famosos.length === 0) {
    console.log('⚠️ Nenhum famoso encontrado')
    return
  }

  for (const famoso of famosos) {
    console.log(`📸 Processando: ${famoso.name}`)

    const query = `${famoso.name} portrait photograph`
    let savedCount = 0
    let attempt = 0

    try {
      const images = await searchImages(query)

      if (images.length === 0) {
        console.log('⚠️ Nenhuma imagem encontrada')
        continue
      }

      while (savedCount < IMAGES_REQUIRED && attempt < images.length) {
        const imageUrl = images[attempt]
        const imagePath = `${famoso.slug}/${savedCount + 1}.jpg`

        attempt++

        const success = await uploadImage(imageUrl, imagePath)
        if (!success) continue

        await supabase.from('famous_images').insert({
          famous_id: famoso.id,
          image_path: imagePath,
          image_order: savedCount + 1
        })

        savedCount++
        console.log(`✅ ${imagePath}`)
      }

      if (savedCount < IMAGES_REQUIRED) {
        console.log(
          `⚠️ Apenas ${savedCount}/${IMAGES_REQUIRED} imagens salvas`
        )
      }
    } catch (err) {
      console.error(`❌ Erro em ${famoso.name}`, err)
    }

    await new Promise(r => setTimeout(r, REQUEST_DELAY))
  }

  console.log('🎉 Seed finalizado')
}

/* ================= START ================= */

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Erro fatal:', err)
    process.exit(1)
  })
