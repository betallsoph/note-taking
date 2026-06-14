import { motion, AnimatePresence } from 'motion/react'
import { Card, CardContent } from '@/components/ui/card'
import type { VisualizationStep, RendererType } from '../types'
import { VisualizationRenderer } from '../renderers'

interface VisualizationCanvasProps {
  step: VisualizationStep | null
  rendererType: RendererType
  title: string
}

export function VisualizationCanvas({ step, rendererType, title }: VisualizationCanvasProps) {
  return (
    <Card className="flex min-h-[360px] min-w-0 flex-col">
      <div className="shrink-0 border-b px-6 py-4">
        <h3 className="font-semibold">{step?.title ?? title}</h3>
      </div>
      <CardContent className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step?.id ?? 'empty'}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="w-full"
          >
            <VisualizationRenderer
              state={step?.state}
              rendererType={rendererType}
            />
          </motion.div>
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}
