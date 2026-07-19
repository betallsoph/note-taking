import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'
import { and, desc, eq, inArray, isNotNull, lte } from 'drizzle-orm'
import { db, type Database } from './index.js'
import { getPgError, isMissingRelation } from './pg-error.js'
import { resolveNotesStoreMode } from './notes-config.js'
import { normalizeNoteTags, noteMatchesArchivedFilter, type NoteListFilters } from './note-tags.js'
import * as schema from './schema.js'
import { MOCK_USER, type AuthUser } from '../auth-constants.js'
import { hashPassword, verifyPassword } from '../lib/password.js'
import {
  slugify,
  type Article,
  type ArticleStatus,
  type Category,
  type DashboardStats,
  mockStore,
  type DevAccount,
  type DevCredentialKind,
  type DevProject,
  type Difficulty,
  type Flashcard,
  type Mistake,
  type MistakeType,
  type Note,
  type PersonalAccount,
  type PersonalAccountCategory,
  type PlannerHorizon,
  type PlannerItem,
  type PlannerScope,
  type PlannerStatus,
  type Problem,
  type Reminder,
  type ReviewRating,
  type Roadmap,
  type RoadmapItem,
  type RoadmapItemStatus,
  type Solution,
} from '../mock-store.js'

const REVIEW_INTERVALS = [1, 3, 7, 14, 30]
const ENCRYPTED_SECRET_PREFIX = 'enc:v1'

type ArticleRow = typeof schema.articles.$inferSelect
type CategoryRow = typeof schema.categories.$inferSelect
type DevAccountRow = typeof schema.devAccounts.$inferSelect
type DevProjectRow = typeof schema.devProjects.$inferSelect
type FlashcardRow = typeof schema.flashcards.$inferSelect
type MistakeRow = typeof schema.mistakes.$inferSelect
type NoteRow = typeof schema.notes.$inferSelect
type PersonalAccountRow = typeof schema.personalAccounts.$inferSelect
type PlannerItemRow = typeof schema.plannerItems.$inferSelect
type ProblemRow = typeof schema.problems.$inferSelect
type ReminderRow = typeof schema.reminders.$inferSelect
type RoadmapItemRow = typeof schema.roadmapItems.$inferSelect
type RoadmapRow = typeof schema.roadmaps.$inferSelect
type SolutionRow = typeof schema.solutions.$inferSelect
type TagRow = typeof schema.tags.$inferSelect

const PERSONAL_ACCOUNT_CATEGORIES: PersonalAccountCategory[] = [
  'email',
  'social',
  'school',
  'streaming',
  'shopping',
  'finance',
  'other',
]

const PLANNER_HORIZONS: PlannerHorizon[] = ['now', 'next', 'later', 'someday']
const PLANNER_STATUSES: PlannerStatus[] = ['open', 'doing', 'done', 'dropped']
const PLANNER_SCOPES: PlannerScope[] = ['personal', 'project']
const PLANNER_HORIZON_ORDER: Record<PlannerHorizon, number> = {
  now: 0,
  next: 1,
  later: 2,
  someday: 3,
}

function asPlannerHorizon(value: unknown): PlannerHorizon {
  return PLANNER_HORIZONS.includes(value as PlannerHorizon) ? (value as PlannerHorizon) : 'later'
}

function asPlannerStatus(value: unknown): PlannerStatus {
  return PLANNER_STATUSES.includes(value as PlannerStatus) ? (value as PlannerStatus) : 'open'
}

function asPlannerScope(value: unknown): PlannerScope {
  return PLANNER_SCOPES.includes(value as PlannerScope) ? (value as PlannerScope) : 'personal'
}

function sortPlannerItems<T extends Pick<PlannerItem, 'horizon' | 'status' | 'updatedAt'>>(items: T[]) {
  return [...items].sort((a, b) => {
    const horizonDiff = PLANNER_HORIZON_ORDER[a.horizon] - PLANNER_HORIZON_ORDER[b.horizon]
    if (horizonDiff !== 0) return horizonDiff
    const aDone = a.status === 'done' || a.status === 'dropped'
    const bDone = b.status === 'done' || b.status === 'dropped'
    if (aDone !== bDone) return aDone ? 1 : -1
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })
}

function asPersonalAccountCategory(value: unknown): PersonalAccountCategory {
  return PERSONAL_ACCOUNT_CATEGORIES.includes(value as PersonalAccountCategory)
    ? (value as PersonalAccountCategory)
    : 'other'
}

function requireDb(): Database {
  if (!db) throw new Error('DATABASE_URL is not configured')
  return db
}

export { isDatabaseEnabled } from './index.js'

function toIso(value: Date | string) {
  return value instanceof Date ? value.toISOString() : value
}

function nullableIso(value: Date | string | null) {
  return value ? toIso(value) : null
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function optionalDate(value: unknown): Date | null | undefined {
  if (value === undefined) return undefined
  if (value === null || value === '') return null
  return new Date(String(value))
}

function optionalString(value: unknown) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed || null
}

function secretKey() {
  const raw = process.env.SECRET_ENCRYPTION_KEY
  if (!raw) return null
  return createHash('sha256').update(raw).digest()
}

function encryptSecret(value: string) {
  const key = secretKey()
  if (!key || value.startsWith(`${ENCRYPTED_SECRET_PREFIX}:`)) return value

  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return [
    ENCRYPTED_SECRET_PREFIX,
    iv.toString('base64url'),
    tag.toString('base64url'),
    encrypted.toString('base64url'),
  ].join(':')
}

function decryptSecret(value: string) {
  if (!value.startsWith(`${ENCRYPTED_SECRET_PREFIX}:`)) return value
  const key = secretKey()
  if (!key) return '[encrypted secret - set SECRET_ENCRYPTION_KEY]'

  try {
    const [, , iv, tag, encrypted] = value.split(':')
    const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64url'))
    decipher.setAuthTag(Buffer.from(tag, 'base64url'))
    return Buffer.concat([
      decipher.update(Buffer.from(encrypted, 'base64url')),
      decipher.final(),
    ]).toString('utf8')
  } catch {
    return '[secret decrypt failed]'
  }
}

function serializeCategory(row: CategoryRow): Category {
  return {
    ...row,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  }
}

function serializeTag(row: TagRow) {
  return {
    ...row,
    createdAt: toIso(row.createdAt),
  }
}

function serializeArticle(row: ArticleRow, tagIds: string[] = []): Article {
  return {
    ...row,
    content: asRecord(row.content),
    tagIds,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  }
}

function serializeProblem(row: ProblemRow, tagIds: string[] = []): Problem {
  return {
    ...row,
    examples: asArray(row.examples),
    tagIds,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  }
}

function serializeSolution(row: SolutionRow): Solution {
  return {
    ...row,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  }
}

function serializeMistake(row: MistakeRow): Mistake {
  return {
    ...row,
    createdAt: toIso(row.createdAt),
  }
}

function serializeFlashcard(row: FlashcardRow): Flashcard {
  return {
    ...row,
    nextReviewAt: nullableIso(row.nextReviewAt),
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  }
}

function serializeNote(row: NoteRow): Note {
  return {
    id: row.id,
    userId: row.userId,
    title: row.title,
    content: asRecord(row.content),
    tags: normalizeNoteTags(row.tags ?? []),
    isPinned: row.isPinned,
    isArchived: Boolean(row.isArchived),
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  }
}

function serializeReminder(row: ReminderRow): Reminder {
  return {
    ...row,
    remindAt: toIso(row.remindAt),
    completedAt: nullableIso(row.completedAt),
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  }
}

function plannerContentFromRow(row: PlannerItemRow): Record<string, unknown> {
  const content = asRecord(row.content)
  if (Object.keys(content).length > 0) return content
  if (row.body) return { markdown: row.body }
  return { markdown: '' }
}

