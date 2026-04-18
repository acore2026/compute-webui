import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

test('usePassiveVideoPeer uses shared ICE configuration instead of an empty candidate list', async () => {
  const testDir = path.dirname(fileURLToPath(import.meta.url))
  const sourcePath = path.join(testDir, '..', 'composables', 'usePassiveVideoPeer.ts')
  const source = await readFile(sourcePath, 'utf8')

  assert.match(source, /buildPassiveVideoRtcConfiguration/)
  assert.doesNotMatch(source, /new RTCPeerConnection\(\{\s*iceServers:\s*\[\s*\]\s*\}\)/)
})
