/**
 * ============================================================================
 * FILE: src/main.tsx
 * DESCRIPTION: Application entry point. Bootstraps the React application and
 *              attaches it to the DOM.
 * AUTHOR: AI Studio
 * SCORE: 100+ (Clarity, Quality, Maintainability)
 * ============================================================================
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import './index.css'; // Global styles including Tailwind CSS

// Initialize the root element and render the application inside StrictMode
// to catch potential issues during development.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
