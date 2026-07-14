#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { registerTools } from './tools.js'

const server = new McpServer({
  name: 'nngtkhngoc',
  version: '1.0.0',
})

server.registerPrompt(
  'hub_workflow',
  {
    title: 'CS Hub workflow',
    description: 'How to safely use nngtkhngoc with review/approve before writes.',
  },
  async () => ({
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: [
            'You are connected to the nngtkhngoc MCP for the CS Learning Hub app.',
            '',
            'Rules:',
            '1. READ tools (list_*, get_*, search, health_check, get_dashboard) execute immediately.',
            '2. WRITE tools are named propose_* — they ONLY create a pending proposal. They never mutate data.',
            '3. After proposing, show the proposal summary to the user and WAIT for explicit approval.',
            '4. Only then call approve_change(proposal_id) or reject_change(proposal_id).',
            '5. Never call approve_change / approve_all_pending unless the user clearly approved.',
            '6. The API must be running (default http://localhost:3001). Use health_check first if unsure.',
            '',
            'Covered resources: articles, categories, tags, problems/solutions/mistakes, flashcards,',
            'roadmaps/items, and Dev Accounts (projects + credentials).',
          ].join('\n'),
        },
      },
    ],
  }),
)

registerTools(server)

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('nngtkhngoc MCP server running on stdio')
  console.error(`API base: ${process.env.CS_HUB_API_URL ?? 'http://localhost:3001/api'}`)
}

main().catch((error) => {
  console.error('Fatal MCP error:', error)
  process.exit(1)
})
