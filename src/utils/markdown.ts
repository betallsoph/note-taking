import type { Editor } from '@tiptap/core'

declare module '@tiptap/core' {
  interface Storage {
    markdown: {
      getMarkdown(): string
    }
  }
}

/** Read markdown from TipTap editor storage. */
export function getEditorMarkdown(editor: Editor): string {
  return editor.storage.markdown.getMarkdown()
}

/** Normalize stored article/content payloads to markdown string. */
export function contentToMarkdown(content: unknown): string {
  if (typeof content === 'string') return content
  if (content && typeof content === 'object') {
    const record = content as Record<string, unknown>
    if (typeof record.markdown === 'string') return record.markdown
    if (typeof record.body === 'string') return record.body
  }
  return ''
}

/** Wrap markdown for jsonb storage. */
export function markdownToContent(markdown: string): { markdown: string } {
  return { markdown }
}

const CALLOUT_RE =
  /^::: ([\w-]+)\n([\s\S]*?)\n:::\s*$/gm

/** Inline Dev Vault link: [[vault:PROJECT_ID/ACCOUNT_ID|Label]] */
export const DEV_VAULT_LINK_MARKDOWN_RE =
  /\[\[vault:([^/\]]+)\/([^|\]]+)(?:\|([^\]]+))?\]\]/g

export interface DevVaultLinkMarkdown {
  projectId: string
  accountId: string
  label: string
}

function escapeHtmlAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/** Serialize a Dev Vault link node to markdown. */
export function serializeDevVaultLink({
  projectId,
  accountId,
  label,
}: DevVaultLinkMarkdown): string {
  const suffix = label ? `|${label}` : ''
  return `[[vault:${projectId}/${accountId}${suffix}]]`
}

/** Convert Dev Vault wiki links to HTML spans for TipTap import. */
export function devVaultLinksToHtml(markdown: string): string {
  return markdown.replace(
    DEV_VAULT_LINK_MARKDOWN_RE,
    (_match, projectId: string, accountId: string, label?: string) => {
      const displayLabel = label ?? ''
      return `<span data-dev-vault-link data-project-id="${escapeHtmlAttribute(projectId)}" data-account-id="${escapeHtmlAttribute(accountId)}" data-label="${escapeHtmlAttribute(displayLabel)}" class="dev-vault-link"></span>`
    },
  )
}

/** Convert custom callout fences to HTML for TipTap import (storage stays markdown). */
export function preprocessMarkdownForEditor(markdown: string): string {
  const withVaultLinks = devVaultLinksToHtml(markdown)
  return withVaultLinks.replace(CALLOUT_RE, (_match, tag: string, body: string) => {
    const lines = body.trim().split('\n')
    if (tag === 'complexity') {
      const time = lines.find((l) => l.startsWith('time:'))?.slice(5).trim() ?? 'O(n)'
      const space = lines.find((l) => l.startsWith('space:'))?.slice(6).trim() ?? 'O(1)'
      return `<div data-callout="complexity" data-time="${time}" data-space="${space}"></div>\n\n`
    }
    const variant =
      tag === 'interview-tip' ? 'interview-tip' : tag === 'warning' ? 'warning' : 'info'
    const title =
      variant === 'interview-tip'
        ? 'Interview Tip'
        : variant === 'warning'
          ? 'Important'
          : 'Definition'
    return `<div data-callout="${variant}" data-title="${title}">${body.trim()}</div>\n\n`
  })
}