function serializePlannerItem(row: PlannerItemRow): PlannerItem {
  return {
    id: row.id,
    userId: row.userId,
    title: row.title,
    content: plannerContentFromRow(row),
    scope: asPlannerScope(row.scope),
    projectName: row.projectName,
    horizon: asPlannerHorizon(row.horizon),
    status: asPlannerStatus(row.status),
    targetDate: nullableIso(row.targetDate),
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  }
}

function serializeRoadmap(row: RoadmapRow): Roadmap {
  return {
    ...row,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  }
}

function serializeRoadmapItem(row: RoadmapItemRow): RoadmapItem {
  return {
    ...row,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  }
}

function serializeDevProject(row: DevProjectRow): DevProject {
  return {
    ...row,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  }
}

function serializeDevAccount(row: DevAccountRow): DevAccount {
  return {
    ...row,
    kind: row.kind as DevCredentialKind,
    password: decryptSecret(row.password),
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  }
}

/** Convert legacy single env_var rows into env_file blocks without losing values. */
function envVarRowToEnvFileFields(row: Pick<DevAccountRow, 'name' | 'username' | 'password'>) {
  const decrypted = decryptSecret(row.password)
  const key = row.username.trim()
  const looksLikeBlock = decrypted.includes('\n') || (decrypted.includes('=') && !key)
  const content = looksLikeBlock ? decrypted : key ? `${key}=${decrypted}` : decrypted
  return {
    kind: 'env_file' as const,
    username: '.env',
    password: encryptSecret(content),
    provider: null,
    url: null,
    name: row.name.trim() || key || 'Env file',
  }
}

function normalizeDevAccountKind(kind: unknown): DevCredentialKind {
  if (kind === 'env_var') return 'env_file'
  return (kind as DevCredentialKind | undefined) ?? 'login'
}

function coerceDevAccountWrite(body: Record<string, unknown>) {
  const rawKind = typeof body.kind === 'string' ? body.kind : 'login'
  const environment = optionalString(body.environment) ?? 'dev'
  let kind = normalizeDevAccountKind(rawKind)
  let name = typeof body.name === 'string' ? body.name.trim() : ''
  let username = typeof body.username === 'string' ? body.username.trim() : ''
  let password = body.password !== undefined ? String(body.password) : ''
  let provider = optionalString(body.provider)
  let url = optionalString(body.url)
  const description = optionalString(body.description)

  if (rawKind === 'env_var') {
    const looksLikeBlock = password.includes('\n') || (password.includes('=') && !username)
    const key = username
    password = looksLikeBlock ? password : key ? `${key}=${password}` : password
    username = '.env'
    provider = null
    url = null
    if (!name) name = key || (environment === 'prod' ? 'Production .env' : `${environment.toUpperCase()} .env`)
  }

  if (kind === 'env_file') {
    username = username || '.env'
    provider = null
    url = null
    if (!name) {
      name = environment === 'prod' ? 'Production .env' : `${environment.toUpperCase()} .env`
    }
  }

  return { kind, name, username, password, provider, url, description, environment }
}

async function migrateLegacyEnvVarAccounts(database: Database, rows: DevAccountRow[]) {
  const legacy = rows.filter((row) => row.kind === 'env_var')
  if (legacy.length === 0) return rows

  const migratedById = new Map<string, DevAccountRow>()
  for (const row of legacy) {
    const fields = envVarRowToEnvFileFields(row)
    const [updated] = await database
      .update(schema.devAccounts)
      .set({ ...fields, updatedAt: new Date() })
      .where(eq(schema.devAccounts.id, row.id))
      .returning()
    if (updated) migratedById.set(row.id, updated)
  }

  return rows.map((row) => migratedById.get(row.id) ?? row)
}

function serializePersonalAccount(row: PersonalAccountRow): PersonalAccount {
  return {
    ...row,
    category: asPersonalAccountCategory(row.category),
    password: decryptSecret(row.password),
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  }
}

async function articleTagMap(database: Database, articleIds: string[]) {
  const map = new Map<string, string[]>()
  if (articleIds.length === 0) return map
  const rows = await database
    .select()
    .from(schema.articleTags)
    .where(inArray(schema.articleTags.articleId, articleIds))
  for (const row of rows) {
    const existing = map.get(row.articleId) ?? []
    existing.push(row.tagId)
    map.set(row.articleId, existing)
  }
  return map
}

async function problemTagMap(database: Database, problemIds: string[]) {
  const map = new Map<string, string[]>()
  if (problemIds.length === 0) return map
  const rows = await database
    .select()
    .from(schema.problemTags)
    .where(inArray(schema.problemTags.problemId, problemIds))
  for (const row of rows) {
    const existing = map.get(row.problemId) ?? []
    existing.push(row.tagId)
    map.set(row.problemId, existing)
  }
  return map
}

export async function ensureUser(user: AuthUser): Promise<boolean> {
  if (!db) return false

  try {
    await db
      .insert(schema.users)
      .values({ id: user.id, email: user.email, name: user.name })
      .onConflictDoUpdate({
        target: schema.users.id,
        set: { email: user.email, name: user.name, updatedAt: new Date() },
      })
    return true
  } catch (error) {
    const pg = getPgError(error)

    if (pg?.code === '23505') {
      try {
        await db
          .update(schema.users)
          .set({ name: user.name, updatedAt: new Date() })
          .where(eq(schema.users.email, user.email))
        return true
      } catch (retryError) {
        console.error('ensureUser email conflict retry failed:', getPgError(retryError)?.message ?? retryError)
        return false
      }
    }

    if (isMissingRelation(error, 'users')) {
      console.error('users table missing in Neon — run npm run db:push (or redeploy with DATABASE_URL set)')
    } else {
      console.error('ensureUser failed:', pg?.message ?? error)
    }
    return false
  }
}

function toAuthUser(row: typeof schema.users.$inferSelect): AuthUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    username: row.username,
  }
}

export async function getUserById(userId: string): Promise<AuthUser | null> {
  if (!db) return null
  const [row] = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1)
  return row ? toAuthUser(row) : null
}

export async function getUserByUsername(username: string): Promise<typeof schema.users.$inferSelect | null> {
  if (!db) return null
  const [row] = await db.select().from(schema.users).where(eq(schema.users.username, username)).limit(1)
  return row ?? null
}

async function countCredentialUsers() {
  if (!db) return 0
  const rows = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(isNotNull(schema.users.passwordHash))
  return rows.length
}

export async function registerUser(input: {
  username: string
  password: string
  name: string
}): Promise<AuthUser> {
  const database = requireDb()

  const existing = await getUserByUsername(input.username)
  if (existing) throw new Error('Username already taken')

  const passwordHash = await hashPassword(input.password)
  const isFirstUser = (await countCredentialUsers()) === 0
  const userId = isFirstUser ? MOCK_USER.id : crypto.randomUUID()
  const email = isFirstUser ? MOCK_USER.email : `${input.username}@cshub.local`

  if (isFirstUser) {
    await database
      .insert(schema.users)
      .values({
        id: userId,
        email,
        name: input.name,
        username: input.username,
        passwordHash,
      })
      .onConflictDoUpdate({
        target: schema.users.id,
        set: {
          name: input.name,
          username: input.username,
          passwordHash,
          updatedAt: new Date(),
        },
      })
  } else {
    await database.insert(schema.users).values({
      id: userId,
      email,
      name: input.name,
      username: input.username,
      passwordHash,
    })
  }

  const user = await getUserById(userId)
  if (!user?.username) throw new Error('Failed to create user')
  return user
}

