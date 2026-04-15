import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const ROOT = resolve(process.cwd(), 'data/topology')
const ALLOWED = ['public-cloud', 'core-network'] as const
type ViewId = typeof ALLOWED[number]

const EMPTY = {
  topology: { nodes: [], edges: [] },
  sequence: [],
  legend: { visible: false, items: [] },
  captionTop: 40
}

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const view = String(q.view || '')
  if (!ALLOWED.includes(view as ViewId)) {
    throw createError({ statusCode: 400, statusMessage: `unknown view: ${view}` })
  }
  const path = resolve(ROOT, `${view}.json`)
  try {
    const raw = await readFile(path, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return EMPTY
  }
})
