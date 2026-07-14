import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { MOCK_USER } from '../../../server/middleware/auth.js'
import {
  getArticle,
  getDashboardStats,
  getFlashcard,
  getProblem,
  getRoadmap,
  listArticles,
  listCategories,
  listDevProjects,
  listDueFlashcards,
  listFlashcards,
  listProblems,
  listRoadmaps,
  listTags,
  searchEverything,
} from '../../../server/db/repositories.js'
import {
  approveProposal,
  createProposal,
  ensureDatabaseUser,
  formatProposal,
  getPending,
  listPending,
  rejectProposal,
  type MutationOp,
} from './pending.js'

const userId = MOCK_USER.id

const articleStatus = z.enum(['not_started', 'learning', 'completed', 'need_review'])
const difficulty = z.enum(['easy', 'medium', 'hard'])
const roadmapItemStatus = z.enum(['not_started', 'in_progress', 'completed'])
const mistakeType = z.enum(['wrong_answer', 'tle', 'mle', 'logic_error'])
const reviewRating = z.enum(['again', 'hard', 'good', 'easy'])
const credentialKind = z.enum([
  'login',
  'api_key',
  'database',
  'connection_string',
  'oauth_client',
  'webhook_secret',
  'ssh_key',
  'env_var',
])

function jsonResult(payload: unknown) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(payload, null, 2) }],
  }
}

function textResult(text: string) {
  return { content: [{ type: 'text' as const, text }] }
}

function errorResult(error: unknown) {
  return {
    isError: true as const,
    content: [{ type: 'text' as const, text: error instanceof Error ? error.message : String(error) }],
  }
}

function propose(summary: string, resource: string, action: string, op: MutationOp) {
  return textResult(formatProposal(createProposal({ summary, resource, action, op })))
}

function markdownFrom(content: unknown) {
  if (!content || typeof content !== 'object') return ''
  const value = (content as Record<string, unknown>).markdown
  return typeof value === 'string' ? value : ''
}

