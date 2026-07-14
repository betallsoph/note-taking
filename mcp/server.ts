import 'dotenv/config'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { MOCK_USER } from '../server/middleware/auth.js'
import {
  createArticle,
  createCategory,
  createFlashcard,
  createTag,
  ensureUser,
  getArticle,
  getFlashcard,
  isDatabaseEnabled,
  listArticles,
  listCategories,
  listFlashcards,
  listTags,
  searchEverything,
  updateArticle,
  updateFlashcard,
} from '../server/db/repositories.js'

const server = new McpServer({
  name: 'personal-cs-learning-hub',
  version: '0.1.0',
})

const userId = MOCK_USER.id
const noteStatus = z.enum(['not_started', 'learning', 'completed', 'need_review'])
const difficulty = z.enum(['easy', 'medium', 'hard'])
let databaseUserReady: Promise<void> | undefined

function ensureDatabaseUser() {
  databaseUserReady ??= ensureUser(MOCK_USER)
  return databaseUserReady
}

function textResult(value: unknown) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(value, null, 2) }],
  }
}

function markdownFrom(content: unknown) {
  if (!content || typeof content !== 'object') return ''
  const value = (content as Record<string, unknown>).markdown
  return typeof value === 'string' ? value : ''
}

function makeExcerpt(markdown: string) {
  const plain = markdown
    .replace(/```[\s\S]*?```/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
  return plain ? plain.slice(0, 220) : null
}

async function resolveCategoryId(categoryName?: string) {
  if (!categoryName?.trim()) return undefined
  const name = categoryName.trim()
  const categories = await listCategories(userId)
  const match = categories.find((category) => category.name.toLowerCase() === name.toLowerCase())
  return match?.id ?? (await createCategory(userId, { name })).id
}

async function resolveTagIds(tagNames?: string[]) {
  if (!tagNames?.length) return undefined
  const tags = await listTags(userId)
  const ids: string[] = []

  for (const rawName of new Set(tagNames.map((name) => name.trim()).filter(Boolean))) {
    const match = tags.find((tag) => tag.name.toLowerCase() === rawName.toLowerCase())
    ids.push(match?.id ?? (await createTag(userId, { name: rawName })).id)
  }

  return ids
}

function articleSummary(article: Awaited<ReturnType<typeof getArticle>>) {
  if (!article) return null
  const { content, ...summary } = article
  return { ...summary, markdown: markdownFrom(content) }
}

server.tool(
  'knowledge_overview',
  'List all note categories and tags. Use this before organizing a note when you need the existing taxonomy.',
  async () => {
    await ensureDatabaseUser()
    const [categories, tags] = await Promise.all([listCategories(userId), listTags(userId)])
    return textResult({ categories, tags })
  },
)

server.tool(
  'search_knowledge',
  'Search notes, flashcards, and problem notes. Returns concise matches; call get_note or get_flashcard for full content.',
  { query: z.string().min(1).describe('Words to search for.') },
  async ({ query }) => {
    await ensureDatabaseUser()
    const results = await searchEverything(userId, query)
    return textResult({
      articles: results.articles.map((article) => ({
        id: article.id,
        title: article.title,
        excerpt: article.excerpt,
        categoryId: article.categoryId,
        status: article.status,
        updatedAt: article.updatedAt,
      })),
      flashcards: results.flashcards.map((card) => ({
        id: card.id,
        category: card.category,
        question: card.question,
        updatedAt: card.updatedAt,
      })),
      problems: results.problems.map((problem) => ({
        id: problem.id,
        title: problem.title,
        difficulty: problem.difficulty,
        isSolved: problem.isSolved,
        updatedAt: problem.updatedAt,
      })),
    })
  },
)

server.tool(
  'list_notes',
  'List knowledge notes. This is read-only and returns note metadata without full Markdown bodies.',
  {
    query: z.string().optional().describe('Optional title or excerpt search.'),
    categoryName: z.string().optional().describe('Optional exact category name filter.'),
    status: noteStatus.optional(),
    limit: z.number().int().min(1).max(100).default(30),
  },
  async ({ query, categoryName, status, limit }) => {
    await ensureDatabaseUser()
    const categories = categoryName ? await listCategories(userId) : []
    const categoryId = categoryName
      ? categories.find((category) => category.name.toLowerCase() === categoryName.toLowerCase())?.id
      : undefined
    if (categoryName && !categoryId) return textResult([])

    const articles = await listArticles(userId, { search: query, category: categoryId, status })
    return textResult(
      articles.slice(0, limit).map(({ content, ...article }) => ({
        ...article,
        markdownLength: markdownFrom(content).length,
      })),
    )
  },
)

server.tool(
  'get_note',
  'Read one knowledge note, including its complete Markdown body. Use this before changing an existing note.',
  { id: z.string().uuid().describe('The note id.') },
  async ({ id }) => {
    await ensureDatabaseUser()
    return textResult(articleSummary(await getArticle(userId, id)))
  },
)

server.tool(
  'save_note',
  'Create a note or update an existing note. Markdown replaces the whole body only when provided. categoryName and tagNames create missing taxonomy automatically. This tool never deletes notes.',
  {
    id: z.string().uuid().optional().describe('Set this to update an existing note; omit it to create one.'),
    title: z.string().min(1).optional(),
    markdown: z.string().optional().describe('The full Markdown note body.'),
    excerpt: z.string().max(300).optional().describe('Optional one-line summary. Generated from Markdown when omitted on create.'),
    categoryName: z.string().optional(),
    tagNames: z.array(z.string().min(1)).max(20).optional(),
    status: noteStatus.optional(),
  },
  async ({ id, title, markdown, excerpt, categoryName, tagNames, status }) => {
    await ensureDatabaseUser()
    if (!id && !title) {
      throw new Error('title is required when creating a note')
    }

    const categoryId = await resolveCategoryId(categoryName)
    const tagIds = await resolveTagIds(tagNames)
    const body: Record<string, unknown> = {}
    if (title !== undefined) body.title = title.trim()
    if (markdown !== undefined) body.content = { markdown }
    if (excerpt !== undefined) body.excerpt = excerpt.trim() || null
    else if (!id && markdown !== undefined) body.excerpt = makeExcerpt(markdown)
    if (categoryId !== undefined) body.categoryId = categoryId
    if (tagIds !== undefined) body.tagIds = tagIds
    if (status !== undefined) body.status = status

    const article = id
      ? await updateArticle(userId, id, body)
      : await createArticle(userId, {
          ...body,
          title: title?.trim(),
          content: markdown !== undefined ? { markdown } : { markdown: '' },
        })
    if (!article) throw new Error(`Note ${id} was not found`)
    return textResult(articleSummary(article))
  },
)

server.tool(
  'list_flashcards',
  'List flashcards, optionally filtered by category or text.',
  {
    query: z.string().optional(),
    category: z.string().optional(),
    limit: z.number().int().min(1).max(100).default(50),
  },
  async ({ query, category, limit }) => {
    await ensureDatabaseUser()
    const cards = await listFlashcards(userId, { search: query, category })
    return textResult(cards.slice(0, limit))
  },
)

server.tool(
  'get_flashcard',
  'Read a flashcard by id.',
  { id: z.string().uuid().describe('The flashcard id.') },
  async ({ id }) => {
    await ensureDatabaseUser()
    return textResult(await getFlashcard(userId, id))
  },
)

server.tool(
  'save_flashcard',
  'Create a flashcard or update an existing flashcard. This tool never deletes flashcards.',
  {
    id: z.string().uuid().optional().describe('Set this to update a card; omit it to create one.'),
    category: z.string().min(1).optional(),
    question: z.string().min(1).optional(),
    answer: z.string().min(1).optional(),
    difficulty: difficulty.optional(),
    personalNotes: z.string().optional(),
  },
  async ({ id, category, question, answer, difficulty: cardDifficulty, personalNotes }) => {
    await ensureDatabaseUser()
    if (!id && (!category || !question || !answer)) {
      throw new Error('category, question, and answer are required when creating a flashcard')
    }

    const body: Record<string, unknown> = {}
    if (category !== undefined) body.category = category
    if (question !== undefined) body.question = question
    if (answer !== undefined) body.answer = answer
    if (cardDifficulty !== undefined) body.difficulty = cardDifficulty
    if (personalNotes !== undefined) body.personalNotes = personalNotes

    const card = id
      ? await updateFlashcard(userId, id, body)
      : await createFlashcard(userId, {
          category,
          question,
          answer,
          difficulty: cardDifficulty,
          personalNotes,
        })
    if (!card) throw new Error(`Flashcard ${id} was not found`)
    return textResult(card)
  },
)

async function main() {
  if (!isDatabaseEnabled()) {
    throw new Error('DATABASE_URL is required. MCP only writes persistent Neon data, never the in-memory mock store.')
  }

  await server.connect(new StdioServerTransport())
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