export async function loginUser(username: string, password: string): Promise<AuthUser | null> {
  const row = await getUserByUsername(username)
  if (!row?.passwordHash) return null
  const valid = await verifyPassword(password, row.passwordHash)
  if (!valid) return null
  return toAuthUser(row)
}

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const database = requireDb()
  const endOfToday = new Date()
  endOfToday.setHours(23, 59, 59, 999)

  const skipNeonNotes = resolveNotesStoreMode() === 'atlas'

  const [articleRows, problemRows, flashcardRows, roadmapRows, noteRows, reminderRows] =
    await Promise.all([
      database
        .select()
        .from(schema.articles)
        .where(and(eq(schema.articles.userId, userId), eq(schema.articles.isArchived, false)))
        .orderBy(desc(schema.articles.updatedAt)),
      database.select().from(schema.problems).where(eq(schema.problems.userId, userId)),
      database.select().from(schema.flashcards).where(eq(schema.flashcards.userId, userId)),
      database.select().from(schema.roadmaps).where(eq(schema.roadmaps.userId, userId)),
      skipNeonNotes
        ? Promise.resolve([])
        : database.select().from(schema.notes).where(eq(schema.notes.userId, userId)),
      database.select().from(schema.reminders).where(eq(schema.reminders.userId, userId)),
    ])
  const tagIds = await articleTagMap(database, articleRows.map((article) => article.id))
  const recentlyUpdatedNotes = articleRows
    .slice(0, 5)
    .map((article) => serializeArticle(article, tagIds.get(article.id) ?? []))

  return {
    totalArticles: articleRows.length,
    totalProblems: problemRows.length,
    totalFlashcards: flashcardRows.length,
    totalRoadmaps: roadmapRows.length,
    // When NOTES_STORE=atlas this is 0; HTTP/MCP callers overwrite via countNotesAnywhere.
    totalNotes: noteRows.filter((note) => !note.isArchived).length,
    topicsCompleted: articleRows.filter((article) => article.status === 'completed').length,
    learningStreak: 7,
    reviewDueToday: flashcardRows.filter(
      (card) => card.nextReviewAt && card.nextReviewAt <= new Date(),
    ).length,
    remindersDueToday: reminderRows.filter(
      (reminder) => !reminder.isCompleted && reminder.remindAt <= endOfToday,
    ).length,
    recentlyUpdatedNotes,
  }
}

export async function listCategories(userId: string) {
  const rows = await requireDb()
    .select()
    .from(schema.categories)
    .where(eq(schema.categories.userId, userId))
    .orderBy(schema.categories.name)
  return rows.map(serializeCategory)
}

export async function createCategory(userId: string, body: { name: string; description?: string | null; icon?: string | null; color?: string | null }) {
  const [row] = await requireDb()
    .insert(schema.categories)
    .values({
      userId,
      name: body.name,
      slug: slugify(body.name),
      description: body.description ?? null,
      icon: body.icon ?? null,
      color: body.color ?? null,
    })
    .returning()
  return serializeCategory(row)
}

export async function updateCategory(userId: string, categoryId: string, body: Record<string, unknown>) {
  const updates: Partial<typeof schema.categories.$inferInsert> = { updatedAt: new Date() }
  if (typeof body.name === 'string') {
    updates.name = body.name
    updates.slug = slugify(body.name)
  }
  if ('description' in body) updates.description = body.description ? String(body.description) : null
  if ('icon' in body) updates.icon = body.icon ? String(body.icon) : null
  if ('color' in body) updates.color = body.color ? String(body.color) : null

  const [row] = await requireDb()
    .update(schema.categories)
    .set(updates)
    .where(and(eq(schema.categories.id, categoryId), eq(schema.categories.userId, userId)))
    .returning()
  return row ? serializeCategory(row) : null
}

export async function deleteCategory(userId: string, categoryId: string) {
  const [row] = await requireDb()
    .delete(schema.categories)
    .where(and(eq(schema.categories.id, categoryId), eq(schema.categories.userId, userId)))
    .returning({ id: schema.categories.id })
  return Boolean(row)
}

export async function listTags(userId: string) {
  const rows = await requireDb()
    .select()
    .from(schema.tags)
    .where(eq(schema.tags.userId, userId))
    .orderBy(schema.tags.name)
  return rows.map(serializeTag)
}

export async function createTag(userId: string, body: { name: string; color?: string | null }) {
  const [row] = await requireDb()
    .insert(schema.tags)
    .values({
      userId,
      name: body.name,
      slug: slugify(body.name),
      color: body.color ?? null,
    })
    .returning()
  return serializeTag(row)
}

export async function deleteTag(userId: string, tagId: string) {
  const [row] = await requireDb()
    .delete(schema.tags)
    .where(and(eq(schema.tags.id, tagId), eq(schema.tags.userId, userId)))
    .returning({ id: schema.tags.id })
  return Boolean(row)
}

export async function listArticles(
  userId: string,
  filters: { category?: string; status?: string; tag?: string; search?: string },
) {
  const database = requireDb()
  const rows = await database
    .select()
    .from(schema.articles)
    .where(and(eq(schema.articles.userId, userId), eq(schema.articles.isArchived, false)))
    .orderBy(desc(schema.articles.updatedAt))
  const tagIds = await articleTagMap(database, rows.map((article) => article.id))
  const query = filters.search?.toLowerCase()

  return rows
    .map((article) => serializeArticle(article, tagIds.get(article.id) ?? []))
    .filter((article) => !filters.category || article.categoryId === filters.category)
    .filter((article) => !filters.status || article.status === filters.status)
    .filter((article) => !filters.tag || article.tagIds.includes(filters.tag))
    .filter(
      (article) =>
        !query ||
        article.title.toLowerCase().includes(query) ||
        article.excerpt?.toLowerCase().includes(query),
    )
}

export async function getArticle(userId: string, articleId: string) {
  const database = requireDb()
  const [row] = await database
    .select()
    .from(schema.articles)
    .where(and(eq(schema.articles.id, articleId), eq(schema.articles.userId, userId)))
    .limit(1)
  if (!row) return null
  const tags = await articleTagMap(database, [row.id])
  return serializeArticle(row, tags.get(row.id) ?? [])
}

export async function createArticle(userId: string, body: Record<string, unknown>) {
  const database = requireDb()
  const title = String(body.title)
  const tagIds = stringArray(body.tagIds)
  const [row] = await database
    .insert(schema.articles)
    .values({
      userId,
      categoryId: typeof body.categoryId === 'string' ? body.categoryId : null,
      title,
      slug: slugify(title),
      content: body.content ? asRecord(body.content) : { type: 'doc', content: [] },
      excerpt: body.excerpt ? String(body.excerpt) : null,
      status: ((body.status as ArticleStatus | undefined) ?? 'not_started'),
    })
    .returning()
  if (tagIds.length > 0) {
    await database.insert(schema.articleTags).values(tagIds.map((tagId) => ({ articleId: row.id, tagId })))
  }
  return serializeArticle(row, tagIds)
}

export async function updateArticle(userId: string, articleId: string, body: Record<string, unknown>) {
  const database = requireDb()
  const existing = await getArticle(userId, articleId)
  if (!existing) return null

  const updates: Partial<typeof schema.articles.$inferInsert> = { updatedAt: new Date() }
  if (typeof body.title === 'string') {
    updates.title = body.title
    updates.slug = slugify(body.title)
  }
  if ('categoryId' in body) updates.categoryId = typeof body.categoryId === 'string' ? body.categoryId : null
  if ('content' in body) updates.content = asRecord(body.content)
  if ('excerpt' in body) updates.excerpt = body.excerpt ? String(body.excerpt) : null
  if (typeof body.status === 'string') updates.status = body.status as ArticleStatus
  if (typeof body.isArchived === 'boolean') updates.isArchived = body.isArchived

  const [row] = await database
    .update(schema.articles)
    .set(updates)
    .where(and(eq(schema.articles.id, articleId), eq(schema.articles.userId, userId)))
    .returning()
  if (!row) return null

  let tagIds = existing.tagIds
  if ('tagIds' in body) {
    tagIds = stringArray(body.tagIds)
    await database.delete(schema.articleTags).where(eq(schema.articleTags.articleId, articleId))
    if (tagIds.length > 0) {
      await database.insert(schema.articleTags).values(tagIds.map((tagId) => ({ articleId, tagId })))
    }
  }
  return serializeArticle(row, tagIds)
}

