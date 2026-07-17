import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { DevVaultLinkView } from '@/components/editor/DevVaultLinkView'
import { serializeDevVaultLink } from '@/utils/markdown'

export interface DevVaultLinkAttributes {
  projectId: string
  accountId: string
  label: string
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    devVaultLink: {
      insertDevVaultLink: (attrs: DevVaultLinkAttributes) => ReturnType
    }
  }
}

export const DevVaultLink = Node.create({
  name: 'devVaultLink',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      projectId: { default: '' },
      accountId: { default: '' },
      label: { default: '' },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-dev-vault-link]',
        getAttrs: (el) => {
          const element = el as HTMLElement
          return {
            projectId: element.getAttribute('data-project-id') ?? '',
            accountId: element.getAttribute('data-account-id') ?? '',
            label: element.getAttribute('data-label') ?? '',
          }
        },
      },
    ]
  },

  renderHTML({ HTMLAttributes, node }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-dev-vault-link': '',
        'data-project-id': node.attrs.projectId,
        'data-account-id': node.attrs.accountId,
        'data-label': node.attrs.label,
        class: 'dev-vault-link',
      }),
      node.attrs.label || node.attrs.accountId || 'Vault',
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(DevVaultLinkView, { as: 'span' })
  },

  addCommands() {
    return {
      insertDevVaultLink:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs,
          }),
    }
  },

  addStorage() {
    return {
      markdown: {
        serialize(
          state: { write: (s: string) => void },
          node: { attrs: DevVaultLinkAttributes },
        ) {
          state.write(
            serializeDevVaultLink({
              projectId: node.attrs.projectId,
              accountId: node.attrs.accountId,
              label: node.attrs.label,
            }),
          )
        },
        parse: {
          // Imported via preprocessMarkdownForEditor HTML fallback.
        },
      },
    }
  },
})