export function registerTools(server: McpServer) {
  server.registerTool(
    'list_pending_changes',
    {
      description: 'List mutation proposals waiting for approval. Set include_closed to see history.',
      inputSchema: { include_closed: z.boolean().optional() },
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
      description: 'Get one pending proposal by id.',
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
      description:
        'ONLY after explicit user approval. Executes one pending proposal against Neon.',
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
      description: 'Discard a pending proposal without writing.',
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
      description: 'ONLY after explicit approval of ALL pending items.',
      annotations: { destructiveHint: true },
    },
    async () => {
      try {
        const results = []
        for (const item of listPending(false)) results.push(await approveProposal(item.id))
        return jsonResult({ count: results.length, results })
      } catch (error) {
        return errorResult(error)
      }
    },
  )

  server.registerTool('reject_all_pending', { description: 'Reject every pending proposal.' }, async () => {
    try {
      const results = listPending(false).map((item) => rejectProposal(item.id))
      return jsonResult({ count: results.length, results })
    } catch (error) {
      return errorResult(error)
    }
  })

  // ── Reads ─────────────────────────────────────────────────────────
  server.registerTool('get_dashboard', { description: 'Dashboard stats from Neon.' }, async () => {
    try {
      await ensureDatabaseUser()
      return jsonResult(await getDashboardStats(userId))
    } catch (error) {
      return errorResult(error)
    }
  })

  server.registerTool(
    'search',
    {
      description: 'Search articles, problems, flashcards.',
      inputSchema: { q: z.string().min(1) },
    },
    async ({ q }) => {
      try {
        await ensureDatabaseUser()
        return jsonResult(await searchEverything(userId, q))
      } catch (error) {
        return errorResult(error)
      }
    },
  )

  server.registerTool('list_categories', { description: 'List categories.' }, async () => {
    try {
      await ensureDatabaseUser()
      return jsonResult(await listCategories(userId))
    } catch (error) {
      return errorResult(error)
    }
  })

  server.registerTool('list_tags', { description: 'List tags.' }, async () => {
    try {
      await ensureDatabaseUser()
      return jsonResult(await listTags(userId))
    } catch (error) {
      return errorResult(error)
    }
  })

  server.registerTool(
    'list_articles',
    {
      description: 'List articles (metadata; use get_article for full body).',
      inputSchema: {
        category: z.string().optional(),
        status: articleStatus.optional(),
        tag: z.string().optional(),
        search: z.string().optional(),
      },
    },
    async (filters) => {
      try {
        await ensureDatabaseUser()
        const articles = await listArticles(userId, filters)
        return jsonResult(
          articles.map((article) => {
            const { content: _ignored, ...rest } = article
            void _ignored
            return rest
          }),
        )
      } catch (error) {
        return errorResult(error)
      }
    },
  )

  server.registerTool(
    'get_article',
    {
      description: 'Get one article including markdown body when present.',
      inputSchema: { id: z.string() },
    },
    async ({ id }) => {
      try {
        await ensureDatabaseUser()
        const article = await getArticle(userId, id)
        if (!article) return errorResult(`Article ${id} not found`)
        return jsonResult({ ...article, markdown: markdownFrom(article.content) })
      } catch (error) {
        return errorResult(error)
      }
    },
  )

  server.registerTool(
    'list_problems',
    {
      description: 'List problems.',
      inputSchema: {
        difficulty: difficulty.optional(),
        tag: z.string().optional(),
        search: z.string().optional(),
      },
    },
    async (filters) => {
      try {
        await ensureDatabaseUser()
        return jsonResult(await listProblems(userId, filters))
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
        await ensureDatabaseUser()
        const problem = await getProblem(userId, id)
        if (!problem) return errorResult(`Problem ${id} not found`)
        return jsonResult(problem)
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
    async (filters) => {
      try {
        await ensureDatabaseUser()
        return jsonResult(await listFlashcards(userId, filters))
      } catch (error) {
        return errorResult(error)
      }
    },
  )

  server.registerTool('list_due_flashcards', { description: 'Flashcards due for review.' }, async () => {
    try {
      await ensureDatabaseUser()
      return jsonResult(await listDueFlashcards(userId))
    } catch (error) {
      return errorResult(error)
    }
  })

  server.registerTool(
    'get_flashcard',
    {
      description: 'Get one flashcard.',
      inputSchema: { id: z.string() },
    },
    async ({ id }) => {
      try {
        await ensureDatabaseUser()
        const card = await getFlashcard(userId, id)
        if (!card) return errorResult(`Flashcard ${id} not found`)
        return jsonResult(card)
      } catch (error) {
        return errorResult(error)
      }
    },
  )

  server.registerTool('list_roadmaps', { description: 'List roadmaps with items.' }, async () => {
    try {
      await ensureDatabaseUser()
      return jsonResult(await listRoadmaps(userId))
    } catch (error) {
      return errorResult(error)
    }
  })

  server.registerTool(
    'get_roadmap',
    {
      description: 'Get one roadmap.',
      inputSchema: { id: z.string() },
    },
    async ({ id }) => {
      try {
        await ensureDatabaseUser()
        const roadmap = await getRoadmap(userId, id)
        if (!roadmap) return errorResult(`Roadmap ${id} not found`)
        return jsonResult(roadmap)
      } catch (error) {
        return errorResult(error)
      }
    },
  )

  server.registerTool(
    'list_dev_projects',
    { description: 'List Dev Vault projects and credentials.' },
    async () => {
      try {
        await ensureDatabaseUser()
        return jsonResult(await listDevProjects(userId))
      } catch (error) {
        return errorResult(error)
      }
    },
  )

  // ── Propose mutations ─────────────────────────────────────────────
  server.registerTool(
    'propose_create_article',
    {
      description: 'Propose creating an article. Does not write until approve_change.',
      inputSchema: {
        title: z.string(),
        categoryId: z.string().optional(),
        excerpt: z.string().optional(),
        status: articleStatus.optional(),
        tagIds: z.array(z.string()).optional(),
        markdown: z.string().optional().describe('Stored as content.markdown'),
        content: z.record(z.string(), z.unknown()).optional(),
      },
    },
    async ({ markdown, content, ...rest }) =>
      propose(`Create article "${rest.title}"`, 'article', 'create', {
        type: 'create_article',
        body: {
          ...rest,
          content: content ?? (markdown !== undefined ? { markdown } : undefined),
        },
      }),
  )

  server.registerTool(
    'propose_update_article',
    {
      description: 'Propose updating an article.',
      inputSchema: {
        id: z.string(),
        title: z.string().optional(),
        categoryId: z.string().nullable().optional(),
        excerpt: z.string().nullable().optional(),
        status: articleStatus.optional(),
        tagIds: z.array(z.string()).optional(),
        markdown: z.string().optional(),
        content: z.record(z.string(), z.unknown()).optional(),
        isArchived: z.boolean().optional(),
      },
    },
    async ({ id, markdown, content, ...rest }) =>
      propose(`Update article ${id}`, 'article', 'update', {
        type: 'update_article',
        id,
        body: {
          ...rest,
          ...(content !== undefined || markdown !== undefined
            ? { content: content ?? { markdown } }
            : {}),
        },
      }),
  )

  server.registerTool(
    'propose_delete_article',
    {
      description: 'Propose deleting an article.',
      inputSchema: { id: z.string() },
      annotations: { destructiveHint: true },
    },
    async ({ id }) => propose(`Delete article ${id}`, 'article', 'delete', { type: 'delete_article', id }),
  )

  server.registerTool(
    'propose_duplicate_article',
    {
      description: 'Propose duplicating an article.',
      inputSchema: { id: z.string() },
    },
    async ({ id }) =>
      propose(`Duplicate article ${id}`, 'article', 'duplicate', { type: 'duplicate_article', id }),
  )

  server.registerTool(
    'propose_archive_article',
    {
      description: 'Propose archiving an article.',
      inputSchema: { id: z.string() },
    },
    async ({ id }) =>
      propose(`Archive article ${id}`, 'article', 'archive', { type: 'archive_article', id }),
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
      propose(`Create category "${body.name}"`, 'category', 'create', {
        type: 'create_category',
        body,
      }),
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
      propose(`Update category ${id}`, 'category', 'update', {
        type: 'update_category',
        id,
        body,
      }),
  )

  server.registerTool(
    'propose_delete_category',
    {
      description: 'Propose deleting a category.',
      inputSchema: { id: z.string() },
      annotations: { destructiveHint: true },
    },
    async ({ id }) =>
      propose(`Delete category ${id}`, 'category', 'delete', { type: 'delete_category', id }),
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
    async (body) => propose(`Create tag "${body.name}"`, 'tag', 'create', { type: 'create_tag', body }),
  )

  server.registerTool(
    'propose_delete_tag',
    {
      description: 'Propose deleting a tag.',
      inputSchema: { id: z.string() },
      annotations: { destructiveHint: true },
    },
    async ({ id }) => propose(`Delete tag ${id}`, 'tag', 'delete', { type: 'delete_tag', id }),
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
      propose(`Create problem "${body.title}"`, 'problem', 'create', {
        type: 'create_problem',
        body,
      }),
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
      propose(`Update problem ${id}`, 'problem', 'update', {
        type: 'update_problem',
        id,
        body,
      }),
  )

  server.registerTool(
    'propose_delete_problem',
    {
      description: 'Propose deleting a problem.',
      inputSchema: { id: z.string() },
      annotations: { destructiveHint: true },
    },
    async ({ id }) =>
      propose(`Delete problem ${id}`, 'problem', 'delete', { type: 'delete_problem', id }),
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
      propose(`Add solution "${body.title}"`, 'solution', 'create', {
        type: 'add_solution',
        problemId,
        body,
      }),
  )

  server.registerTool(
    'propose_add_mistake',
    {
      description: 'Propose adding a mistake note.',
      inputSchema: {
        problemId: z.string(),
        type: mistakeType,
        description: z.string(),
        lessonLearned: z.string().optional(),
      },
    },
    async ({ problemId, ...body }) =>
      propose(`Add mistake (${body.type})`, 'mistake', 'create', {
        type: 'add_mistake',
        problemId,
        body,
      }),
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
      propose(`Create flashcard in ${body.category}`, 'flashcard', 'create', {
        type: 'create_flashcard',
        body,
      }),
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
      propose(`Update flashcard ${id}`, 'flashcard', 'update', {
        type: 'update_flashcard',
        id,
        body,
      }),
  )

  server.registerTool(
    'propose_delete_flashcard',
    {
      description: 'Propose deleting a flashcard.',
      inputSchema: { id: z.string() },
      annotations: { destructiveHint: true },
    },
    async ({ id }) =>
      propose(`Delete flashcard ${id}`, 'flashcard', 'delete', { type: 'delete_flashcard', id }),
  )

  server.registerTool(
    'propose_review_flashcard',
    {
      description: 'Propose logging a flashcard review.',
      inputSchema: {
        id: z.string(),
        rating: reviewRating,
      },
    },
    async ({ id, rating }) =>
      propose(`Review flashcard ${id} as ${rating}`, 'flashcard', 'review', {
        type: 'review_flashcard',
        id,
        rating,
      }),
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
      propose(`Create roadmap "${body.title}"`, 'roadmap', 'create', {
        type: 'create_roadmap',
        body,
      }),
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
      propose(`Update roadmap ${id}`, 'roadmap', 'update', {
        type: 'update_roadmap',
        id,
        body,
      }),
  )

  server.registerTool(
    'propose_delete_roadmap',
    {
      description: 'Propose deleting a roadmap.',
      inputSchema: { id: z.string() },
      annotations: { destructiveHint: true },
    },
    async ({ id }) =>
      propose(`Delete roadmap ${id}`, 'roadmap', 'delete', { type: 'delete_roadmap', id }),
  )

  server.registerTool(
    'propose_add_roadmap_item',
    {
      description: 'Propose adding a roadmap item.',
      inputSchema: {
        roadmapId: z.string(),
        title: z.string(),
        description: z.string().optional(),
        status: roadmapItemStatus.optional(),
      },
    },
    async ({ roadmapId, ...body }) =>
      propose(`Add roadmap item "${body.title}"`, 'roadmap_item', 'create', {
        type: 'add_roadmap_item',
        roadmapId,
        body,
      }),
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
      propose(`Update roadmap item ${itemId}`, 'roadmap_item', 'update', {
        type: 'update_roadmap_item',
        roadmapId,
        itemId,
        body,
      }),
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
      propose(`Delete roadmap item ${itemId}`, 'roadmap_item', 'delete', {
        type: 'delete_roadmap_item',
        roadmapId,
        itemId,
      }),
  )

  server.registerTool(
    'propose_create_dev_project',
    {
      description: 'Propose creating a Dev Vault project.',
      inputSchema: {
        name: z.string(),
        description: z.string().optional(),
      },
    },
    async (body) =>
      propose(`Create dev project "${body.name}"`, 'dev_project', 'create', {
        type: 'create_dev_project',
        body,
      }),
  )

  server.registerTool(
    'propose_update_dev_project',
    {
      description: 'Propose updating a Dev Vault project.',
      inputSchema: {
        id: z.string(),
        name: z.string().optional(),
        description: z.string().nullable().optional(),
      },
    },
    async ({ id, ...body }) =>
      propose(`Update dev project ${id}`, 'dev_project', 'update', {
        type: 'update_dev_project',
        id,
        body,
      }),
  )

  server.registerTool(
    'propose_delete_dev_project',
    {
      description: 'Propose deleting a Dev Vault project.',
      inputSchema: { id: z.string() },
      annotations: { destructiveHint: true },
    },
    async ({ id }) =>
      propose(`Delete dev project ${id}`, 'dev_project', 'delete', {
        type: 'delete_dev_project',
        id,
      }),
  )

  server.registerTool(
    'propose_create_dev_account',
    {
      description: 'Propose creating a credential under a Dev Vault project.',
      inputSchema: {
        projectId: z.string(),
        name: z.string(),
        username: z.string(),
        password: z.string(),
        kind: credentialKind.optional(),
        provider: z.string().optional(),
        environment: z.string().optional(),
        url: z.string().optional(),
        description: z.string().optional(),
      },
    },
    async ({ projectId, ...body }) =>
      propose(`Create dev account "${body.name}"`, 'dev_account', 'create', {
        type: 'create_dev_account',
        projectId,
        body,
      }),
  )

  server.registerTool(
    'propose_update_dev_account',
    {
      description: 'Propose updating a Dev Vault credential.',
      inputSchema: {
        projectId: z.string(),
        accountId: z.string(),
        name: z.string().optional(),
        username: z.string().optional(),
        password: z.string().optional(),
        kind: credentialKind.optional(),
        provider: z.string().nullable().optional(),
        environment: z.string().optional(),
        url: z.string().nullable().optional(),
        description: z.string().nullable().optional(),
      },
    },
    async ({ projectId, accountId, ...body }) =>
      propose(`Update dev account ${accountId}`, 'dev_account', 'update', {
        type: 'update_dev_account',
        projectId,
        accountId,
        body,
      }),
  )

  server.registerTool(
    'propose_delete_dev_account',
    {
      description: 'Propose deleting a Dev Vault credential.',
      inputSchema: {
        projectId: z.string(),
        accountId: z.string(),
      },
      annotations: { destructiveHint: true },
    },
    async ({ projectId, accountId }) =>
      propose(`Delete dev account ${accountId}`, 'dev_account', 'delete', {
        type: 'delete_dev_account',
        projectId,
        accountId,
      }),
  )
}
