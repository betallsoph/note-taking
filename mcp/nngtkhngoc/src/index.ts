#!/usr/bin/env node
import 'dotenv/config'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { isDatabaseEnabled } from '../../../server/db/repositories.js'
import { registerTools } from './tools.js'

const server = new McpServer({
  name: 'nngtkhngoc',
  version: '1.0.0',
})

server.registerPrompt(
  'hub_workflow',
  {
    title: 'CS Hub review/approve workflow',
    description: 'How nngtkhngoc must propose mutations and wait for user approval.',
  },
  async () => ({
    messages: [
      {
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: [
            'You are connected to the nngtkhngoc MCP for the CS Learning Hub.',
            '',
            'Rules:',
            '1. READ tools (list_*, get_*, search, get_dashboard) run immediately against Neon.',
            '2. WRITE tools are propose_* only — they create pending proposals and NEVER mutate data.',
            '3. After proposing, show the proposal and WAIT for explicit user approval.',
            '4. Only then call approve_change(proposal_id) or reject_change(proposal_id).',
            '5. Never call approve_change / approve_all_pending unless the user clearly approved.',
            '6. DATABASE_URL must be set; this MCP does not use the in-memory mock store.',
          ].join('\n'),
        },
      },
    ],
  }),
)

registerTools(server)

async function main() {
  if (!isDatabaseEnabled()) {
    throw new Error(
      'DATABASE_URL is required. nngtkhngoc MCP only reads/writes persistent Neon data.',
    )
  }

  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('nngtkhngoc MCP server running on stdio')
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