export async function deleteArticle(userId: string, articleId: string) {
  const [row] = await requireDb()
    .delete(schema.articles)
    .where(and(eq(schema.articles.id, articleId), eq(schema.articles.userId, userId)))
    .returning({ id: schema.articles.id })
  return Boolean(row)
}

export async function duplicateArticle(userId: string, articleId: string) {
  const database = requireDb()
  const original = await getArticle(userId, articleId)
  if (!original) return null
  const [row] = await database
    .insert(schema.articles)
    .values({
      userId,
      categoryId: original.categoryId,
      title: `${original.title} (Copy)`,
      slug: slugify(`${original.title}-copy-${Date.now()}`),
      content: original.content,
      excerpt: original.excerpt,
      status: original.status,
      isArchived: original.isArchived,
    })
    .returning()
  if (original.tagIds.length > 0) {
    await database.insert(schema.articleTags).values(
      original.tagIds.map((tagId) => ({ articleId: row.id, tagId })),
    )
  }
  return serializeArticle(row, original.tagIds)
}

export async function archiveArticle(userId: string, articleId: string) {
  return updateArticle(userId, articleId, { isArchived: true })
}

export async function listProblems(
  userId: string,
  filters: { difficulty?: string; tag?: string; search?: string },
) {
  const database = requireDb()
  const rows = await database
    .select()
    .from(schema.problems)
    .where(eq(schema.problems.userId, userId))
    .orderBy(desc(schema.problems.updatedAt))
  const tagIds = await problemTagMap(database, rows.map((problem) => problem.id))
  const query = filters.search?.toLowerCase()
  return rows
    .map((problem) => serializeProblem(problem, tagIds.get(problem.id) ?? []))
    .filter((problem) => !filters.difficulty || problem.difficulty === filters.difficulty)
    .filter((problem) => !filters.tag || problem.tagIds.includes(filters.tag))
    .filter((problem) => !query || problem.title.toLowerCase().includes(query))
}

export async function getProblem(userId: string, problemId: string) {
  const database = requireDb()
  const [row] = await database
    .select()
    .from(schema.problems)
    .where(and(eq(schema.problems.id, problemId), eq(schema.problems.userId, userId)))
    .limit(1)
  if (!row) return null
  const [tags, solutionRows, mistakeRows] = await Promise.all([
    problemTagMap(database, [problemId]),
    database.select().from(schema.solutions).where(eq(schema.solutions.problemId, problemId)),
    database.select().from(schema.mistakes).where(eq(schema.mistakes.problemId, problemId)),
  ])
  return {
    ...serializeProblem(row, tags.get(problemId) ?? []),
    solutions: solutionRows.map(serializeSolution),
    mistakes: mistakeRows.map(serializeMistake),
  }
}

export async function createProblem(userId: string, body: Record<string, unknown>) {
  const database = requireDb()
  const title = String(body.title)
  const tagIds = stringArray(body.tagIds)
  const [row] = await database
    .insert(schema.problems)
    .values({
      userId,
      title,
      slug: slugify(title),
      difficulty: ((body.difficulty as Difficulty | undefined) ?? 'medium'),
      description: String(body.description),
      constraints: body.constraints ? String(body.constraints) : null,
      examples: asArray(body.examples),
      source: body.source ? String(body.source) : null,
      learningNotes: body.learningNotes ? String(body.learningNotes) : null,
      isSolved: typeof body.isSolved === 'boolean' ? body.isSolved : false,
    })
    .returning()
  if (tagIds.length > 0) {
    await database.insert(schema.problemTags).values(tagIds.map((tagId) => ({ problemId: row.id, tagId })))
  }
  return serializeProblem(row, tagIds)
}

export async function updateProblem(userId: string, problemId: string, body: Record<string, unknown>) {
  const database = requireDb()
  const existing = await getProblem(userId, problemId)
  if (!existing) return null

  const updates: Partial<typeof schema.problems.$inferInsert> = { updatedAt: new Date() }
  if (typeof body.title === 'string') {
    updates.title = body.title
    updates.slug = slugify(body.title)
  }
  if (typeof body.difficulty === 'string') updates.difficulty = body.difficulty as Difficulty
  if (typeof body.description === 'string') updates.description = body.description
  if ('constraints' in body) updates.constraints = body.constraints ? String(body.constraints) : null
  if ('examples' in body) updates.examples = asArray(body.examples)
  if ('source' in body) updates.source = body.source ? String(body.source) : null
  if ('learningNotes' in body) updates.learningNotes = body.learningNotes ? String(body.learningNotes) : null
  if (typeof body.isSolved === 'boolean') updates.isSolved = body.isSolved

  const [row] = await database
    .update(schema.problems)
    .set(updates)
    .where(and(eq(schema.problems.id, problemId), eq(schema.problems.userId, userId)))
    .returning()
  if (!row) return null

  let tagIds = existing.tagIds
  if ('tagIds' in body) {
    tagIds = stringArray(body.tagIds)
    await database.delete(schema.problemTags).where(eq(schema.problemTags.problemId, problemId))
    if (tagIds.length > 0) {
      await database.insert(schema.problemTags).values(tagIds.map((tagId) => ({ problemId, tagId })))
    }
  }
  return serializeProblem(row, tagIds)
}

export async function deleteProblem(userId: string, problemId: string) {
  const [row] = await requireDb()
    .delete(schema.problems)
    .where(and(eq(schema.problems.id, problemId), eq(schema.problems.userId, userId)))
    .returning({ id: schema.problems.id })
  return Boolean(row)
}

export async function addSolution(userId: string, problemId: string, body: Record<string, unknown>) {
  const problem = await getProblem(userId, problemId)
  if (!problem) return null
  const [row] = await requireDb()
    .insert(schema.solutions)
    .values({
      problemId,
      title: String(body.title),
      explanation: body.explanation ? String(body.explanation) : null,
      code: String(body.code),
      language: body.language ? String(body.language) : 'typescript',
      timeComplexity: body.timeComplexity ? String(body.timeComplexity) : null,
      spaceComplexity: body.spaceComplexity ? String(body.spaceComplexity) : null,
      notes: body.notes ? String(body.notes) : null,
      isOptimal: typeof body.isOptimal === 'boolean' ? body.isOptimal : false,
    })
    .returning()
  return serializeSolution(row)
}

export async function addMistake(userId: string, problemId: string, body: Record<string, unknown>) {
  const problem = await getProblem(userId, problemId)
  if (!problem) return null
  const [row] = await requireDb()
    .insert(schema.mistakes)
    .values({
      problemId,
      type: body.type as MistakeType,
      description: String(body.description),
      lessonLearned: body.lessonLearned ? String(body.lessonLearned) : null,
    })
    .returning()
  return serializeMistake(row)
}

export async function listFlashcards(userId: string, filters: { category?: string; search?: string }) {
  const rows = await requireDb()
    .select()
    .from(schema.flashcards)
    .where(eq(schema.flashcards.userId, userId))
    .orderBy(desc(schema.flashcards.updatedAt))
  const query = filters.search?.toLowerCase()
  return rows
    .map(serializeFlashcard)
    .filter((card) => !filters.category || card.category === filters.category)
    .filter(
      (card) =>
        !query ||
        card.question.toLowerCase().includes(query) ||
        card.answer.toLowerCase().includes(query),
    )
}

