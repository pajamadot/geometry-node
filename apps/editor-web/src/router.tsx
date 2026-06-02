import { createBrowserRouter } from 'react-router-dom';
import RootLayout from './RootLayout';
import LandingPage from '../app/page';
import EditorPage from '../app/editor/page';
import InvestorsPage from '../app/investors/page';
import WhitepaperPage from '../app/whitepaper/page';

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/editor', element: <EditorPage /> },
      { path: '/investors', element: <InvestorsPage /> },
      { path: '/whitepaper', element: <WhitepaperPage /> },
    ],
  },
]);
