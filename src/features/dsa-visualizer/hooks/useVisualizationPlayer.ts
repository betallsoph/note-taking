import { useState, useEffect, useCallback, useRef } from 'react'
import type { VisualizationStep, SpeedMultiplier } from '../types'
import { BASE_INTERVAL_MS } from '../types'

export function useVisualizationPlayer(steps: VisualizationStep[]) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speedMultiplier, setSpeedMultiplier] = useState<SpeedMultiplier>(1)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const currentStep = steps[currentIndex] ?? null
  const intervalMs = BASE_INTERVAL_MS / speedMultiplier

  const next = useCallback(() => {
    setCurrentIndex((i) => Math.min(i + 1, steps.length - 1))
  }, [steps.length])

  const prev = useCallback(() => {
    setCurrentIndex((i) => Math.max(i - 1, 0))
  }, [])

  const goTo = useCallback(
    (index: number) => {
      setCurrentIndex(Math.max(0, Math.min(index, steps.length - 1)))
    },
    [steps.length],
  )

  const restart = useCallback(() => {
    setCurrentIndex(0)
    setIsPlaying(false)
  }, [])

  const play = useCallback(() => setIsPlaying(true), [])
  const pause = useCallback(() => setIsPlaying(false), [])

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((i) => {
          if (i >= steps.length - 1) {
            setIsPlaying(false)
            return i
          }
          return i + 1
        })
      }, intervalMs)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isPlaying, intervalMs, steps.length])

  useEffect(() => {
    setCurrentIndex(0)
    setIsPlaying(false)
  }, [steps])

  return {
    currentIndex,
    currentStep,
    isPlaying,
    speedMultiplier,
    setSpeedMultiplier,
    next,
    prev,
    goTo,
    restart,
    play,
    pause,
    totalSteps: steps.length,
  }
}
