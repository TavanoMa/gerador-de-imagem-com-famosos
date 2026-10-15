import "server-only"
import sharp from "sharp"
import path from "node:path"

// Aplica a marca d'água repetida (fotocomfamosos.com.br) sobre a imagem limpa.
export async function addWatermark(imageBuffer: Buffer): Promise<Buffer> {
  const metadata = await sharp(imageBuffer).metadata()
  const w = metadata.width || 1024
  const h = metadata.height || 1024
  const fontSize = Math.max(Math.floor(w * 0.04), 22)

  const fontfile = path.join(process.cwd(), "src", "fonts", "arialbd.ttf")

  const stamp = await sharp({
    text: {
      text: `<span size="${fontSize * 1024}" foreground="#ffffff"><b>fotocomfamosos.com.br</b></span>`,
      rgba: true,
      dpi: 72,
      fontfile,
    },
  }).png().toBuffer()

  const rotated = await sharp(stamp)
    .rotate(-30, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .ensureAlpha()
    .png()
    .toBuffer()

  const rMeta = await sharp(rotated).metadata()
  const rw = rMeta.width || 300
  const rh = rMeta.height || 40

  const gapX = Math.floor(w * 0.06)
  const gapY = Math.floor(h * 0.08)
  const stepX = rw + gapX
  const stepY = rh + gapY

  const composites: sharp.OverlayOptions[] = []
  for (let y = 0; y < h; y += stepY) {
    for (let x = 0; x < w; x += stepX) {
      composites.push({ input: rotated, left: x, top: y, blend: "over" })
    }
  }

  return sharp(imageBuffer)
    .composite(composites)
    .png()
    .toBuffer()
}
