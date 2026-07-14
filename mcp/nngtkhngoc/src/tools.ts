import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { apiRequest, errorResult, jsonResult } from './client.js'
import { approveProposal, createProposal, formatProposal, getPending, listPending, rejectProposal } from './pending.js'

function propose(
  summary: string,
  resource: string,
  action: string,
  method: 'POST' | 'PUT' | 'DELETE',
  path: string,
  body?: unknown,
) {
  const change = createProposal({ summary, resource, action, method, path, body })
  return {
    content: [{ type: 'text' as const, text: formatProposal(change) }],
  }
}

const articleStatus = z.enum(['not_started', 'learning', 'completed', 'need_review'])
const difficulty = z.enum(['easy', 'medium', 'hard'])
const roadmapItemStatus = z.enum(['not_started', 'in_progress', 'completed'])
const mistakeType = z.enum(['wrong_answer', 'tle', 'mle', 'logic_error'])
const reviewRating = z.enum(['again', 'hard', 'good', 'easy'])

export function registerTools(server: McpServer) {
  // ── Review / approve ──────────────────────────────────────────────
  server.registerTool(
    'list_pending_changes',
    {
      title: 'List pending changes',
      description:
        'List mutation proposals waiting for user approval. Pass include_closed=true to also see executed/rejected.',
      inputSchema: {
        include_closed: z.boolean().optional().describe('Include non-pending changes'),
      },
    },
    async ({ include_closed }) => {
      try {
        return jsonResult(listPending(Boolean(include_closed)))
      } catch (error) {
        return errorResult(error)
      }
    },
  )

  server.registerTool(
    'get_pending_change',
    {
      title: 'Get pending change',
      description: 'Get one proposal by id.',
      inputSchema: { proposal_id: z.string() },
    },
    async ({ proposal_id }) => {
      const change = getPending(proposal_id)
      if (!change) return errorResult(`Pending change not found: ${proposal_id}`)
      return jsonResult(change)
    },
  )

  server.registerTool(
    'approve_change',
    {
      title: 'Approve change',
      description:
        'ONLY call after the user explicitly approved. Executes the pending mutation against the CS Hub API.',
      inputSchema: { proposal_id: z.string() },
      annotations: { destructiveHint: true },
    },
    async ({ proposal_id }) => {
      try {
        const result = await approveProposal(proposal_id)
        return jsonResult({
          message:
            result.status === 'executed'
              ? 'Approved and executed.'
              : `Finished with status=${result.status}`,
          change: result,
        })
      } catch (error) {
        return errorResult(error)
      }
    },
  )

  server.registerTool(
    'reject_change',
    {
      title: 'Reject change',
      description: 'Discard a pending mutation proposal without executing it.',
      inputSchema: { proposal_id: z.string() },
    },
    async ({ proposal_id }) => {
      try {
        return jsonResult(rejectProposal(proposal_id))
      } catch (error) {
        return errorResult(error)
      }
    },
  )

  server.registerTool(
    'approve_all_pending',
    {
      title: 'Approve all pending',
      description:
        'ONLY after explicit user approval of ALL pending items. Executes every pending proposal in order.',
      annotations: { destructiveHint: true },
    },
    async () => {
      try {
        const pending = listPending(false)
        const results = []
        for (const item of pending) {
          results.push(await approveProposal(item.id))
        }
        return jsonResult({ count: results.length, results })
      } catch (error) {
        return errorResult(error)
      }
    },
  )

  server.registerTool(
    'reject_all_pending',
    {
      title: 'Reject all pending',
      description: 'Discard every pending mutation proposal.',
    },
    async () => {
      try {
        const pending = listPending(false)
        const results = pending.map((item) => rejectProposal(item.id))
        return jsonResult({ count: results.length, results })
      } catch (error) {
        return errorResult(error)
      }
    },
  )

  // ── Reads (execute immediately) ───────────────────────────────────
  server.registerTool('health_check', { description: 'Check CS Hub API health.' }, async () => {
    try {
      return jsonResult(await apiRequest('/health'))
    } catch (error) {
      return errorResult(error)
    }
  })

  server.registerTool('get_me', { description: 'Get the current mock auth user.' }, async () => {
    try {
      return jsonResult(await apiRequest('/auth/me'))
    } catch (error) {
      return errorResult(error)
    }
  })

  server.registerTool('get_dashboard', { description: 'Get dashboard stats.' }, async () => {
    try {
      return jsonResult(await apiRequest('/dashboard'))
    } catch (error) {
      return errorResult(error)
    }
  })

  server.registerTool(
    'search',
    {
      description: 'Search articles, problems, and flashcards.',
      inputSchema: { q: z.string().min(1) },
    },
    async ({ q }) => {
      try {
        return jsonResult(await apiRequest('/simulations/search', { query: { q } }))
      } catch (error) {
        return errorResult(error)
      }
    },
  )

  server.registerTool(
    'list_articles',
    {
      description: 'List knowledge articles (non-archived).',
      inputSchema: {
        category: z.string().optional(),
        status: articleStatus.optional(),
        tag: z.string().optional(),
        search: z.string().optional(),
      },
    },
    async (args) => {
      try {
        return jsonResult(await apiRequest('/articles', { query: args }))
      } catch (error) {
        return errorResult(error)
      }
    },
  )

  server.registerTool(
    'get_article',
    {
      description: 'Get one article by id.',
      inputSchema: { id: z.string() },
    },
    async ({ id }) => {
      try {
        return jsonResult(await apiRequest(`/articles/${id}`))
      } catch (error) {
        return errorResult(error)
      }
    },
  )

  server.registerTool('list_categories', { description: 'List categories.' }, async () => {
    try {
      return jsonResult(await apiRequest('/categories'))
    } catch (error) {
      return errorResult(error)
    }
  })

  server.registerTool('list_tags', { description: 'List tags.' }, async () => {
    try {
      return jsonResult(await apiRequest('/tags'))
    } catch (error) {
      return errorResult(error)
    }
  })

  server.registerTool(
    'list_problems',
    {
      description: 'List coding problems.',
      inputSchema: {
        difficulty: difficulty.optional(),
        tag: z.string().optional(),
        search: z.string().optional(),
      },
    },
    async (args) => {
      try {
        return jsonResult(await apiRequest('/problems', { query: args }))
      } catch (error) {
        return errorResult(error)
      }
    },
  )

  server.registerTool(
    'get_problem',
    {
      description: 'Get a problem with solutions and mistakes.',
      inputSchema: { id: z.string() },
    },
    async ({ id }) => {
      try {
        return jsonResult(await apiRequest(`/problems/${id}`))
      } catch (error) {
        return errorResult(error)
      }
    },
  )

  server.registerTool(
    'list_flashcards',
    {
      description: 'List flashcards.',
      inputSchema: {
        category: z.string().optional(),
        search: z.string().optional(),
      },
    },
    async (args) => {
      try {
        return jsonResult(await apiRequest('/flashcards', { query: args }))
      } catch (error) {
        return errorResult(error)
      }
    },
  )

  server.registerTool('list_due_flashcards', { description: 'List flashcards due for review.' }, async () => {
    try {
      return jsonResult(await apiRequest('/flashcards/due'))
    } catch (error) {
      return errorResult(error)
    }
  })

  server.registerTool(
    'get_flashcard',
    {
      description: 'Get one flashcard by id.',
      inputSchema: { id: z.string() },
    },
    async ({ id }) => {
      try {
        return jsonResult(await apiRequest(`/flashcards/${id}`))
      } catch (error) {
        return errorResult(error)
      }
    },
  )

  server.registerTool('list_roadmaps', { description: 'List roadmaps with items.' }, async () => {
    try {
      return jsonResult(await apiRequest('/roadmaps'))
    } catch (error) {
      return errorResult(error)
    }
  })

  server.registerTool(
    'get_roadmap',
    {
      description: 'Get one roadmap by id.',
      inputSchema: { id: z.string() },
    },
    async ({ id }) => {
      try {
        return jsonResult(await apiRequest(`/roadmaps/${id}`))
      } catch (error) {
        return errorResult(error)
      }
    },
  )

  server.registerTool(
    'list_dev_projects',
    { description: 'List dev projects with nested accounts (credentials).' },
    async () => {
      try {
        return jsonResult(await apiRequest('/dev-accounts/projects'))
      } catch (error) {
        return errorResult(error)
      }
    },
  )

  server.registerTool('list_simulation_types', { description: 'List DSA simulation type catalog.' }, async () => {
    try {
      return jsonResult(await apiRequest('/simulations/types'))
    } catch (error) {
      return errorResult(error)
    }
  })

  // ── Propose mutations (never execute immediately) ─────────────────
  server.registerTool(
    'propose_create_article',
    {
      description: 'Propose creating an article. Does NOT write until approve_change.',
      inputSchema: {
        title: z.string(),
        categoryId: z.string().optional(),
        excerpt: z.string().optional(),
        status: articleStatus.optional(),
        tagIds: z.array(z.string()).optional(),
        content: z.record(z.string(), z.unknown()).optional(),
      },
    },
    async (body) =>
      propose(`Create article "${body.title}"`, 'article', 'create', 'POST', '/articles', body),
  )

  server.registerTool(
    'propose_update_article',
    {
      description: 'Propose updating an article. Does NOT write until approve_change.',
      inputSchema: {
        id: z.string(),
        title: z.string().optional(),
        categoryId: z.string().nullable().optional(),
        excerpt: z.string().nullable().optional(),
        status: articleStatus.optional(),
        tagIds: z.array(z.string()).optional(),
        content: z.record(z.string(), z.unknown()).optional(),
        isArchived: z.boolean().optional(),
      },
    },
    async ({ id, ...body }) =>
      propose(`Update article ${id}`, 'article', 'update', 'PUT', `/articles/${id}`, body),
  )

  server.registerTool(
    'propose_delete_article',
    {
      description: 'Propose deleting an article. Does NOT write until approve_change.',
      inputSchema: { id: z.string() },
      annotations: { destructiveHint: true },
    },
    async ({ id }) => propose(`Delete article ${id}`, 'article', 'delete', 'DELETE', `/articles/${id}`),
  )

  server.registerTool(
    'propose_duplicate_article',
    {
      description: 'Propose duplicating an article.',
      inputSchema: { id: z.string() },
    },
    async ({ id }) =>
      propose(`Duplicate article ${id}`, 'article', 'duplicate', 'POST', `/articles/${id}/duplicate`),
  )

  server.registerTool(
    'propose_archive_article',
    {
      description: 'Propose archiving an article.',
      inputSchema: { id: z.string() },
    },
    async ({ id }) =>
      propose(`Archive article ${id}`, 'article', 'archive', 'POST', `/articles/${id}/archive`),
  )

  server.registerTool(
    'propose_create_category',
    {
      description: 'Propose creating a category.',
      inputSchema: {
        name: z.string(),
        description: z.string().optional(),
        icon: z.string().optional(),
        color: z.string().optional(),
      },
    },
    async (body) =>
      propose(`Create category "${body.name}"`, 'category', 'create', 'POST', '/categories', body),
  )

  server.registerTool(
    'propose_update_category',
    {
      description: 'Propose updating a category.',
      inputSchema: {
        id: z.string(),
        name: z.string().optional(),
        description: z.string().nullable().optional(),
        icon: z.string().nullable().optional(),
        color: z.string().nullable().optional(),
      },
    },
    async ({ id, ...body }) =>
      propose(`Update category ${id}`, 'category', 'update', 'PUT', `/categories/${id}`, body),
  )

  server.registerTool(
    'propose_delete_category',
    {
      description: 'Propose deleting a category.',
      inputSchema: { id: z.string() },
      annotations: { destructiveHint: true },
    },
    async ({ id }) =>
      propose(`Delete category ${id}`, 'category', 'delete', 'DELETE', `/categories/${id}`),
  )

  server.registerTool(
    'propose_create_tag',
    {
      description: 'Propose creating a tag.',
      inputSchema: {
        name: z.string(),
        color: z.string().optional(),
      },
    },
    async (body) => propose(`Create tag "${body.name}"`, 'tag', 'create', 'POST', '/tags', body),
  )

  server.registerTool(
    'propose_delete_tag',
    {
      description: 'Propose deleting a tag.',
      inputSchema: { id: z.string() },
      annotations: { destructiveHint: true },
    },
    async ({ id }) => propose(`Delete tag ${id}`, 'tag', 'delete', 'DELETE', `/tags/${id}`),
  )

  server.registerTool(
    'propose_create_problem',
    {
      description: 'Propose creating a problem.',
      inputSchema: {
        title: z.string(),
        description: z.string(),
        difficulty: difficulty.optional(),
        constraints: z.string().optional(),
        examples: z.array(z.unknown()).optional(),
        source: z.string().optional(),
        learningNotes: z.string().optional(),
        tagIds: z.array(z.string()).optional(),
        isSolved: z.boolean().optional(),
      },
    },
    async (body) =>
      propose(`Create problem "${body.title}"`, 'problem', 'create', 'POST', '/problems', body),
  )

  server.registerTool(
    'propose_update_problem',
    {
      description: 'Propose updating a problem.',
      inputSchema: {
        id: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
        difficulty: difficulty.optional(),
        constraints: z.string().nullable().optional(),
        examples: z.array(z.unknown()).optional(),
        source: z.string().nullable().optional(),
        learningNotes: z.string().nullable().optional(),
        tagIds: z.array(z.string()).optional(),
        isSolved: z.boolean().optional(),
      },
    },
    async ({ id, ...body }) =>
      propose(`Update problem ${id}`, 'problem', 'update', 'PUT', `/problems/${id}`, body),
  )

  server.registerTool(
    'propose_delete_problem',
    {
      description: 'Propose deleting a problem (cascades solutions/mistakes).',
      inputSchema: { id: z.string() },
      annotations: { destructiveHint: true },
    },
    async ({ id }) => propose(`Delete problem ${id}`, 'problem', 'delete', 'DELETE', `/problems/${id}`),
  )

  server.registerTool(
    'propose_add_solution',
    {
      description: 'Propose adding a solution to a problem.',
      inputSchema: {
        problemId: z.string(),
        title: z.string(),
        code: z.string(),
        explanation: z.string().optional(),
        language: z.string().optional(),
        timeComplexity: z.string().optional(),
        spaceComplexity: z.string().optional(),
        notes: z.string().optional(),
        isOptimal: z.boolean().optional(),
      },
    },
    async ({ problemId, ...body }) =>
      propose(
        `Add solution "${body.title}" to problem ${problemId}`,
        'solution',
        'create',
        'POST',
        `/problems/${problemId}/solutions`,
        body,
      ),
  )

  server.registerTool(
    'propose_add_mistake',
    {
      description: 'Propose adding a mistake note to a problem.',
      inputSchema: {
        problemId: z.string(),
        type: mistakeType,
        description: z.string(),
        lessonLearned: z.string().optional(),
      },
    },
    async ({ problemId, ...body }) =>
      propose(
        `Add mistake (${body.type}) to problem ${problemId}`,
        'mistake',
        'create',
        'POST',
        `/problems/${problemId}/mistakes`,
        body,
      ),
  )

  server.registerTool(
    'propose_create_flashcard',
    {
      description: 'Propose creating a flashcard.',
      inputSchema: {
        category: z.string(),
        question: z.string(),
        answer: z.string(),
        difficulty: difficulty.optional(),
        personalNotes: z.string().optional(),
      },
    },
    async (body) =>
      propose(
        `Create flashcard in ${body.category}`,
        'flashcard',
        'create',
        'POST',
        '/flashcards',
        body,
      ),
  )

  server.registerTool(
    'propose_update_flashcard',
    {
      description: 'Propose updating a flashcard.',
      inputSchema: {
        id: z.string(),
        category: z.string().optional(),
        question: z.string().optional(),
        answer: z.string().optional(),
        difficulty: difficulty.optional(),
        personalNotes: z.string().nullable().optional(),
      },
    },
    async ({ id, ...body }) =>
      propose(`Update flashcard ${id}`, 'flashcard', 'update', 'PUT', `/flashcards/${id}`, body),
  )

  server.registerTool(
    'propose_delete_flashcard',
    {
      description: 'Propose deleting a flashcard.',
      inputSchema: { id: z.string() },
      annotations: { destructiveHint: true },
    },
    async ({ id }) =>
      propose(`Delete flashcard ${id}`, 'flashcard', 'delete', 'DELETE', `/flashcards/${id}`),
  )

  server.registerTool(
    'propose_review_flashcard',
    {
      description: 'Propose logging a flashcard review rating.',
      inputSchema: {
        id: z.string(),
        rating: reviewRating,
      },
    },
    async ({ id, rating }) =>
      propose(
        `Review flashcard ${id} as ${rating}`,
        'flashcard',
        'review',
        'POST',
        `/flashcards/${id}/review`,
        { rating },
      ),
  )

  server.registerTool(
    'propose_create_roadmap',
    {
      description: 'Propose creating a roadmap.',
      inputSchema: {
        title: z.string(),
        description: z.string().optional(),
      },
    },
    async (body) =>
      propose(`Create roadmap "${body.title}"`, 'roadmap', 'create', 'POST', '/roadmaps', body),
  )

  server.registerTool(
    'propose_update_roadmap',
    {
      description: 'Propose updating a roadmap.',
      inputSchema: {
        id: z.string(),
        title: z.string().optional(),
        description: z.string().nullable().optional(),
      },
    },
    async ({ id, ...body }) =>
      propose(`Update roadmap ${id}`, 'roadmap', 'update', 'PUT', `/roadmaps/${id}`, body),
  )

  server.registerTool(
    'propose_delete_roadmap',
    {
      description: 'Propose deleting a roadmap (cascades items).',
      inputSchema: { id: z.string() },
      annotations: { destructiveHint: true },
    },
    async ({ id }) =>
      propose(`Delete roadmap ${id}`, 'roadmap', 'delete', 'DELETE', `/roadmaps/${id}`),
  )

  server.registerTool(
    'propose_add_roadmap_item',
    {
      description: 'Propose adding an item to a roadmap.',
      inputSchema: {
        roadmapId: z.string(),
        title: z.string(),
        description: z.string().optional(),
        status: roadmapItemStatus.optional(),
      },
    },
    async ({ roadmapId, ...body }) =>
      propose(
        `Add roadmap item "${body.title}"`,
        'roadmap_item',
        'create',
        'POST',
        `/roadmaps/${roadmapId}/items`,
        body,
      ),
  )

  server.registerTool(
    'propose_update_roadmap_item',
    {
      description: 'Propose updating a roadmap item.',
      inputSchema: {
        roadmapId: z.string(),
        itemId: z.string(),
        title: z.string().optional(),
        description: z.string().nullable().optional(),
        status: roadmapItemStatus.optional(),
        orderIndex: z.number().optional(),
      },
    },
    async ({ roadmapId, itemId, ...body }) =>
      propose(
        `Update roadmap item ${itemId}`,
        'roadmap_item',
        'update',
        'PUT',
        `/roadmaps/${roadmapId}/items/${itemId}`,
        body,
      ),
  )

  server.registerTool(
    'propose_delete_roadmap_item',
    {
      description: 'Propose deleting a roadmap item.',
      inputSchema: {
        roadmapId: z.string(),
        itemId: z.string(),
      },
      annotations: { destructiveHint: true },
    },
    async ({ roadmapId, itemId }) =>
      propose(
        `Delete roadmap item ${itemId}`,
        'roadmap_item',
        'delete',
        'DELETE',
        `/roadmaps/${roadmapId}/items/${itemId}`,
      ),
  )

  server.registerTool(
    'propose_create_dev_project',
    {
      description: 'Propose creating a Dev Accounts project.',
      inputSchema: {
        name: z.string(),
        description: z.string().optional(),
      },
    },
    async (body) =>
      propose(
        `Create dev project "${body.name}"`,
        'dev_project',
        'create',
        'POST',
        '/dev-accounts/projects',
        body,
      ),
  )

  server.registerTool(
    'propose_update_dev_project',
    {
      description: 'Propose updating a Dev Accounts project.',
      inputSchema: {
        id: z.string(),
        name: z.string().optional(),
        description: z.string().nullable().optional(),
      },
    },
    async ({ id, ...body }) =>
      propose(
        `Update dev project ${id}`,
        'dev_project',
        'update',
        'PUT',
        `/dev-accounts/projects/${id}`,
        body,
      ),
  )

  server.registerTool(
    'propose_delete_dev_project',
    {
      description: 'Propose deleting a Dev Accounts project (cascades accounts).',
      inputSchema: { id: z.string() },
      annotations: { destructiveHint: true },
    },
    async ({ id }) =>
      propose(
        `Delete dev project ${id}`,
        'dev_project',
        'delete',
        'DELETE',
        `/dev-accounts/projects/${id}`,
      ),
  )

  server.registerTool(
    'propose_create_dev_account',
    {
      description: 'Propose creating a credential under a Dev Accounts project.',
      inputSchema: {
        projectId: z.string(),
        name: z.string(),
        username: z.string(),
        password: z.string(),
        description: z.string().optional(),
      },
    },
    async ({ projectId, ...body }) =>
      propose(
        `Create dev account "${body.name}" on project ${projectId}`,
        'dev_account',
        'create',
        'POST',
        `/dev-accounts/projects/${projectId}/accounts`,
        body,
      ),
  )

  server.registerTool(
    'propose_update_dev_account',
    {
      description: 'Propose updating a Dev Accounts credential.',
      inputSchema: {
        projectId: z.string(),
        accountId: z.string(),
        name: z.string().optional(),
        username: z.string().optional(),
        password: z.string().optional(),
        description: z.string().nullable().optional(),
      },
    },
    async ({ projectId, accountId, ...body }) =>
      propose(
        `Update dev account ${accountId}`,
        'dev_account',
        'update',
        'PUT',
        `/dev-accounts/projects/${projectId}/accounts/${accountId}`,
        body,
      ),
  )

  server.registerTool(
    'propose_delete_dev_account',
    {
      description: 'Propose deleting a Dev Accounts credential.',
      inputSchema: {
        projectId: z.string(),
        accountId: z.string(),
      },
      annotations: { destructiveHint: true },
    },
    async ({ projectId, accountId }) =>
      propose(
        `Delete dev account ${accountId}`,
        'dev_account',
        'delete',
        'DELETE',
        `/dev-accounts/projects/${projectId}/accounts/${accountId}`,
      ),
  )
}
