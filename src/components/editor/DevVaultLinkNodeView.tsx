import { NodeViewWrapper } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import { Key } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

export function DevVaultLinkNodeView({ node, selected }: NodeViewProps) {
  const { projectId, accountId, label } = node.attrs as {
    projectId: string
    accountId: string
    label: string
  }

  return (
    <NodeViewWrapper as="span" className="inline">
      <button
        type="button"
        contentEditable={false}
        className={cn(
          'dev-vault-link-chip inline-flex items-center gap-1 rounded-md border border-primary/25 bg-primary/10 px-1.5 py-0.5 align-baseline text-sm font-medium text-primary transition-colors hover:bg-primary/15',
          selected && 'ring-2 ring-ring',
        )}
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          window.dispatchEvent(
            new CustomEvent('dev-vault-link-click', {
              detail: { projectId, accountId, label },
            }),
          )
        }}
        title="Open Dev Vault entry"
      >
        <Key className="h-3.5 w-3.5 shrink-0" weight="duotone" />
        <span>{label}</span>
      </button>
    </NodeViewWrapper>
  )
}