export async function listDueFlashcards(userId: string) {
  const rows = await requireDb()
    .select()
    .from(schema.flashcards)
    .where(and(eq(schema.flashcards.userId, userId), lte(schema.flashcards.nextReviewAt, new Date())))
    .orderBy(schema.flashcards.nextReviewAt)
  return rows.map(serializeFlashcard)
}

export async function getFlashcard(userId: string, flashcardId: string) {
  const [row] = await requireDb()
    .select()
    .from(schema.flashcards)
    .where(and(eq(schema.flashcards.id, flashcardId), eq(schema.flashcards.userId, userId)))
    .limit(1)
  return row ? serializeFlashcard(row) : null
}

export async function createFlashcard(userId: string, body: Record<string, unknown>) {
  const [row] = await requireDb()
    .insert(schema.flashcards)
    .values({
      userId,
      category: String(body.category),
      question: String(body.question),
      answer: String(body.answer),
      difficulty: ((body.difficulty as Difficulty | undefined) ?? 'medium'),
      personalNotes: body.personalNotes ? String(body.personalNotes) : null,
      sourceNoteId: optionalString(body.sourceNoteId),
      nextReviewAt: new Date(),
      reviewIntervalDays: 1,
      reviewCount: 0,
    })
    .returning()
  return serializeFlashcard(row)
}

export async function updateFlashcard(userId: string, flashcardId: string, body: Record<string, unknown>) {
  const updates: Partial<typeof schema.flashcards.$inferInsert> = { updatedAt: new Date() }
  if (typeof body.category === 'string') updates.category = body.category
  if (typeof body.question === 'string') updates.question = body.question
  if (typeof body.answer === 'string') updates.answer = body.answer
  if (typeof body.difficulty === 'string') updates.difficulty = body.difficulty as Difficulty
  if ('personalNotes' in body) updates.personalNotes = body.personalNotes ? String(body.personalNotes) : null
  if ('sourceNoteId' in body) updates.sourceNoteId = optionalString(body.sourceNoteId)
  if ('nextReviewAt' in body) updates.nextReviewAt = optionalDate(body.nextReviewAt)
  if (typeof body.reviewIntervalDays === 'number') updates.reviewIntervalDays = body.reviewIntervalDays
  if (typeof body.reviewCount === 'number') updates.reviewCount = body.reviewCount

  const [row] = await requireDb()
    .update(schema.flashcards)
    .set(updates)
    .where(and(eq(schema.flashcards.id, flashcardId), eq(schema.flashcards.userId, userId)))
    .returning()
  return row ? serializeFlashcard(row) : null
}

export async function deleteFlashcard(userId: string, flashcardId: string) {
  const [row] = await requireDb()
    .delete(schema.flashcards)
    .where(and(eq(schema.flashcards.id, flashcardId), eq(schema.flashcards.userId, userId)))
    .returning({ id: schema.flashcards.id })
  return Boolean(row)
}

export async function reviewFlashcard(userId: string, flashcardId: string, rating: ReviewRating) {
  const card = await getFlashcard(userId, flashcardId)
  if (!card) return null

  let intervalIndex = REVIEW_INTERVALS.indexOf(card.reviewIntervalDays)
  if (rating === 'again') intervalIndex = 0
  else if (rating === 'hard') intervalIndex = Math.max(0, intervalIndex - 1)
  else if (rating === 'good') intervalIndex = Math.min(REVIEW_INTERVALS.length - 1, intervalIndex + 1)
  else intervalIndex = Math.min(REVIEW_INTERVALS.length - 1, intervalIndex + 2)

  const newInterval = REVIEW_INTERVALS[intervalIndex]
  const nextReviewAt = new Date()
  nextReviewAt.setDate(nextReviewAt.getDate() + newInterval)

  const database = requireDb()
  const [row] = await database
    .update(schema.flashcards)
    .set({
      reviewIntervalDays: newInterval,
      reviewCount: card.reviewCount + 1,
      nextReviewAt,
      updatedAt: new Date(),
    })
    .where(and(eq(schema.flashcards.id, flashcardId), eq(schema.flashcards.userId, userId)))
    .returning()
  if (!row) return null
  await database.insert(schema.reviews).values({ userId, flashcardId, rating, nextReviewAt })
  return serializeFlashcard(row)
}

export async function listRoadmaps(userId: string) {
  const database = requireDb()
  const rows = await database
    .select()
    .from(schema.roadmaps)
    .where(eq(schema.roadmaps.userId, userId))
    .orderBy(desc(schema.roadmaps.updatedAt))
  const roadmapIds = rows.map((roadmap) => roadmap.id)
  const items = roadmapIds.length
    ? await database
        .select()
        .from(schema.roadmapItems)
        .where(inArray(schema.roadmapItems.roadmapId, roadmapIds))
        .orderBy(schema.roadmapItems.orderIndex)
    : []
  return rows.map((roadmap) => ({
    ...serializeRoadmap(roadmap),
    items: items
      .filter((item) => item.roadmapId === roadmap.id)
      .map(serializeRoadmapItem),
  }))
}

export async function getRoadmap(userId: string, roadmapId: string) {
  const [row] = await requireDb()
    .select()
    .from(schema.roadmaps)
    .where(and(eq(schema.roadmaps.id, roadmapId), eq(schema.roadmaps.userId, userId)))
    .limit(1)
  if (!row) return null
  const items = await requireDb()
    .select()
    .from(schema.roadmapItems)
    .where(eq(schema.roadmapItems.roadmapId, roadmapId))
    .orderBy(schema.roadmapItems.orderIndex)
  return { ...serializeRoadmap(row), items: items.map(serializeRoadmapItem) }
}

export async function createRoadmap(userId: string, body: Record<string, unknown>) {
  const title = String(body.title)
  const [row] = await requireDb()
    .insert(schema.roadmaps)
    .values({
      userId,
      title,
      slug: slugify(title),
      description: body.description ? String(body.description) : null,
    })
    .returning()
  return serializeRoadmap(row)
}

export async function updateRoadmap(userId: string, roadmapId: string, body: Record<string, unknown>) {
  const updates: Partial<typeof schema.roadmaps.$inferInsert> = { updatedAt: new Date() }
  if (typeof body.title === 'string') {
    updates.title = body.title
    updates.slug = slugify(body.title)
  }
  if ('description' in body) updates.description = body.description ? String(body.description) : null

  const [row] = await requireDb()
    .update(schema.roadmaps)
    .set(updates)
    .where(and(eq(schema.roadmaps.id, roadmapId), eq(schema.roadmaps.userId, userId)))
    .returning()
  return row ? serializeRoadmap(row) : null
}

export async function deleteRoadmap(userId: string, roadmapId: string) {
  const [row] = await requireDb()
    .delete(schema.roadmaps)
    .where(and(eq(schema.roadmaps.id, roadmapId), eq(schema.roadmaps.userId, userId)))
    .returning({ id: schema.roadmaps.id })
  return Boolean(row)
}

export async function addRoadmapItem(userId: string, roadmapId: string, body: Record<string, unknown>) {
  const roadmap = await getRoadmap(userId, roadmapId)
  if (!roadmap) return null
  const existing = await requireDb()
    .select()
    .from(schema.roadmapItems)
    .where(eq(schema.roadmapItems.roadmapId, roadmapId))
  const [row] = await requireDb()
    .insert(schema.roadmapItems)
    .values({
      roadmapId,
      title: String(body.title),
      description: body.description ? String(body.description) : null,
      status: ((body.status as RoadmapItemStatus | undefined) ?? 'not_started'),
      orderIndex: existing.length,
    })
    .returning()
  return serializeRoadmapItem(row)
}

