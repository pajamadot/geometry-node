import React from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import { RouterProvider } from 'react-router-dom';
import '@fontsource-variable/geist';
import '@fontsource/geist-mono';
import { router } from './router';
import '../app/globals.css';

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ClerkProvider
      publishableKey={publishableKey}
      appearance={{ variables: { colorPrimary: '#8b5cf6' } }}
    >
      <RouterProvider router={router} />
    </ClerkProvider>
  </React.StrictMode>,
);
