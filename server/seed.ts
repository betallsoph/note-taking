import 'dotenv/config'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './db/schema.js'

const MOCK_USER_ID = '00000000-0000-4000-8000-000000000001'

async function seed() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error('DATABASE_URL is required for seeding')
    process.exit(1)
  }

  const client = postgres(connectionString)
  const db = drizzle(client, { schema })

  console.log('Seeding database...')

  await db.insert(schema.users).values({
    id: MOCK_USER_ID,
    email: 'learner@example.com',
    name: 'CS Learner',
  }).onConflictDoNothing()

  const categories = await db.insert(schema.categories).values([
    { userId: MOCK_USER_ID, name: 'Data Structures', slug: 'data-structures', color: '#10b981', icon: 'TreeStructure' },
    { userId: MOCK_USER_ID, name: 'Algorithms', slug: 'algorithms', color: '#3b82f6', icon: 'Graph' },
    { userId: MOCK_USER_ID, name: 'Databases', slug: 'databases', color: '#f59e0b', icon: 'Database' },
    { userId: MOCK_USER_ID, name: 'Backend', slug: 'backend', color: '#06b6d4', icon: 'Code' },
    { userId: MOCK_USER_ID, name: 'Frontend', slug: 'frontend', color: '#ec4899', icon: 'Browsers' },
    { userId: MOCK_USER_ID, name: 'Mobile', slug: 'mobile', color: '#22c55e', icon: 'DeviceMobile' },
    { userId: MOCK_USER_ID, name: 'Infra', slug: 'infra', color: '#6366f1', icon: 'Cloud' },
    { userId: MOCK_USER_ID, name: 'DevOps', slug: 'devops', color: '#f97316', icon: 'GitBranch' },
    { userId: MOCK_USER_ID, name: 'Security', slug: 'security', color: '#ef4444', icon: 'ShieldCheck' },
    { userId: MOCK_USER_ID, name: 'Operating Systems', slug: 'operating-systems', color: '#8b5cf6', icon: 'Desktop' },
    { userId: MOCK_USER_ID, name: 'System Design', slug: 'system-design', color: '#ec4899', icon: 'Cloud' },
  ]).returning()

  const tags = await db.insert(schema.tags).values([
    { userId: MOCK_USER_ID, name: 'Index', slug: 'index' },
    { userId: MOCK_USER_ID, name: 'BTree', slug: 'btree' },
    { userId: MOCK_USER_ID, name: 'PostgreSQL', slug: 'postgresql' },
    { userId: MOCK_USER_ID, name: 'Hash Map', slug: 'hash-map' },
    { userId: MOCK_USER_ID, name: 'Dynamic Programming', slug: 'dynamic-programming' },
    { userId: MOCK_USER_ID, name: 'Docker', slug: 'docker' },
    { userId: MOCK_USER_ID, name: 'Kubernetes', slug: 'kubernetes' },
    { userId: MOCK_USER_ID, name: 'CI/CD', slug: 'ci-cd' },
    { userId: MOCK_USER_ID, name: 'Flutter', slug: 'flutter' },
    { userId: MOCK_USER_ID, name: 'React Native', slug: 'react-native' },
    { userId: MOCK_USER_ID, name: 'AWS', slug: 'aws' },
    { userId: MOCK_USER_ID, name: 'Neon', slug: 'neon' },
    { userId: MOCK_USER_ID, name: 'MongoDB Atlas', slug: 'mongodb-atlas' },
  ]).returning()

  const dbCat = categories.find((c) => c.slug === 'databases')!
  const [article] = await db.insert(schema.articles).values({
    userId: MOCK_USER_ID,
    categoryId: dbCat.id,
    title: 'B-Tree Index Internals',
    slug: 'b-tree-index-internals',
    excerpt: 'Understanding how B-Tree indexes work in PostgreSQL',
    status: 'learning',
    content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'B-Trees are self-balancing tree data structures...' }] }] },
  }).returning()

  await db.insert(schema.articleTags).values([
    { articleId: article.id, tagId: tags[0].id },
    { articleId: article.id, tagId: tags[1].id },
    { articleId: article.id, tagId: tags[2].id },
  ])

  const [problem] = await db.insert(schema.problems).values({
    userId: MOCK_USER_ID,
    title: 'Two Sum',
    slug: 'two-sum',
    difficulty: 'easy',
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
    source: 'LeetCode #1',
    isSolved: true,
    learningNotes: 'Hash map approach is O(n) time',
  }).returning()

  await db.insert(schema.solutions).values({
    problemId: problem.id,
    title: 'Hash Map',
    explanation: 'Store complements in a hash map as we iterate',
    code: 'function twoSum(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (map.has(complement)) return [map.get(complement), i];\n    map.set(nums[i], i);\n  }\n}',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(n)',
    isOptimal: true,
  })

  await db.insert(schema.flashcards).values([
    {
      userId: MOCK_USER_ID,
      category: 'DB',
      question: 'What is MVCC?',
      answer: 'Multi-Version Concurrency Control allows multiple transactions to read and write concurrently without blocking.',
      difficulty: 'medium',
      nextReviewAt: new Date(),
    },
    {
      userId: MOCK_USER_ID,
      category: 'OS',
      question: 'What is a deadlock?',
      answer: 'A situation where processes are blocked forever, each waiting for a resource held by another.',
      difficulty: 'easy',
    },
  ])

  const [roadmap] = await db.insert(schema.roadmaps).values({
    userId: MOCK_USER_ID,
    title: 'Backend Roadmap',
    slug: 'backend-roadmap',
    description: 'Path to becoming a backend engineer',
  }).returning()

  await db.insert(schema.roadmapItems).values([
    { roadmapId: roadmap.id, title: 'Learn HTTP & REST', status: 'completed', orderIndex: 0 },
    { roadmapId: roadmap.id, title: 'Master SQL & PostgreSQL', status: 'in_progress', orderIndex: 1 },
    { roadmapId: roadmap.id, title: 'System Design Fundamentals', status: 'not_started', orderIndex: 2 },
  ])

  const [devProject] = await db.insert(schema.devProjects).values({
    userId: MOCK_USER_ID,
    name: 'CS Hub Staging',
    slug: 'cs-hub-staging',
    description: 'Staging / QA accounts for the learning hub',
  }).returning()

  await db.insert(schema.devAccounts).values([
    {
      projectId: devProject.id,
      kind: 'login',
      provider: 'CS Hub',
      environment: 'staging',
      name: 'Admin',
      username: 'admin@cshub.dev',
      password: 'Admin@123',
      url: null,
      description: 'Full access staging admin',
    },
    {
      projectId: devProject.id,
      kind: 'login',
      provider: 'CS Hub',
      environment: 'staging',
      name: 'QA Tester',
      username: 'qa.tester',
      password: 'QaTest!456',
      url: null,
      description: 'Read/write QA account for manual testing',
    },
    {
      projectId: devProject.id,
      kind: 'database',
      provider: 'MongoDB Atlas',
      environment: 'dev',
      name: 'Atlas Database User',
      username: 'hugoddt123450_db_user',
      password: 'example-secret',
      url: 'https://cloud.mongodb.com',
      description: 'Store generated database users and connection notes here instead of screenshots.',
    },
  ])

  await db.insert(schema.notes).values([
    {
      userId: MOCK_USER_ID,
      title: 'Random thoughts',
      content: {
        markdown:
          'Capture anything here — meeting notes, ideas, grocery lists, whatever.\n\n- Keep it messy\n- Pin the useful ones',
      },
      isPinned: true,
    },
    {
      userId: MOCK_USER_ID,
      title: 'Weekend reading list',
      content: {
        markdown: '1. Designing Data-Intensive Applications ch.3\n2. PostgreSQL MVCC deep dive',
      },
      isPinned: false,
    },
  ])

  await db.insert(schema.reminders).values([
    {
      userId: MOCK_USER_ID,
      title: 'Review flashcards',
      body: 'Do a quick OS + DB pass before bed',
      remindAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
      isCompleted: false,
    },
    {
      userId: MOCK_USER_ID,
      title: 'Submit internship application',
      body: null,
      remindAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      isCompleted: false,
    },
  ])

  console.log('Seed complete!')
  await client.end()
}

seed().catch(console.error)
