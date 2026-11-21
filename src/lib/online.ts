import { useSyncExternalStore } from 'react'

function assinar(callback: () => void) {
  window.addEventListener('online', callback)
  window.addEventListener('offline', callback)
  return () => {
    window.removeEventListener('online', callback)
    window.removeEventListener('offline', callback)
  }
}

/** `false` quando o navegador está sem internet. Usado para bloquear gravações (PLANO §5.2). */
export function useOnline(): boolean {
  return useSyncExternalStore(
    assinar,
    () => navigator.onLine,
    () => true,
  )
}
