import { useEffect, useRef, useState } from 'react'
import type { AutosaveStatus } from '@/types/editor'

export function useEditorAutosave(
  content: string,
  onSave: (content: string) => void,
  delay = 1000,
) {
  const [status, setStatus] = useState<AutosaveStatus>('idle')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const resetRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedRef = useRef(content)

  useEffect(() => {
    if (content === lastSavedRef.current) return

    setStatus('pending')
    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(() => {
      setStatus('saving')
      onSave(content)
      lastSavedRef.current = content
      setStatus('saved')
      if (resetRef.current) clearTimeout(resetRef.current)
      resetRef.current = setTimeout(() => setStatus('idle'), 2000)
    }, delay)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [content, delay, onSave])

  return status
}
