import { DEFAULT_VIEW, type ViewId } from '~/components/flow/storage'

export function useTopologyView() {
  return useState<ViewId>('topology-active-view', () => DEFAULT_VIEW)
}
