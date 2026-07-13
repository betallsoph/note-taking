import {
  pgTable,
  uuid,
  text,
  timestamp,
  pgEnum,
  integer,
  boolean,
  jsonb,
  primaryKey,
  index,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const articleStatusEnum = pgEnum('article_status', [
  'not_started',
  'learning',
  'completed',
  'need_review',
])

export const difficultyEnum = pgEnum('difficulty', ['easy', 'medium', 'hard'])

export const roadmapItemStatusEnum = pgEnum('roadmap_item_status', [
  'not_started',
  'in_progress',
  'completed',
])

export const mistakeTypeEnum = pgEnum('mistake_type', [
  'wrong_answer',
  'tle',
  'mle',
  'logic_error',
])

export const reviewRatingEnum = pgEnum('review_rating', [
  'again',
  'hard',
  'good',
  'easy',
])

export const simulationTypeEnum = pgEnum('simulation_type', [
  'array',
  'linked_list',
  'stack',
  'queue',
  'hash_table',
  'heap',
  'binary_search_tree',
  'avl_tree',
  'trie',
  'graph',
  'bubble_sort',
  'selection_sort',
  'insertion_sort',
  'merge_sort',
  'quick_sort',
  'bfs',
  'dfs',
  'dijkstra',
  'kruskal',
  'prim',
  'bst_insert',
  'bst_delete',
  'tree_traversal',
])

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
  icon: text('icon'),
  color: text('color'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  color: text('color'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const articles = pgTable(
  'articles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
    title: text('title').notNull(),
    slug: text('slug').notNull(),
    content: jsonb('content').notNull().default({}),
    excerpt: text('excerpt'),
    status: articleStatusEnum('status').notNull().default('not_started'),
    isArchived: boolean('is_archived').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('articles_user_id_idx').on(table.userId),
    index('articles_category_id_idx').on(table.categoryId),
    index('articles_status_idx').on(table.status),
  ],
)

export const articleTags = pgTable(
  'article_tags',
  {
    articleId: uuid('article_id')
      .notNull()
      .references(() => articles.id, { onDelete: 'cascade' }),
    tagId: uuid('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (table) => [primaryKey({ columns: [table.articleId, table.tagId] })],
)

export const problems = pgTable(
  'problems',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    slug: text('slug').notNull(),
    difficulty: difficultyEnum('difficulty').notNull().default('medium'),
    description: text('description').notNull(),
    constraints: text('constraints'),
    examples: jsonb('examples').default([]),
    source: text('source'),
    learningNotes: text('learning_notes'),
    isSolved: boolean('is_solved').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('problems_user_id_idx').on(table.userId)],
)

export const problemTags = pgTable(
  'problem_tags',
  {
    problemId: uuid('problem_id')
      .notNull()
      .references(() => problems.id, { onDelete: 'cascade' }),
    tagId: uuid('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (table) => [primaryKey({ columns: [table.problemId, table.tagId] })],
)

export const solutions = pgTable('solutions', {
  id: uuid('id').primaryKey().defaultRandom(),
  problemId: uuid('problem_id')
    .notNull()
    .references(() => problems.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  explanation: text('explanation'),
  code: text('code').notNull(),
  language: text('language').notNull().default('typescript'),
  timeComplexity: text('time_complexity'),
  spaceComplexity: text('space_complexity'),
  notes: text('notes'),
  isOptimal: boolean('is_optimal').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const mistakes = pgTable('mistakes', {
  id: uuid('id').primaryKey().defaultRandom(),
  problemId: uuid('problem_id')
    .notNull()
    .references(() => problems.id, { onDelete: 'cascade' }),
  type: mistakeTypeEnum('type').notNull(),
  description: text('description').notNull(),
  lessonLearned: text('lesson_learned'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const flashcards = pgTable(
  'flashcards',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    category: text('category').notNull(),
    question: text('question').notNull(),
    answer: text('answer').notNull(),
    difficulty: difficultyEnum('difficulty').notNull().default('medium'),
    personalNotes: text('personal_notes'),
    nextReviewAt: timestamp('next_review_at', { withTimezone: true }),
    reviewIntervalDays: integer('review_interval_days').notNull().default(1),
    reviewCount: integer('review_count').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('flashcards_user_id_idx').on(table.userId)],
)

export const reviews = pgTable('reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  flashcardId: uuid('flashcard_id')
    .notNull()
    .references(() => flashcards.id, { onDelete: 'cascade' }),
  rating: reviewRatingEnum('rating').notNull(),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }).defaultNow().notNull(),
  nextReviewAt: timestamp('next_review_at', { withTimezone: true }).notNull(),
})

export const roadmaps = pgTable('roadmaps', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const roadmapItems = pgTable('roadmap_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  roadmapId: uuid('roadmap_id')
    .notNull()
    .references(() => roadmaps.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  status: roadmapItemStatusEnum('status').notNull().default('not_started'),
  orderIndex: integer('order_index').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const simulations = pgTable('simulations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: simulationTypeEnum('type').notNull(),
  title: text('title').notNull(),
  inputData: jsonb('input_data').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const devProjects = pgTable(
  'dev_projects',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    description: text('description'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('dev_projects_user_id_idx').on(table.userId)],
)

export const devAccounts = pgTable(
  'dev_accounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => devProjects.id, { onDelete: 'cascade' }),
    kind: text('kind').notNull().default('login'),
    provider: text('provider'),
    environment: text('environment').notNull().default('dev'),
    name: text('name').notNull(),
    username: text('username').notNull(),
    password: text('password').notNull(),
    url: text('url'),
    description: text('description'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('dev_accounts_project_id_idx').on(table.projectId)],
)

export const simulationSteps = pgTable('simulation_steps', {
  id: uuid('id').primaryKey().defaultRandom(),
  simulationId: uuid('simulation_id')
    .notNull()
    .references(() => simulations.id, { onDelete: 'cascade' }),
  stepIndex: integer('step_index').notNull(),
  state: jsonb('state').notNull(),
  description: text('description'),
  highlightIndices: jsonb('highlight_indices').default([]),
})

export const usersRelations = relations(users, ({ many }) => ({
  categories: many(categories),
  tags: many(tags),
  articles: many(articles),
  problems: many(problems),
  flashcards: many(flashcards),
  roadmaps: many(roadmaps),
  reviews: many(reviews),
  simulations: many(simulations),
  devProjects: many(devProjects),
}))

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  user: one(users, { fields: [categories.userId], references: [users.id] }),
  articles: many(articles),
}))

export const tagsRelations = relations(tags, ({ one, many }) => ({
  user: one(users, { fields: [tags.userId], references: [users.id] }),
  articleTags: many(articleTags),
  problemTags: many(problemTags),
}))

export const articlesRelations = relations(articles, ({ one, many }) => ({
  user: one(users, { fields: [articles.userId], references: [users.id] }),
  category: one(categories, { fields: [articles.categoryId], references: [categories.id] }),
  articleTags: many(articleTags),
}))

export const articleTagsRelations = relations(articleTags, ({ one }) => ({
  article: one(articles, { fields: [articleTags.articleId], references: [articles.id] }),
  tag: one(tags, { fields: [articleTags.tagId], references: [tags.id] }),
}))

export const problemsRelations = relations(problems, ({ one, many }) => ({
  user: one(users, { fields: [problems.userId], references: [users.id] }),
  solutions: many(solutions),
  mistakes: many(mistakes),
  problemTags: many(problemTags),
}))

export const problemTagsRelations = relations(problemTags, ({ one }) => ({
  problem: one(problems, { fields: [problemTags.problemId], references: [problems.id] }),
  tag: one(tags, { fields: [problemTags.tagId], references: [tags.id] }),
}))

export const solutionsRelations = relations(solutions, ({ one }) => ({
  problem: one(problems, { fields: [solutions.problemId], references: [problems.id] }),
}))

export const mistakesRelations = relations(mistakes, ({ one }) => ({
  problem: one(problems, { fields: [mistakes.problemId], references: [problems.id] }),
}))

export const flashcardsRelations = relations(flashcards, ({ one, many }) => ({
  user: one(users, { fields: [flashcards.userId], references: [users.id] }),
  reviews: many(reviews),
}))

export const reviewsRelations = relations(reviews, ({ one }) => ({
  user: one(users, { fields: [reviews.userId], references: [users.id] }),
  flashcard: one(flashcards, { fields: [reviews.flashcardId], references: [flashcards.id] }),
}))

export const roadmapsRelations = relations(roadmaps, ({ one, many }) => ({
  user: one(users, { fields: [roadmaps.userId], references: [users.id] }),
  items: many(roadmapItems),
}))

export const roadmapItemsRelations = relations(roadmapItems, ({ one }) => ({
  roadmap: one(roadmaps, { fields: [roadmapItems.roadmapId], references: [roadmaps.id] }),
}))

export const simulationsRelations = relations(simulations, ({ one, many }) => ({
  user: one(users, { fields: [simulations.userId], references: [users.id] }),
  steps: many(simulationSteps),
}))

export const simulationStepsRelations = relations(simulationSteps, ({ one }) => ({
  simulation: one(simulations, {
    fields: [simulationSteps.simulationId],
    references: [simulations.id],
  }),
}))

export const devProjectsRelations = relations(devProjects, ({ one, many }) => ({
  user: one(users, { fields: [devProjects.userId], references: [users.id] }),
  accounts: many(devAccounts),
}))

export const devAccountsRelations = relations(devAccounts, ({ one }) => ({
  project: one(devProjects, {
    fields: [devAccounts.projectId],
    references: [devProjects.id],
  }),
}))
