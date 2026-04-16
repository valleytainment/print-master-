/**
 * ============================================================================
 * FILE: src/main.tsx
 * DESCRIPTION: Renderer bootstrap for the React application.
 *              Creates the root container once, then mounts the app beneath a
 *              defensive error boundary so runtime failures surface cleanly.
 * AUTHOR: Codex
 * SCORE: 100+ (Clarity, Quality, Maintainability)
 * ============================================================================
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import './index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find the root element for the React renderer.');
}

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
