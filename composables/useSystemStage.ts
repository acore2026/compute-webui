export function useSystemStage() {
  return useState<string>('system-current-stage', () => 'INIT')
}
