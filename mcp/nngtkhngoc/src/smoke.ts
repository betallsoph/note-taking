import { apiRequest } from './client.js'
import { approveProposal, createProposal, formatProposal, listPending } from './pending.js'

async function main() {
  const health = await apiRequest('/health')
  console.log('health', health)

  const proposal = createProposal({
    summary: 'Create flashcard smoke test',
    resource: 'flashcard',
    action: 'create',
    method: 'POST',
    path: '/flashcards',
    body: {
      category: 'DB',
      question: 'MCP smoke?',
      answer: 'yes',
      difficulty: 'easy',
    },
  })
  console.log('---PROPOSAL---')
  console.log(formatProposal(proposal))
  console.log('pending count', listPending().length)

  const executed = await approveProposal(proposal.id)
  console.log('---EXECUTED---')
  console.log(JSON.stringify(executed, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
