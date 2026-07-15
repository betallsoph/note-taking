import type { AuthUser } from './middleware/auth.js'
import { MOCK_USER } from './middleware/auth.js'

export type ArticleStatus = 'not_started' | 'learning' | 'completed' | 'need_review'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type RoadmapItemStatus = 'not_started' | 'in_progress' | 'completed'
export type MistakeType = 'wrong_answer' | 'tle' | 'mle' | 'logic_error'
export type ReviewRating = 'again' | 'hard' | 'good' | 'easy'
export type DevCredentialKind =
  | 'login'
  | 'api_key'
  | 'database'
  | 'connection_string'
  | 'oauth_client'
  | 'webhook_secret'
  | 'ssh_key'
  | 'env_file'
  /** @deprecated Migrated to env_file on read; kept for older rows. */
  | 'env_var'

export interface Category {
  id: string
  userId: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  color: string | null
  createdAt: string
  updatedAt: string
}

export interface Tag {
  id: string
  userId: string
  name: string
  slug: string
  color: string | null
  createdAt: string
}

export interface Article {
  id: string
  userId: string
  categoryId: string | null
  title: string
  slug: string
  content: Record<string, unknown>
  excerpt: string | null
  status: ArticleStatus
  isArchived: boolean
  tagIds: string[]
  createdAt: string
  updatedAt: string
}

export interface Problem {
  id: string
  userId: string
  title: string
  slug: string
  difficulty: Difficulty
  description: string
  constraints: string | null
  examples: unknown[]
  source: string | null
  learningNotes: string | null
  isSolved: boolean
  tagIds: string[]
  createdAt: string
  updatedAt: string
}

export interface Solution {
  id: string
  problemId: string
  title: string
  explanation: string | null
  code: string
  language: string
  timeComplexity: string | null
  spaceComplexity: string | null
  notes: string | null
  isOptimal: boolean
  createdAt: string
  updatedAt: string
}

export interface Mistake {
  id: string
  problemId: string
  type: MistakeType
  description: string
  lessonLearned: string | null
  createdAt: string
}

export interface Flashcard {
  id: string
  userId: string
  category: string
  question: string
  answer: string
  difficulty: Difficulty
  personalNotes: string | null
  nextReviewAt: string | null
  reviewIntervalDays: number
  reviewCount: number
  createdAt: string
  updatedAt: string
}

export interface Roadmap {
  id: string
  userId: string
  title: string
  slug: string
  description: string | null
  createdAt: string
  updatedAt: string
}

export interface RoadmapItem {
  id: string
  roadmapId: string
  title: string
  description: string | null
  status: RoadmapItemStatus
  orderIndex: number
  createdAt: string
  updatedAt: string
}

export interface DevProject {
  id: string
  userId: string
  name: string
  slug: string
  description: string | null
  createdAt: string
  updatedAt: string
}

export interface DevAccount {
  id: string
  projectId: string
  kind: DevCredentialKind
  provider: string | null
  environment: string
  name: string
  username: string
  password: string
  url: string | null
  description: string | null
  createdAt: string
  updatedAt: string
}

export type PersonalAccountCategory =
  | 'email'
  | 'social'
  | 'school'
  | 'streaming'
  | 'shopping'
  | 'finance'
  | 'other'

