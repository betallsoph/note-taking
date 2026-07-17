import { NodeViewWrapper } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import { Key } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

export function DevVaultLinkView({ node, selected }: NodeViewProps) {
  const label =
    (node.attrs.label as string) ||
    (node.attrs.accountId as string) ||
    'Vault entry'

  return (
    <NodeViewWrapper
      as="span"
      className={cn(
        'dev-vault-link inline-flex max-w-full items-center gap-1 rounded-md border border-primary/25 bg-primary/10 px-1.5 py-0.5 align-baseline text-sm font-medium text-primary',
        selected && 'ring-2 ring-ring ring-offset-1',
      )}
      data-dev-vault-link=""
      data-project-id={node.attrs.projectId as string}
      data-account-id={node.attrs.accountId as string}
      data-label={node.attrs.label as string}
      title={`Dev Vault: ${node.attrs.projectId}/${node.attrs.accountId}`}
      contentEditable={false}
    >
      <Key className="h-3.5 w-3.5 shrink-0" weight="duotone" aria-hidden />
      <span className="truncate">{label}</span>
    </NodeViewWrapper>
  )
}
