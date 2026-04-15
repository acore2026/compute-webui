import { writeFile, mkdir } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'

const ROOT = resolve(process.cwd(), 'data/topology')
const ALLOWED = ['public-cloud', 'core-network'] as const
type ViewId = typeof ALLOWED[number]

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const view = String(q.view || '')
  if (!ALLOWED.includes(view as ViewId)) {
    throw createError({ statusCode: 400, statusMessage: `unknown view: ${view}` })
  }
  const body = await readBody(event)
  const path = resolve(ROOT, `${view}.json`)
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, JSON.stringify(body, null, 2), 'utf-8')
  return { ok: true, view }
})