export async function updateRoadmapItem(userId: string, roadmapId: string, itemId: string, body: Record<string, unknown>) {
  const roadmap = await getRoadmap(userId, roadmapId)
  if (!roadmap) return null
  const updates: Partial<typeof schema.roadmapItems.$inferInsert> = { updatedAt: new Date() }
  if (typeof body.title === 'string') updates.title = body.title
  if ('description' in body) updates.description = body.description ? String(body.description) : null
  if (typeof body.status === 'string') updates.status = body.status as RoadmapItemStatus
  if (typeof body.orderIndex === 'number') updates.orderIndex = body.orderIndex

  const [row] = await requireDb()
    .update(schema.roadmapItems)
    .set(updates)
    .where(and(eq(schema.roadmapItems.id, itemId), eq(schema.roadmapItems.roadmapId, roadmapId)))
    .returning()
  return row ? serializeRoadmapItem(row) : null
}

export async function deleteRoadmapItem(userId: string, roadmapId: string, itemId: string) {
  const roadmap = await getRoadmap(userId, roadmapId)
  if (!roadmap) return false
  const [row] = await requireDb()
    .delete(schema.roadmapItems)
    .where(and(eq(schema.roadmapItems.id, itemId), eq(schema.roadmapItems.roadmapId, roadmapId)))
    .returning({ id: schema.roadmapItems.id })
  return Boolean(row)
}

export async function listDevProjects(userId: string) {
  const database = requireDb()
  const projects = await database
    .select()
    .from(schema.devProjects)
    .where(eq(schema.devProjects.userId, userId))
    .orderBy(schema.devProjects.name)
  const projectIds = projects.map((project) => project.id)
  const accounts = projectIds.length
    ? await database
        .select()
        .from(schema.devAccounts)
        .where(inArray(schema.devAccounts.projectId, projectIds))
        .orderBy(schema.devAccounts.name)
    : []
  const normalizedAccounts = await migrateLegacyEnvVarAccounts(database, accounts)
  return projects.map((project) => ({
    ...serializeDevProject(project),
    accounts: normalizedAccounts
      .filter((account) => account.projectId === project.id)
      .map(serializeDevAccount),
  }))
}

export async function createDevProject(userId: string, body: Record<string, unknown>) {
  const name = String(body.name).trim()
  const [row] = await requireDb()
    .insert(schema.devProjects)
    .values({
      userId,
      name,
      slug: slugify(name),
      description: body.description ? String(body.description).trim() : null,
    })
    .returning()
  return { ...serializeDevProject(row), accounts: [] }
}

export async function updateDevProject(userId: string, projectId: string, body: Record<string, unknown>) {
  const updates: Partial<typeof schema.devProjects.$inferInsert> = { updatedAt: new Date() }
  if (typeof body.name === 'string') {
    const name = body.name.trim()
    updates.name = name
    updates.slug = slugify(name)
  }
  if ('description' in body) updates.description = body.description ? String(body.description).trim() : null
  const [row] = await requireDb()
    .update(schema.devProjects)
    .set(updates)
    .where(and(eq(schema.devProjects.id, projectId), eq(schema.devProjects.userId, userId)))
    .returning()
  return row ? serializeDevProject(row) : null
}

export async function deleteDevProject(userId: string, projectId: string) {
  const [row] = await requireDb()
    .delete(schema.devProjects)
    .where(and(eq(schema.devProjects.id, projectId), eq(schema.devProjects.userId, userId)))
    .returning({ id: schema.devProjects.id })
  return Boolean(row)
}

export async function createDevAccount(userId: string, projectId: string, body: Record<string, unknown>) {
  const project = await getDevProject(userId, projectId)
  if (!project) return null
  const fields = coerceDevAccountWrite(body)
  if (!fields.name || !fields.password) return null
  if (fields.kind !== 'env_file' && !fields.username) return null
  const [row] = await requireDb()
    .insert(schema.devAccounts)
    .values({
      projectId,
      kind: fields.kind,
      provider: fields.provider,
      environment: fields.environment,
      name: fields.name,
      username: fields.username || '.env',
      password: encryptSecret(fields.password),
      url: fields.url,
      description: fields.description,
    })
    .returning()
  return serializeDevAccount(row)
}

export async function updateDevAccount(
  userId: string,
  projectId: string,
  accountId: string,
  body: Record<string, unknown>,
) {
  const project = await getDevProject(userId, projectId)
  if (!project) return null
  const [current] = await requireDb()
    .select()
    .from(schema.devAccounts)
    .where(and(eq(schema.devAccounts.id, accountId), eq(schema.devAccounts.projectId, projectId)))
    .limit(1)
  if (!current) return null

  const fields = coerceDevAccountWrite({
    kind: body.kind ?? current.kind,
    provider: 'provider' in body ? body.provider : current.provider,
    environment: body.environment ?? current.environment,
    name: body.name ?? current.name,
    username: body.username ?? current.username,
    password: 'password' in body ? body.password : decryptSecret(current.password),
    url: 'url' in body ? body.url : current.url,
    description: 'description' in body ? body.description : current.description,
  })

  const [row] = await requireDb()
    .update(schema.devAccounts)
    .set({
      updatedAt: new Date(),
      kind: fields.kind,
      provider: fields.provider,
      environment: fields.environment,
      name: fields.name,
      username: fields.username || '.env',
      password: encryptSecret(fields.password),
      url: fields.url,
      description: fields.description,
    })
    .where(and(eq(schema.devAccounts.id, accountId), eq(schema.devAccounts.projectId, projectId)))
    .returning()
  return row ? serializeDevAccount(row) : null
}

export async function deleteDevAccount(userId: string, projectId: string, accountId: string) {
  const project = await getDevProject(userId, projectId)
  if (!project) return false
  const [row] = await requireDb()
    .delete(schema.devAccounts)
    .where(and(eq(schema.devAccounts.id, accountId), eq(schema.devAccounts.projectId, projectId)))
    .returning({ id: schema.devAccounts.id })
  return Boolean(row)
}

export async function getDevAccountById(
  userId: string,
  accountId: string,
): Promise<{
  account: DevAccount
  projectId: string
  projectName: string
  projectSlug: string
} | null> {
  if (db) {
    const database = requireDb()
    const [row] = await database
      .select({
        account: schema.devAccounts,
        project: schema.devProjects,
      })
      .from(schema.devAccounts)
      .innerJoin(schema.devProjects, eq(schema.devAccounts.projectId, schema.devProjects.id))
      .where(and(eq(schema.devAccounts.id, accountId), eq(schema.devProjects.userId, userId)))
      .limit(1)
    if (!row) return null

    const [accountRow] = await migrateLegacyEnvVarAccounts(database, [row.account])
    const project = serializeDevProject(row.project)
    return {
      account: serializeDevAccount(accountRow),
      projectId: project.id,
      projectName: project.name,
      projectSlug: project.slug,
    }
  }

  const account = mockStore.devAccounts.find((row) => row.id === accountId)
  if (!account) return null

  if (account.kind === 'env_var') {
    const key = account.username.trim()
    const value = account.password
    const looksLikeBlock = value.includes('\n') || (value.includes('=') && !key)
    account.kind = 'env_file'
    account.username = '.env'
    account.password = looksLikeBlock ? value : key ? `${key}=${value}` : value
    account.provider = null
    account.url = null
    if (!account.name.trim()) account.name = key || 'Env file'
  }

  const project = mockStore.devProjects.find(
    (row) => row.id === account.projectId && row.userId === userId,
  )
  if (!project) return null

  return {
    account,
    projectId: project.id,
    projectName: project.name,
    projectSlug: project.slug,
  }
}