export interface PersonalAccount {
  id: string
  userId: string
  category: PersonalAccountCategory
  name: string
  username: string
  password: string
  url: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface Note {
  id: string
  userId: string
  title: string
  content: Record<string, unknown>
  tags: string[]
  isPinned: boolean
  isArchived: boolean
  createdAt: string
  updatedAt: string
}

export interface Reminder {
  id: string
  userId: string
  title: string
  body: string | null
  remindAt: string
  isCompleted: boolean
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface DashboardStats {
  totalArticles: number
  totalProblems: number
  totalFlashcards: number
  totalRoadmaps: number
  totalNotes: number
  topicsCompleted: number
  learningStreak: number
  reviewDueToday: number
  remindersDueToday: number
  recentlyUpdatedNotes: Article[]
}

function id() {
  return crypto.randomUUID()
}

function now() {
  return new Date().toISOString()
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

class MockStore {
  categories: Category[] = []
  tags: Tag[] = []
  articles: Article[] = []
  problems: Problem[] = []
  solutions: Solution[] = []
  mistakes: Mistake[] = []
  flashcards: Flashcard[] = []
  roadmaps: Roadmap[] = []
  roadmapItems: RoadmapItem[] = []
  notes: Note[] = []
  reminders: Reminder[] = []
  personalAccounts: PersonalAccount[] = []
  devProjects: DevProject[] = []
  devAccounts: DevAccount[] = []

  seed(user: AuthUser) {
    if (this.categories.length > 0) return

    const catData = [
      { name: 'Data Structures', icon: 'TreeStructure', color: '#10b981' },
      { name: 'Algorithms', icon: 'Graph', color: '#3b82f6' },
      { name: 'Databases', icon: 'Database', color: '#f59e0b' },
      { name: 'Backend', icon: 'Code', color: '#06b6d4' },
      { name: 'Frontend', icon: 'Browsers', color: '#ec4899' },
      { name: 'Mobile', icon: 'DeviceMobile', color: '#22c55e' },
      { name: 'Infra', icon: 'Cloud', color: '#6366f1' },
      { name: 'DevOps', icon: 'GitBranch', color: '#f97316' },
      { name: 'Security', icon: 'ShieldCheck', color: '#ef4444' },
      { name: 'Operating Systems', icon: 'Desktop', color: '#8b5cf6' },
      { name: 'System Design', icon: 'Cloud', color: '#ec4899' },
    ]

    this.categories = catData.map((c) => ({
      id: id(),
      userId: user.id,
      name: c.name,
      slug: slugify(c.name),
      description: `Notes and resources for ${c.name}`,
      icon: c.icon,
      color: c.color,
      createdAt: now(),
      updatedAt: now(),
    }))

    const tagNames = [
      'Index',
      'BTree',
      'PostgreSQL',
      'Hash Map',
      'Dynamic Programming',
      'Graph',
      'Recursion',
      'Docker',
      'Kubernetes',
      'CI/CD',
      'Flutter',
      'React Native',
      'AWS',
      'Neon',
      'MongoDB Atlas',
    ]
    this.tags = tagNames.map((name) => ({
      id: id(),
      userId: user.id,
      name,
      slug: slugify(name),
      color: '#64748b',
      createdAt: now(),
    }))

    const dbCat = this.categories.find((c) => c.slug === 'databases')!
    this.articles = [
      {
        id: id(),
        userId: user.id,
        categoryId: dbCat.id,
        title: 'B-Tree Index Internals',
        slug: 'b-tree-index-internals',
        content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'B-Trees are self-balancing tree data structures...' }],
            },
          ],
        },
        excerpt: 'Understanding how B-Tree indexes work in PostgreSQL',
        status: 'learning',
        isArchived: false,
        tagIds: [this.tags[0].id, this.tags[1].id, this.tags[2].id],
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: id(),
        userId: user.id,
        categoryId: this.categories.find((c) => c.slug === 'algorithms')!.id,
        title: 'Dynamic Programming Patterns',
        slug: 'dynamic-programming-patterns',
        content: { type: 'doc', content: [] },
        excerpt: 'Common DP patterns for interview prep',
        status: 'completed',
        isArchived: false,
        tagIds: [this.tags[4].id],
        createdAt: now(),
        updatedAt: now(),
      },
    ]

    this.problems = [
      {
        id: id(),
        userId: user.id,
        title: 'Two Sum',
        slug: 'two-sum',
        difficulty: 'easy',
        description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
        constraints: '2 <= nums.length <= 10^4',
        examples: [{ input: 'nums = [2,7,11,15], target = 9', output: '[0,1]' }],
        source: 'LeetCode #1',
        learningNotes: 'Hash map approach is O(n) time',
        isSolved: true,
        tagIds: [this.tags[3].id],
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: id(),
        userId: user.id,
        title: 'Longest Increasing Subsequence',
        slug: 'longest-increasing-subsequence',
        difficulty: 'medium',
        description: 'Given an integer array nums, return the length of the longest strictly increasing subsequence.',
        constraints: '1 <= nums.length <= 2500',
        examples: [{ input: 'nums = [10,9,2,5,3,7,101,18]', output: '4' }],
        source: 'LeetCode #300',
        learningNotes: null,
        isSolved: false,
        tagIds: [this.tags[4].id],
        createdAt: now(),
        updatedAt: now(),
      },
    ]

    this.solutions = [
      {
        id: id(),
        problemId: this.problems[0].id,
        title: 'Hash Map',
        explanation: 'Store complements in a hash map as we iterate',
        code: 'function twoSum(nums: number[], target: number): number[] {\n  const map = new Map<number, number>();\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (map.has(complement)) return [map.get(complement)!, i];\n    map.set(nums[i], i);\n  }\n  return [];\n}',
        language: 'typescript',
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(n)',
        notes: 'Single pass solution',
        isOptimal: true,
        createdAt: now(),
        updatedAt: now(),
      },
    ]

    this.flashcards = [
      {
        id: id(),
        userId: user.id,
        category: 'DB',
        question: 'What is MVCC?',
        answer: 'Multi-Version Concurrency Control allows multiple transactions to read and write concurrently without blocking by maintaining multiple versions of data.',
        difficulty: 'medium',
        personalNotes: 'Used by PostgreSQL',
        nextReviewAt: new Date().toISOString(),
        reviewIntervalDays: 1,
        reviewCount: 0,
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: id(),
        userId: user.id,
        category: 'OS',
        question: 'What is a deadlock?',
        answer: 'A situation where two or more processes are blocked forever, each waiting for a resource held by another.',
        difficulty: 'easy',
        personalNotes: null,
        nextReviewAt: new Date(Date.now() + 86400000).toISOString(),
        reviewIntervalDays: 3,
        reviewCount: 1,
        createdAt: now(),
        updatedAt: now(),
      },
    ]

    const roadmapId = id()
    this.roadmaps = [
      {
        id: roadmapId,
        userId: user.id,
        title: 'Backend Roadmap',
        slug: 'backend-roadmap',
        description: 'Path to becoming a backend engineer',
        createdAt: now(),
        updatedAt: now(),
      },
    ]

    this.roadmapItems = [
      { id: id(), roadmapId, title: 'Learn HTTP & REST', description: null, status: 'completed', orderIndex: 0, createdAt: now(), updatedAt: now() },
      { id: id(), roadmapId, title: 'Master SQL & PostgreSQL', description: null, status: 'in_progress', orderIndex: 1, createdAt: now(), updatedAt: now() },
      { id: id(), roadmapId, title: 'System Design Fundamentals', description: null, status: 'not_started', orderIndex: 2, createdAt: now(), updatedAt: now() },
    ]

    this.notes = [
      {
        id: id(),
        userId: user.id,
        title: 'Random thoughts',
        content: {
          markdown:
            'Capture anything here — meeting notes, ideas, grocery lists, whatever.\n\n- Keep it messy\n- Pin the useful ones\n- Tag lightly when it helps',
        },
        tags: ['inbox', 'idea'],
        isPinned: true,
        isArchived: false,
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: id(),
        userId: user.id,
        title: 'Weekend reading list',
        content: {
          markdown: '1. Designing Data-Intensive Applications ch.3\n2. PostgreSQL MVCC deep dive\n3. Sketch a notification system',
        },
        tags: ['study'],
        isPinned: false,
        isArchived: false,
        createdAt: now(),
        updatedAt: now(),
      },
    ]

    this.personalAccounts = [
      {
        id: id(),
        userId: user.id,
        category: 'email',
        name: 'Personal Gmail',
        username: 'learner@gmail.com',
        password: 'example-mail-pass',
        url: 'https://mail.google.com',
        notes: 'Recovery phone on file',
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: id(),
        userId: user.id,
        category: 'school',
        name: 'University portal',
        username: '2212662',
        password: 'example-school-pass',
        url: 'https://portal.example.edu',
        notes: null,
        createdAt: now(),
        updatedAt: now(),
      },
    ]

    const inTwoHours = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    this.reminders = [
      {
        id: id(),
        userId: user.id,
        title: 'Review flashcards',
        body: 'Do a quick OS + DB pass before bed',
        remindAt: inTwoHours,
        isCompleted: false,
        completedAt: null,
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: id(),
        userId: user.id,
        title: 'Submit internship application',
        body: null,
        remindAt: yesterday,
        isCompleted: false,
        completedAt: null,
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: id(),
        userId: user.id,
        title: 'Buy new notebook',
        body: 'Done — got the dotted one',
        remindAt: yesterday,
        isCompleted: true,
        completedAt: now(),
        createdAt: now(),
        updatedAt: now(),
      },
    ]

    const projectId = id()
    this.devProjects = [
      {
        id: projectId,
        userId: user.id,
        name: 'CS Hub Staging',
        slug: 'cs-hub-staging',
        description: 'Staging / QA accounts for the learning hub',
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: id(),
        userId: user.id,
        name: 'Side Project API',
        slug: 'side-project-api',
        description: 'Dev credentials for the side project backend',
        createdAt: now(),
        updatedAt: now(),
      },
    ]

    this.devAccounts = [
      {
        id: id(),
        projectId,
        kind: 'login',
        provider: 'CS Hub',
        environment: 'staging',
        name: 'Admin',
        username: 'admin@cshub.dev',
        password: 'Admin@123',
        url: null,
        description: 'Full access staging admin',
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: id(),
        projectId,
        kind: 'login',
        provider: 'CS Hub',
        environment: 'staging',
        name: 'QA Tester',
        username: 'qa.tester',
        password: 'QaTest!456',
        url: null,
        description: 'Read/write QA account for manual testing',
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: id(),
        projectId,
        kind: 'database',
        provider: 'MongoDB Atlas',
        environment: 'dev',
        name: 'Atlas Database User',
        username: 'hugoddt123450_db_user',
        password: 'example-secret',
        url: 'https://cloud.mongodb.com',
        description: 'Store generated DB users and connection notes here instead of screenshots.',
        createdAt: now(),
        updatedAt: now(),
      },
    ]
  }

  getDashboardStats(userId: string): DashboardStats {
    const userArticles = this.articles.filter((a) => a.userId === userId && !a.isArchived)
    const endOfToday = new Date()
    endOfToday.setHours(23, 59, 59, 999)

    return {
      totalArticles: userArticles.length,
      totalProblems: this.problems.filter((p) => p.userId === userId).length,
      totalFlashcards: this.flashcards.filter((f) => f.userId === userId).length,
      totalRoadmaps: this.roadmaps.filter((r) => r.userId === userId).length,
      totalNotes: this.notes.filter((n) => n.userId === userId).length,
      topicsCompleted: userArticles.filter((a) => a.status === 'completed').length,
      learningStreak: 7,
      reviewDueToday: this.flashcards.filter(
        (f) => f.userId === userId && f.nextReviewAt && new Date(f.nextReviewAt) <= new Date(),
      ).length,
      remindersDueToday: this.reminders.filter(
        (r) =>
          r.userId === userId &&
          !r.isCompleted &&
          new Date(r.remindAt) <= endOfToday,
      ).length,
      recentlyUpdatedNotes: [...userArticles]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 5),
    }
  }
}

export const mockStore = new MockStore()
mockStore.seed(MOCK_USER)

export { slugify, id, now }
