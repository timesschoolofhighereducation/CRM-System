/**
 * Server-side image type validation using magic bytes (file signatures).
 * Do not trust client-provided MIME type.
 */

const SIGNATURES: { mime: string; ext: string; check: (buf: Buffer) => boolean }[] = [
  {
    mime: 'image/jpeg',
    ext: 'jpg',
    check: (buf) => buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff,
  },
  {
    mime: 'image/png',
    ext: 'png',
    check: (buf) =>
      buf.length >= 8 &&
      buf[0] === 0x89 &&
      buf[1] === 0x50 &&
      buf[2] === 0x4e &&
      buf[3] === 0x47 &&
      buf[4] === 0x0d &&
      buf[5] === 0x0a &&
      buf[6] === 0x1a &&
      buf[7] === 0x0a,
  },
  {
    mime: 'image/gif',
    ext: 'gif',
    check: (buf) =>
      buf.length >= 6 &&
      buf[0] === 0x47 &&
      buf[1] === 0x49 &&
      buf[2] === 0x46 &&
      buf[3] === 0x38 &&
      (buf[4] === 0x37 || buf[4] === 0x39) &&
      buf[5] === 0x61,
  },
  {
    mime: 'image/webp',
    ext: 'webp',
    check: (buf) =>
      buf.length >= 12 &&
      buf[0] === 0x52 &&
      buf[1] === 0x49 &&
      buf[2] === 0x46 &&
      buf[3] === 0x46 &&
      buf[8] === 0x57 &&
      buf[9] === 0x45 &&
      buf[10] === 0x42 &&
      buf[11] === 0x50,
  },
]

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const

/**
 * Validate buffer is an allowed image type by magic bytes. Returns detected mime and ext or null.
 */
export function getImageTypeFromBuffer(buffer: Buffer): { mime: string; ext: string } | null {
  if (!buffer || buffer.length < 12) return null
  for (const { mime, ext, check } of SIGNATURES) {
    if (check(buffer)) return { mime, ext }
  }
  return null
}

/**
 * Validate a File is an allowed image by content. Returns detected type or null.
 */
export async function validateImageFile(file: File): Promise<{ mime: string; ext: string } | null> {
  const buf = Buffer.from(await file.arrayBuffer())
  return getImageTypeFromBuffer(buf)
}
