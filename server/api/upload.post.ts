import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const ASSET_DIR = resolve(process.cwd(), 'public/assets')
const FIXED_IMAGE_NAME = 'unitree-robotdog.png'
const FIXED_IMAGE_URL = `/assets/${FIXED_IMAGE_NAME}`

export default defineEventHandler(async (event) => {
  const formData = await readMultipartFormData(event)
  if (!formData || formData.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'no file uploaded' })
  }

  const file = formData[0]
  if (!file.type?.startsWith('image/')) {
    throw createError({ statusCode: 400, statusMessage: 'only image files allowed' })
  }

  await mkdir(ASSET_DIR, { recursive: true })
  await writeFile(resolve(ASSET_DIR, FIXED_IMAGE_NAME), file.data)

  return {
    ok: true,
    url: FIXED_IMAGE_URL
  }
})