export async function listPersonalAccounts(
  userId: string,
  filters: { category?: string; search?: string } = {},
) {
  const rows = await requireDb()
    .select()
    .from(schema.personalAccounts)
    .where(eq(schema.personalAccounts.userId, userId))
    .orderBy(desc(schema.personalAccounts.updatedAt))

  const query = filters.search?.toLowerCase()
  return rows
    .map(serializePersonalAccount)
    .filter((account) => !filters.category || account.category === filters.category)
    .filter(
      (account) =>
        !query ||
        account.name.toLowerCase().includes(query) ||
        account.username.toLowerCase().includes(query) ||
        (account.notes?.toLowerCase().includes(query) ?? false),
    )
}

export async function getPersonalAccount(userId: string, accountId: string) {
  const [row] = await requireDb()
    .select()
    .from(schema.personalAccounts)
    .where(
      and(eq(schema.personalAccounts.id, accountId), eq(schema.personalAccounts.userId, userId)),
    )
    .limit(1)
  return row ? serializePersonalAccount(row) : null
}

export async function createPersonalAccount(userId: string, body: Record<string, unknown>) {
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const username = typeof body.username === 'string' ? body.username.trim() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  if (!name || !username || !password) {
    throw new Error('name, username, and password are required')
  }

  const [row] = await requireDb()
    .insert(schema.personalAccounts)
    .values({
      userId,
      category: asPersonalAccountCategory(body.category),
      name,
      username,
      password: encryptSecret(password),
      url: optionalString(body.url),
      notes: optionalString(body.notes),
    })
    .returning()
  return serializePersonalAccount(row)
}

export async function updatePersonalAccount(
  userId: string,
  accountId: string,
  body: Record<string, unknown>,
) {
  const updates: Partial<typeof schema.personalAccounts.$inferInsert> = {
    updatedAt: new Date(),
  }
  if (typeof body.category === 'string') updates.category = asPersonalAccountCategory(body.category)
  if (typeof body.name === 'string' && body.name.trim()) updates.name = body.name.trim()
  if (typeof body.username === 'string' && body.username.trim()) {
    updates.username = body.username.trim()
  }
  if ('password' in body && typeof body.password === 'string' && body.password.length > 0) {
    updates.password = encryptSecret(body.password)
  }
  if ('url' in body) updates.url = optionalString(body.url)
  if ('notes' in body) updates.notes = optionalString(body.notes)

  const [row] = await requireDb()
    .update(schema.personalAccounts)
    .set(updates)
    .where(
      and(eq(schema.personalAccounts.id, accountId), eq(schema.personalAccounts.userId, userId)),
    )
    .returning()
  return row ? serializePersonalAccount(row) : null
}

export async function deletePersonalAccount(userId: string, accountId: string) {
  const [row] = await requireDb()
    .delete(schema.personalAccounts)
    .where(
      and(eq(schema.personalAccounts.id, accountId), eq(schema.personalAccounts.userId, userId)),
    )
    .returning({ id: schema.personalAccounts.id })
  return Boolean(row)
}

async function getDevProject(userId: string, projectId: string) {
  const [row] = await requireDb()
    .select()
    .from(schema.devProjects)
    .where(and(eq(schema.devProjects.id, projectId), eq(schema.devProjects.userId, userId)))
    .limit(1)
  return row ? serializeDevProject(row) : null
}

export async function listNotes(userId: string, filters: NoteListFilters = {}) {
  const rows = await requireDb()
    .select()
    .from(schema.notes)
    .where(eq(schema.notes.userId, userId))
    .orderBy(desc(schema.notes.updatedAt))

  const query = filters.search?.toLowerCase()
  const tag = filters.tag?.toLowerCase()
  return rows
    .map(serializeNote)
    .filter((note) => noteMatchesArchivedFilter(note.isArchived, filters.archived))
    .filter((note) => (filters.pinned === 'true' ? note.isPinned : true))
    .filter((note) => (tag ? note.tags.includes(tag) : true))
    .filter((note) => {
      if (!query) return true
      const markdown =
        typeof note.content.markdown === 'string' ? note.content.markdown.toLowerCase() : ''
      return (
        note.title.toLowerCase().includes(query) ||
        markdown.includes(query) ||
        note.tags.some((t) => t.includes(query))
      )
    })
    .sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })
}

export async function getNote(userId: string, noteId: string) {
  const [row] = await requireDb()
    .select()
    .from(schema.notes)
    .where(and(eq(schema.notes.id, noteId), eq(schema.notes.userId, userId)))
    .limit(1)
  return row ? serializeNote(row) : null
}

export async function createNote(userId: string, body: Record<string, unknown>) {
  if (userId === MOCK_USER.id && !(await ensureUser(MOCK_USER))) {
    throw new Error('users table missing in Neon — run npm run db:push')
  }

  const title =
    typeof body.title === 'string' && body.title.trim() ? body.title.trim() : 'Untitled'
  const [row] = await requireDb()
    .insert(schema.notes)
    .values({
      userId,
      title,
      content: body.content ?? { markdown: '' },
      tags: normalizeNoteTags(body.tags),
      isPinned: Boolean(body.isPinned),
      isArchived: Boolean(body.isArchived),
    })
    .returning()
  return serializeNote(row)
}

export async function updateNote(userId: string, noteId: string, body: Record<string, unknown>) {
  const updates: Partial<typeof schema.notes.$inferInsert> = { updatedAt: new Date() }
  if (typeof body.title === 'string' && body.title.trim()) updates.title = body.title.trim()
  if (body.content !== undefined) updates.content = body.content
  if (body.tags !== undefined) updates.tags = normalizeNoteTags(body.tags)
  if (typeof body.isPinned === 'boolean') updates.isPinned = body.isPinned
  if (typeof body.isArchived === 'boolean') updates.isArchived = body.isArchived

  const [row] = await requireDb()
    .update(schema.notes)
    .set(updates)
    .where(and(eq(schema.notes.id, noteId), eq(schema.notes.userId, userId)))
    .returning()
  return row ? serializeNote(row) : null
}

export async function deleteNote(userId: string, noteId: string) {
  const [row] = await requireDb()
    .delete(schema.notes)
    .where(and(eq(schema.notes.id, noteId), eq(schema.notes.userId, userId)))
    .returning({ id: schema.notes.id })
  return Boolean(row)
}

export async function listReminders(
  userId: string,
  filters: { status?: string; search?: string } = {},
) {
  const rows = await requireDb()
    .select()
    .from(schema.reminders)
    .where(eq(schema.reminders.userId, userId))
    .orderBy(schema.reminders.remindAt)

  const nowMs = Date.now()
  const query = filters.search?.toLowerCase()

  return rows
    .map(serializeReminder)
    .filter((reminder) => {
      if (filters.status === 'completed') return reminder.isCompleted
      if (filters.status === 'upcoming') {
        return !reminder.isCompleted && new Date(reminder.remindAt).getTime() > nowMs
      }
      if (filters.status === 'overdue') {
        return !reminder.isCompleted && new Date(reminder.remindAt).getTime() <= nowMs
      }
      if (filters.status === 'active') return !reminder.isCompleted
      return true
    })
    .filter(
      (reminder) =>
        !query ||
        reminder.title.toLowerCase().includes(query) ||
        (reminder.body?.toLowerCase().includes(query) ?? false),
    )
    .sort((a, b) => {
      if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1
      return new Date(a.remindAt).getTime() - new Date(b.remindAt).getTime()
    })
}

