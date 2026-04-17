export type SessionDescriptionLike = {
  type?: string
  sdp?: string | null
}

type GatheringPeerConnection = {
  iceGatheringState: string
  localDescription: SessionDescriptionLike | null
  addEventListener: (event: 'icegatheringstatechange', listener: () => void) => void
  removeEventListener: (event: 'icegatheringstatechange', listener: () => void) => void
}

function normalizeDescription(
  description: SessionDescriptionLike | null | undefined,
  fallback: SessionDescriptionLike
): { type: string; sdp: string } {
  return {
    type: String(description?.type || fallback.type),
    sdp: String(description?.sdp || fallback.sdp || '')
  }
}

export async function buildPublishedOfferDescription(
  pc: GatheringPeerConnection,
  fallbackOffer: SessionDescriptionLike,
  timeoutMs: number
): Promise<{ type: string; sdp: string }> {
  if (pc.iceGatheringState === 'complete') {
    return normalizeDescription(pc.localDescription, fallbackOffer)
  }

  await new Promise<void>((resolve) => {
    let settled = false
    let timeoutHandle: ReturnType<typeof setTimeout> | null = null

    const finish = () => {
      if (settled) return
      settled = true
      if (timeoutHandle) {
        clearTimeout(timeoutHandle)
        timeoutHandle = null
      }
      pc.removeEventListener('icegatheringstatechange', onStateChange)
      resolve()
    }

    const onStateChange = () => {
      if (pc.iceGatheringState === 'complete') {
        finish()
      }
    }

    pc.addEventListener('icegatheringstatechange', onStateChange)
    timeoutHandle = setTimeout(finish, timeoutMs)
  })

  return normalizeDescription(pc.localDescription, fallbackOffer)
}
