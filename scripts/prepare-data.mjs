// Splits the 9.7MB full dataset into a lean browse/search index.
// Full file (with 6-language instructions) stays for lazy detail loading.
// ponytail: one transform, re-runnable; index loads eagerly, full file on demand.
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dataDir = join(root, 'public', 'data')

const full = JSON.parse(readFileSync(join(dataDir, 'exercises.json'), 'utf8'))
if (!Array.isArray(full)) throw new Error('exercises.json is not an array')

const index = full.map((e) => ({
  id: e.id,
  name: e.name,
  body_part: e.body_part ?? e.category,
  equipment: e.equipment,
  target: e.target,
  muscle_group: e.muscle_group,
  secondary_muscles: Array.isArray(e.secondary_muscles) ? e.secondary_muscles : [],
  media_id: e.media_id ?? null,
}))

// sanity: required fields present
const bad = index.filter((e) => !e.id || !e.name)
if (bad.length) throw new Error(`${bad.length} records missing id/name`)

writeFileSync(join(dataDir, 'exercises.index.json'), JSON.stringify(index), 'utf8')
console.log(`Wrote exercises.index.json: ${index.length} records`)
