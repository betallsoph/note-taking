import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { KnowledgePage } from '@/features/knowledge/KnowledgePage'
import { ArticleDetailPage } from '@/features/knowledge/ArticleDetailPage'
import { DsaVisualizerPage } from '@/features/dsa-visualizer/pages/DsaVisualizerPage'
import { ProblemsPage } from '@/features/problems/ProblemsPage'
import { ProblemDetailPage } from '@/features/problems/ProblemDetailPage'
import { FlashcardsPage } from '@/features/flashcards/FlashcardsPage'
import { RoadmapsPage } from '@/features/roadmaps/RoadmapsPage'
import { ReviewsPage } from '@/features/reviews/ReviewsPage'
import { InterviewHubPage } from '@/features/interview/InterviewHubPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'knowledge', element: <KnowledgePage /> },
      { path: 'knowledge/:id', element: <ArticleDetailPage /> },
      { path: 'dsa', element: <DsaVisualizerPage /> },
      { path: 'problems', element: <ProblemsPage /> },
      { path: 'problems/:id', element: <ProblemDetailPage /> },
      { path: 'flashcards', element: <FlashcardsPage /> },
      { path: 'roadmaps', element: <RoadmapsPage /> },
      { path: 'reviews', element: <ReviewsPage /> },
      { path: 'interview', element: <InterviewHubPage /> },
    ],
  },
])
