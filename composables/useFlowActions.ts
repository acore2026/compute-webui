const _simulate = ref<(() => void) | null>(null)
const _reset    = ref<(() => void) | null>(null)
const _hasSeq   = ref(false)
const _hasNodes = ref(false)

export function useFlowActions() {
  return {
    simulate: _simulate,
    reset:    _reset,
    hasSeq:   _hasSeq,
    hasNodes: _hasNodes
  }
}
