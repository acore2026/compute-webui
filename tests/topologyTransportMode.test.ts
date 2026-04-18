import test from 'node:test'
import assert from 'node:assert/strict'

import {
  fetchTransportModeFromSandboxHealth,
  resolveTopologyViewFromBackendState,
  syncTransportModeForTopologyView,
  transportModeForTopologyView
} from '../composables/topologyTransportMode'

test('transportModeForTopologyView maps core-network to ACN and public-cloud to OTT', () => {
  assert.equal(transportModeForTopologyView('core-network'), 'ACN')
  assert.equal(transportModeForTopologyView('public-cloud'), 'OTT')
})

test('resolveTopologyViewFromBackendState keeps core-network outside MEDIA_ESTABLISHED', () => {
  assert.equal(resolveTopologyViewFromBackendState('COMPUTING', 'OTT'), 'core-network')
  assert.equal(resolveTopologyViewFromBackendState('INIT', 'ACN'), 'core-network')
})

test('resolveTopologyViewFromBackendState follows transport mode during MEDIA_ESTABLISHED', () => {
  assert.equal(resolveTopologyViewFromBackendState('MEDIA_ESTABLISHED', 'OTT'), 'public-cloud')
  assert.equal(resolveTopologyViewFromBackendState('MEDIA_ESTABLISHED', 'ACN'), 'core-network')
  assert.equal(resolveTopologyViewFromBackendState('MEDIA_ESTABLISHED', 'SATELLITE'), 'core-network')
})

test('syncTransportModeForTopologyView posts the mapped transport mode to sandbox', async () => {
  let calledUrl = ''
  let calledBody = ''

  const mode = await syncTransportModeForTopologyView('public-cloud', {
    backendUrl: (path) => `http://sandbox.local${path}`,
    traceCall: async (_label, _url, run) => await run(),
    fetchImpl: async (url, init) => {
      calledUrl = String(url)
      calledBody = String(init?.body || '')
      return new Response(JSON.stringify({ ok: true, transportMode: 'OTT', ottInjectedMs: 110 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  })

  assert.equal(mode, 'OTT')
  assert.equal(calledUrl, 'http://sandbox.local/api/v1/transport_mode')
  assert.match(calledBody, /"transportMode":"OTT"/)
})

test('fetchTransportModeFromSandboxHealth falls back to ACN when payload is missing', async () => {
  const mode = await fetchTransportModeFromSandboxHealth({
    backendUrl: (path) => `http://sandbox.local${path}`,
    traceCall: async (_label, _url, run) => await run(),
    fetchImpl: async () => new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  })

  assert.equal(mode, 'ACN')
})
