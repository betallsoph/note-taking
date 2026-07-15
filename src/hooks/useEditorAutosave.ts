import { useEffect, useRef, useState } from 'react'
import type { AutosaveStatus } from '@/types/editor'

type SaveHandler = (content: string) => void | Promise<void>

export function useEditorAutosave(
  content: string,
  onSave: SaveHandler,
  delay = 1000,
) {
  const [status, setStatus] = useState<AutosaveStatus>('idle')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const resetRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedRef = useRef(content)
  const onSaveRef = useRef(onSave)
  const saveGenRef = useRef(0)
  onSaveRef.current = onSave

  useEffect(() => {
    if (content === lastSavedRef.current) return

    setStatus('pending')
    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(() => {
      const snapshot = content
      const gen = ++saveGenRef.current
      setStatus('saving')

      Promise.resolve(onSaveRef.current(snapshot))
        .then(() => {
          if (gen !== saveGenRef.current) return
          lastSavedRef.current = snapshot
          setStatus('saved')
          if (resetRef.current) clearTimeout(resetRef.current)
          resetRef.current = setTimeout(() => {
            if (gen === saveGenRef.current) setStatus('idle')
          }, 2000)
        })
        .catch(() => {
          if (gen !== saveGenRef.current) return
          setStatus('error')
        })
    }, delay)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [content, delay])

  return status
}
