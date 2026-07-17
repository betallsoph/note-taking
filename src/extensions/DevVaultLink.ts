import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { DevVaultLinkNodeView } from '@/components/editor/DevVaultLinkNodeView'
import { serializeDevVaultLink } from '@/utils/markdown'

export interface DevVaultLinkAttrs {
  projectId: string
  accountId: string
  label: string
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    devVaultLink: {
      insertDevVaultLink: (attrs: DevVaultLinkAttrs) => ReturnType
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
      projectId: { default: null },
      accountId: { default: null },
      label: { default: 'Vault entry' },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-dev-vault-link]',
        getAttrs: (el) => {
          const element = el as HTMLElement
          return {
            projectId: element.getAttribute('data-project-id'),
            accountId: element.getAttribute('data-account-id'),
            label: element.getAttribute('data-label') ?? element.textContent ?? 'Vault entry',
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
      node.attrs.label,
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(DevVaultLinkNodeView)
  },

  addCommands() {
    return {
      insertDevVaultLink:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs }),
    }
  },

  addStorage() {
    return {
      markdown: {
        serialize(
          state: { write: (s: string) => void },
          node: { attrs: Record<string, string> },
        ) {
          const { projectId, accountId, label } = node.attrs
          state.write(
            serializeDevVaultLink({
              projectId,
              accountId,
              label: String(label),
            }),
          )
        },
      },
    }
  },
})
