import { writeFile, mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { randomUUID } from 'node:crypto'

const UPLOAD_DIR = resolve(process.cwd(), 'public/assets/uploads')

export default defineEventHandler(async (event) => {
  const formData = await readMultipartFormData(event)
  if (!formData || formData.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'no file uploaded' })
  }

  const file = formData[0]
  if (!file.type?.startsWith('image/')) {
    throw createError({ statusCode: 400, statusMessage: 'only image files allowed' })
  }

  // 生成唯一文件名，保留原始扩展名
  const ext = (file.filename || '').split('.').pop() || 'png'
  const filename = `${randomUUID().slice(0, 8)}.${ext}`

  await mkdir(UPLOAD_DIR, { recursive: true })
  await writeFile(resolve(UPLOAD_DIR, filename), file.data)

  return {
    ok: true,
    url: `/assets/uploads/${filename}`
  }
})
