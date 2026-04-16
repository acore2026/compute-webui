const _reset    = ref<(() => void) | null>(null)
const _hasNodes = ref(false)

export function useFlowActions() {
  return {
    reset:    _reset,
    hasNodes: _hasNodes
  }
}