export async function listDueReminders(userId: string) {
  const endOfToday = new Date()
  endOfToday.setHours(23, 59, 59, 999)
  const rows = await requireDb()
    .select()
    .from(schema.reminders)
    .where(
      and(
        eq(schema.reminders.userId, userId),
        eq(schema.reminders.isCompleted, false),
        lte(schema.reminders.remindAt, endOfToday),
      ),
    )
    .orderBy(schema.reminders.remindAt)
  return rows.map(serializeReminder)
}

export async function getReminder(userId: string, reminderId: string) {
  const [row] = await requireDb()
    .select()
    .from(schema.reminders)
    .where(and(eq(schema.reminders.id, reminderId), eq(schema.reminders.userId, userId)))
    .limit(1)
  return row ? serializeReminder(row) : null
}

export async function createReminder(userId: string, body: Record<string, unknown>) {
  const title = typeof body.title === 'string' ? body.title.trim() : ''
  if (!title) throw new Error('Title is required')
  const remindAt = optionalDate(body.remindAt)
  if (!remindAt) throw new Error('remindAt is required')

  const [row] = await requireDb()
    .insert(schema.reminders)
    .values({
      userId,
      title,
      body: optionalString(body.body),
      remindAt,
      isCompleted: false,
      completedAt: null,
    })
    .returning()
  return serializeReminder(row)
}

export async function updateReminder(
  userId: string,
  reminderId: string,
  body: Record<string, unknown>,
) {
  const current = await getReminder(userId, reminderId)
  if (!current) return null

  const updates: Partial<typeof schema.reminders.$inferInsert> = { updatedAt: new Date() }
  if (typeof body.title === 'string' && body.title.trim()) updates.title = body.title.trim()
  if ('body' in body) updates.body = optionalString(body.body)
  if ('remindAt' in body) {
    const remindAt = optionalDate(body.remindAt)
    if (remindAt) updates.remindAt = remindAt
  }
  if (typeof body.isCompleted === 'boolean') {
    updates.isCompleted = body.isCompleted
    updates.completedAt = body.isCompleted
      ? current.completedAt
        ? new Date(current.completedAt)
        : new Date()
      : null
  }

  const [row] = await requireDb()
    .update(schema.reminders)
    .set(updates)
    .where(and(eq(schema.reminders.id, reminderId), eq(schema.reminders.userId, userId)))
    .returning()
  return row ? serializeReminder(row) : null
}

export async function deleteReminder(userId: string, reminderId: string) {
  const [row] = await requireDb()
    .delete(schema.reminders)
    .where(and(eq(schema.reminders.id, reminderId), eq(schema.reminders.userId, userId)))
    .returning({ id: schema.reminders.id })
  return Boolean(row)
}

export type PlannerListFilters = {
  status?: string
  horizon?: string
  scope?: string
  project?: string
  search?: string
}

function normalizePlannerContent(body: Record<string, unknown>): Record<string, unknown> {
  if (body.content !== undefined) {
    return body.content && typeof body.content === 'object' && !Array.isArray(body.content)
      ? (body.content as Record<string, unknown>)
      : { markdown: '' }
  }
  if (typeof body.body === 'string' && body.body.trim()) return { markdown: body.body.trim() }
  return { markdown: '' }
}

function plannerSearchText(content: Record<string, unknown>) {
  if (typeof content.markdown === 'string') return content.markdown.toLowerCase()
  if (typeof content.body === 'string') return content.body.toLowerCase()
  return ''
}

function filterPlannerItems(items: PlannerItem[], filters: PlannerListFilters = {}) {
  const query = filters.search?.toLowerCase()
  const project = filters.project?.toLowerCase()

  return sortPlannerItems(
    items.filter((item) => {
      if (filters.status && item.status !== filters.status) return false
      if (filters.horizon && item.horizon !== filters.horizon) return false
      if (filters.scope && item.scope !== filters.scope) return false
      if (project && (item.projectName?.toLowerCase() ?? '') !== project) return false
      if (query && !item.title.toLowerCase().includes(query) && !plannerSearchText(item.content).includes(query)) {
        return false
      }
      return true
    }),
  )
}

export async function listPlannerItems(userId: string, filters: PlannerListFilters = {}) {
  const rows = await requireDb()
    .select()
    .from(schema.plannerItems)
    .where(eq(schema.plannerItems.userId, userId))

  return filterPlannerItems(rows.map(serializePlannerItem), filters)
}

export async function getPlannerItem(userId: string, plannerItemId: string) {
  const [row] = await requireDb()
    .select()
    .from(schema.plannerItems)
    .where(and(eq(schema.plannerItems.id, plannerItemId), eq(schema.plannerItems.userId, userId)))
    .limit(1)
  return row ? serializePlannerItem(row) : null
}

export async function createPlannerItem(userId: string, body: Record<string, unknown>) {
  const title = typeof body.title === 'string' ? body.title.trim() : ''
  if (!title) throw new Error('Title is required')

  const scope = asPlannerScope(body.scope)
  const projectName = optionalString(body.projectName)
  if (scope === 'project' && !projectName) {
    throw new Error('projectName is required when scope is project')
  }

  const [row] = await requireDb()
    .insert(schema.plannerItems)
    .values({
      userId,
      title,
      content: normalizePlannerContent(body),
      scope,
      projectName: scope === 'project' ? projectName : null,
      horizon: asPlannerHorizon(body.horizon),
      status: asPlannerStatus(body.status),
      targetDate: optionalDate(body.targetDate) ?? null,
    })
    .returning()
  return serializePlannerItem(row)
}

export async function updatePlannerItem(
  userId: string,
  plannerItemId: string,
  body: Record<string, unknown>,
) {
  const current = await getPlannerItem(userId, plannerItemId)
  if (!current) return null

  const updates: Partial<typeof schema.plannerItems.$inferInsert> = { updatedAt: new Date() }
  if (typeof body.title === 'string' && body.title.trim()) updates.title = body.title.trim()
  if (body.content !== undefined || 'body' in body) {
    updates.content = normalizePlannerContent(body)
  }
  if ('scope' in body) updates.scope = asPlannerScope(body.scope)
  if ('horizon' in body) updates.horizon = asPlannerHorizon(body.horizon)
  if ('status' in body) updates.status = asPlannerStatus(body.status)
  if ('projectName' in body) updates.projectName = optionalString(body.projectName)
  if ('targetDate' in body) updates.targetDate = optionalDate(body.targetDate) ?? null

  const scope = updates.scope ?? current.scope
  const projectName =
    'projectName' in body ? optionalString(body.projectName) : current.projectName
  if (scope === 'project' && !projectName) {
    throw new Error('projectName is required when scope is project')
  }
  updates.projectName = scope === 'project' ? projectName : null

  const [row] = await requireDb()
    .update(schema.plannerItems)
    .set(updates)
    .where(and(eq(schema.plannerItems.id, plannerItemId), eq(schema.plannerItems.userId, userId)))
    .returning()
  return row ? serializePlannerItem(row) : null
}

export async function deletePlannerItem(userId: string, plannerItemId: string) {
  const [row] = await requireDb()
    .delete(schema.plannerItems)
    .where(and(eq(schema.plannerItems.id, plannerItemId), eq(schema.plannerItems.userId, userId)))
    .returning({ id: schema.plannerItems.id })
  return Boolean(row)
}

export async function searchEverything(userId: string, query: string) {
  const q = query.toLowerCase()
  const { listNotesAnywhere } = await import('./notes-store.js')

  const [articles, problems, flashcards, notes] = await Promise.all([
    listArticles(userId, { search: q }),
    listProblems(userId, { search: q }),
    listFlashcards(userId, { search: q }),
    listNotesAnywhere(userId, { search: q }),
  ])
  return { articles, problems, flashcards, notes }
}
