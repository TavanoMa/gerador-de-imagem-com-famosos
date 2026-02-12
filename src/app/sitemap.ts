import { MetadataRoute } from 'next'
import famosos from '@/src/data/famosos.json'

export default function sitemap(): MetadataRoute.Sitemap {
  // Use environment variable or fallback to a placeholder
  // The placeholder will be replaced by the actual domain at runtime if needed
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : 'https://localhost:3000'
  
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
    },
    {
      url: `${baseUrl}/en`,
      lastModified: new Date(),
      changeFrequency: 'daily',
    },
  ]

  // Add all Portuguese famous person routes
  famosos.forEach((famoso) => {
    routes.push({
      url: `${baseUrl}/image/${famoso.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
    })
  })

  // Add all English famous person routes
  famosos.forEach((famoso) => {
    routes.push({
      url: `${baseUrl}/en/image/${famoso.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
    })
  })

  return routes
}
