import { NodeViewWrapper, NodeViewContent } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import {
  ChartLineUp,
  Lightbulb,
  Warning,
  Info,
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import type { CalloutVariant } from '@/types/editor'

const CALLOUT_STYLES: Record<
  CalloutVariant,
  { icon: typeof Info; className: string; label: string }
> = {
  complexity: {
    icon: ChartLineUp,
    className: 'border-primary/30 bg-primary/5',
    label: 'Complexity',
  },
  'interview-tip': {
    icon: Lightbulb,
    className: 'border-amber-500/30 bg-amber-500/10 dark:bg-amber-500/5',
    label: 'Interview Tip',
  },
  warning: {
    icon: Warning,
    className: 'border-destructive/30 bg-destructive/5',
    label: 'Important',
  },
  info: {
    icon: Info,
    className: 'border-blue-500/30 bg-blue-500/10 dark:bg-blue-500/5',
    label: 'Definition',
  },
}

export function CalloutNodeView({ node, updateAttributes, selected }: NodeViewProps) {
  const variant = (node.type.name === 'complexityBlock'
    ? 'complexity'
    : node.type.name === 'interviewTipBlock'
      ? 'interview-tip'
      : node.type.name === 'warningBlock'
        ? 'warning'
        : 'info') as CalloutVariant

  const style = CALLOUT_STYLES[variant]
  const Icon = style.icon

  if (variant === 'complexity') {
    return (
      <NodeViewWrapper
        className={cn(
          'editor-callout my-4 rounded-lg border p-4',
          style.className,
          selected && 'ring-2 ring-ring',
        )}
        data-callout={variant}
      >
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Icon className="h-4 w-4" weight="duotone" />
          {style.label}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span className="text-muted-foreground">Time Complexity</span>
            <input
              className="rounded-md border border-input bg-background px-2 py-1 font-mono text-sm"
              value={node.attrs.timeComplexity as string}
              onChange={(e) => updateAttributes({ timeComplexity: e.target.value })}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-muted-foreground">Space Complexity</span>
            <input
              className="rounded-md border border-input bg-background px-2 py-1 font-mono text-sm"
              value={node.attrs.spaceComplexity as string}
              onChange={(e) => updateAttributes({ spaceComplexity: e.target.value })}
            />
          </label>
        </div>
      </NodeViewWrapper>
    )
  }

  return (
    <NodeViewWrapper
      className={cn(
        'editor-callout my-4 rounded-lg border p-4',
        style.className,
        selected && 'ring-2 ring-ring',
      )}
      data-callout={variant}
    >
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <Icon className="h-4 w-4" weight="duotone" />
        <input
          className="bg-transparent font-semibold outline-none"
          value={node.attrs.title as string}
          onChange={(e) => updateAttributes({ title: e.target.value })}
        />
      </div>
      <NodeViewContent className="prose-callout text-sm leading-relaxed" />
    </NodeViewWrapper>
  )
}
