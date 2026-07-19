export function contentToPlainText(content: Record<string, unknown> | null): string {
  if (!content) return ''
  const markdown =
    typeof content.markdown === 'string'
      ? content.markdown
      : typeof content.body === 'string'
        ? content.body
        : ''
  return markdown.replace(/[#>*_`\-()[\]]/g, ' ').replace(/\s+/g, ' ').trim()
}

export function contentPreview(content: Record<string, unknown> | null, max = 120): string {
  const plain = contentToPlainText(content)
  if (!plain) return ''
  return plain.length > max ? `${plain.slice(0, max)}…` : plain
}
