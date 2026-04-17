import test from 'node:test'
import assert from 'node:assert/strict'

import { buildPublishedOfferDescription } from '../composables/passiveVideoOffer'

type LocalDescriptionLike = {
  type?: string
  sdp?: string | null
}

type FakePeerConnection = {
  iceGatheringState: string
  localDescription: LocalDescriptionLike | null
  addEventListener: (event: string, listener: () => void) => void
  removeEventListener: (event: string, listener: () => void) => void
}

function createFakePeerConnection(initial: {
  iceGatheringState?: string
  localDescription?: LocalDescriptionLike | null
}) {
  let listener: (() => void) | null = null
  const pc: FakePeerConnection = {
    iceGatheringState: initial.iceGatheringState ?? 'new',
    localDescription: initial.localDescription ?? null,
    addEventListener(event, nextListener) {
      if (event === 'icegatheringstatechange') {
        listener = nextListener
      }
    },
    removeEventListener(event, nextListener) {
      if (event === 'icegatheringstatechange' && listener === nextListener) {
        listener = null
      }
    }
  }

  return {
    pc,
    complete(nextDescription?: LocalDescriptionLike | null) {
      pc.iceGatheringState = 'complete'
      if (nextDescription !== undefined) {
        pc.localDescription = nextDescription
      }
      listener?.()
    }
  }
}

test('returns gathered localDescription immediately when ICE is already complete', async () => {
  const fallbackOffer = { type: 'offer', sdp: 'fallback-offer' }
  const { pc } = createFakePeerConnection({
    iceGatheringState: 'complete',
    localDescription: { type: 'offer', sdp: 'gathered-offer' }
  })

  const description = await buildPublishedOfferDescription(pc as never, fallbackOffer, 10)

  assert.deepEqual(description, { type: 'offer', sdp: 'gathered-offer' })
})

test('waits for ICE gathering and prefers the final localDescription over the initial offer', async () => {
  const fallbackOffer = { type: 'offer', sdp: 'fallback-offer' }
  const { pc, complete } = createFakePeerConnection({
    iceGatheringState: 'gathering',
    localDescription: { type: 'offer', sdp: 'gathering-offer' }
  })

  const promise = buildPublishedOfferDescription(pc as never, fallbackOffer, 50)
  queueMicrotask(() => {
    complete({ type: 'offer', sdp: 'final-offer-with-candidates' })
  })

  const description = await promise

  assert.deepEqual(description, { type: 'offer', sdp: 'final-offer-with-candidates' })
})

test('falls back to the latest localDescription when ICE gathering does not complete before timeout', async () => {
  const fallbackOffer = { type: 'offer', sdp: 'fallback-offer' }
  const { pc } = createFakePeerConnection({
    iceGatheringState: 'gathering',
    localDescription: { type: 'offer', sdp: 'best-effort-offer' }
  })

  const description = await buildPublishedOfferDescription(pc as never, fallbackOffer, 5)

  assert.deepEqual(description, { type: 'offer', sdp: 'best-effort-offer' })
})
