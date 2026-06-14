import { createCalloutBlock } from './createCalloutBlock'

export const WarningBlock = createCalloutBlock({
  variant: 'warning',
  defaultTitle: 'Important',
  markdownTag: 'warning',
})
