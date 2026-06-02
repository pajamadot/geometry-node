import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import RootLayout from './RootLayout';

// Lazy-load route components so the heavy editor (three.js + reactflow + r3f)
// is only fetched when /editor is visited — the landing page stays light.
const LandingPage = lazy(() => import('../app/page'));
const EditorPage = lazy(() => import('../app/editor/page'));
const InvestorsPage = lazy(() => import('../app/investors/page'));
const WhitepaperPage = lazy(() => import('../app/whitepaper/page'));
const ProjectPickerPage = lazy(() => import('../app/components/ProjectPicker'));

const Fallback = (
  <div style={{ minHeight: '60vh', display: 'grid', placeItems: 'center', color: '#9ca3af' }}>
    Loading…
  </div>
);
const lazyRoute = (el: ReactNode) => <Suspense fallback={Fallback}>{el}</Suspense>;

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/', element: lazyRoute(<LandingPage />) },
      // /editor — T6 auto-default flow (no explicit project id)
      { path: '/editor', element: lazyRoute(<EditorPage />) },
      // /editor/:projectId — open a specific project by id
      { path: '/editor/:projectId', element: lazyRoute(<EditorPage />) },
      { path: '/projects', element: lazyRoute(<ProjectPickerPage />) },
      { path: '/investors', element: lazyRoute(<InvestorsPage />) },
      { path: '/whitepaper', element: lazyRoute(<WhitepaperPage />) },
    ],
  },
]);
