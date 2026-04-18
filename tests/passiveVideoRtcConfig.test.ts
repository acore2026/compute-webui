import test from 'node:test'
import assert from 'node:assert/strict'

import {
  DEFAULT_PASSIVE_VIDEO_ICE_SERVER_URLS,
  LOCALHOST_PASSIVE_VIDEO_ICE_SERVERS,
  buildPassiveVideoRtcConfiguration
} from '../composables/passiveVideoRtcConfig'

test('buildPassiveVideoRtcConfiguration uses localhost TURN when the passive video page runs on localhost', () => {
  assert.deepEqual(DEFAULT_PASSIVE_VIDEO_ICE_SERVER_URLS, [
    'stun:stun.l.google.com:19302',
    'stun:stun1.l.google.com:19302'
  ])

  assert.deepEqual(LOCALHOST_PASSIVE_VIDEO_ICE_SERVERS, [
    { urls: 'stun:127.0.0.1:3478' },
    {
      urls: 'turn:127.0.0.1:3478?transport=udp',
      username: 'sandboxdemo',
      credential: 'sandboxdemo'
    }
  ])

  const configuration = buildPassiveVideoRtcConfiguration('localhost')

  assert.deepEqual(configuration, {
    iceServers: [
      { urls: 'stun:127.0.0.1:3478' },
      {
        urls: 'turn:127.0.0.1:3478?transport=udp',
        username: 'sandboxdemo',
        credential: 'sandboxdemo'
      },
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  })
})

test('buildPassiveVideoRtcConfiguration falls back to shared public STUN servers away from localhost', () => {
  const configuration = buildPassiveVideoRtcConfiguration('example.com')

  assert.deepEqual(configuration, {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  })
})
