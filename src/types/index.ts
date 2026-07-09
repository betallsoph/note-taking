export type ArticleStatus = 'not_started' | 'learning' | 'completed' | 'need_review'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type RoadmapItemStatus = 'not_started' | 'in_progress' | 'completed'
export type MistakeType = 'wrong_answer' | 'tle' | 'mle' | 'logic_error'
export type ReviewRating = 'again' | 'hard' | 'good' | 'easy'

export interface User {
  id: string
  email: string
  name: string
}

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

export interface ProblemDetail extends Problem {
  solutions: Solution[]
  mistakes: Mistake[]
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

export interface Roadmap {
  id: string
  userId: string
  title: string
  slug: string
  description: string | null
  createdAt: string
  updatedAt: string
  items?: RoadmapItem[]
}

export interface DevAccount {
  id: string
  projectId: string
  name: string
  username: string
  password: string
  description: string | null
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
  accounts?: DevAccount[]
}

export interface DashboardStats {
  totalArticles: number
  totalProblems: number
  totalFlashcards: number
  totalRoadmaps: number
  topicsCompleted: number
  learningStreak: number
  reviewDueToday: number
  recentlyUpdatedNotes: Article[]
}

export interface SimulationStep {
  stepIndex: number
  state: Record<string, unknown>
  description: string
  highlightIndices?: number[]
}

export interface SimulationResult {
  type: string
  title: string
  steps: SimulationStep[]
}

export interface SearchResults {
  articles: Article[]
  problems: Problem[]
  flashcards: Flashcard[]
}

export const ARTICLE_STATUS_LABELS: Record<ArticleStatus, string> = {
  not_started: 'Not Started',
  learning: 'Learning',
  completed: 'Completed',
  need_review: 'Need Review',
}

export const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  easy: 'text-emerald-500',
  medium: 'text-amber-500',
  hard: 'text-rose-500',
}

export const INTERVIEW_CATEGORIES = [
  'OS', 'DB', 'Network', 'OOP', 'Java', 'Spring', 'React', 'Mobile', 'System Design',
] as const
