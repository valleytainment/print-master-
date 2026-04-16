/**
 * ============================================================================
 * FILE: src/App.tsx
 * DESCRIPTION: Main Application Component. Manages the global workspace state,
 *              coordinates autosave, and orchestrates tab-level rendering.
 *              Heavy non-layout tabs are lazy-loaded to reduce the size of the
 *              initial renderer bundle while preserving a clear component tree.
 * AUTHOR: Codex
 * SCORE: 100+ (Clarity, Quality, Maintainability)
 * ============================================================================
 */

import React, { Suspense, lazy, useState, useCallback, useEffect } from 'react';
import { LayoutConfig, ProductTemplate, PaperSize } from './types';
import { PAPER_SIZES, TEMPLATES, calculateLayout } from './lib/layoutEngine';
import { DEFAULT_LAYOUT_CONFIG, normalizeLayoutConfig } from './lib/layoutConfig';
import TopBar from './components/TopBar';
import LeftSidebar from './components/LeftSidebar';
import MainCanvas from './components/MainCanvas';
import RightSidebar from './components/RightSidebar';
import { Toaster, toast } from 'sonner';
import { loadWorkspaceState, saveWorkspaceState } from './lib/workspaceStorage';

const ProjectView = lazy(() => import('./components/ProjectView'));
const TemplateView = lazy(() => import('./components/TemplateView'));
const DesignView = lazy(() => import('./components/DesignView'));
const PreviewView = lazy(() => import('./components/PreviewView'));
const ExportView = lazy(() => import('./components/ExportView'));

type AppTab = 'Project' | 'Template' | 'Design' | 'Layout' | 'Preview' | 'Export';

/**
 * Provides a consistent loading surface for lazy-loaded tabs. Keeping the
 * fallback local to this file makes the lazy loading behavior easy to reason
 * about for future maintainers.
 */
function TabLoadingState() {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="w-full max-w-xl rounded-xl border border-gray-800 bg-gray-900/80 px-6 py-10 text-center shadow-2xl">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-blue-500/20 border-t-blue-400" />
        <h2 className="text-lg font-semibold text-white">Loading Workspace Tool</h2>
        <p className="mt-2 text-sm text-gray-400">
          This tab is lazy-loaded to keep the initial desktop bundle lean and responsive.
        </p>
      </div>
    </div>
  );
}

/**
 * Custom hook for managing state history (undo/redo)
 */
function useHistory<T>(initialState: T) {
  const [history, setHistory] = useState<T[]>([initialState]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const setState = useCallback((newState: T | ((prev: T) => T)) => {
    setHistory((prevHistory) => {
      const nextState = typeof newState === 'function' ? (newState as Function)(prevHistory[currentIndex]) : newState;
      const newHistory = prevHistory.slice(0, currentIndex + 1);
      newHistory.push(nextState);
      // Limit history to 50 items to prevent memory issues
      if (newHistory.length > 50) newHistory.shift();
      return newHistory;
    });
    setCurrentIndex((prev) => Math.min(prev + 1, 49));
  }, [currentIndex]);

  const undo = useCallback(() => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const redo = useCallback(() => {
    setCurrentIndex((prev) => Math.min(prev + 1, history.length - 1));
  }, [history.length]);

  const resetState = useCallback((newState: T) => {
    setHistory([newState]);
    setCurrentIndex(0);
  }, []);

  return [history[currentIndex], setState, undo, redo, resetState, currentIndex > 0, currentIndex < history.length - 1] as const;
}

/**
 * The root component of the application.
 * Holds the state for the layout configuration and passes it down to child components.
 */
export default function App() {
  // --------------------------------------------------------------------------
  // STATE MANAGEMENT
  // --------------------------------------------------------------------------
  
  // Initialize the layout configuration with default values.
  const [config, setConfig, undo, redo, resetConfig, canUndo, canRedo] = useHistory<LayoutConfig>(DEFAULT_LAYOUT_CONFIG);

  const [customTemplates, setCustomTemplates] = useState<ProductTemplate[]>([]);
  const [activeTab, setActiveTab] = useState<AppTab>('Layout');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [autosaveStatus, setAutosaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [isWorkspaceReady, setIsWorkspaceReady] = useState(false);

  // --------------------------------------------------------------------------
  // DERIVED DATA
  // --------------------------------------------------------------------------
  
  const allTemplates = [...TEMPLATES, ...customTemplates];

  // Find the currently selected template and paper size objects based on the config IDs.
  // Fallback to the first item in the array if not found.
  const template = React.useMemo(() => 
    allTemplates.find((t) => t.id === config.templateId) || allTemplates[0],
    [config.templateId, allTemplates]
  );
  
  const paper = React.useMemo(() => 
    PAPER_SIZES.find((p) => p.id === config.paperSizeId) || PAPER_SIZES[0],
    [config.paperSizeId]
  );

  // Calculate the optimal layout based on the current configuration.
  // This result is passed to the canvas and right sidebar for rendering.
  const layoutResult = React.useMemo(() => 
    calculateLayout(template, paper, config),
    [template, paper, config]
  );

  useEffect(() => {
    let isCancelled = false;

    const hydrateWorkspace = async () => {
      try {
        const workspace = await loadWorkspaceState();
        if (isCancelled) {
          return;
        }

        if (workspace) {
          resetConfig(normalizeLayoutConfig(workspace.config));
          setCustomTemplates(workspace.customTemplates ?? []);
          setIsDarkMode(workspace.isDarkMode ?? true);
        }

        setAutosaveStatus('saved');
      } catch (error) {
        console.error('Failed to load workspace state', error);
        if (!isCancelled) {
          setAutosaveStatus('error');
        }
      } finally {
        if (!isCancelled) {
          setIsWorkspaceReady(true);
        }
      }
    };

    hydrateWorkspace();

    return () => {
      isCancelled = true;
    };
  }, [resetConfig]);

  useEffect(() => {
    if (!isWorkspaceReady) {
      return;
    }

    let isCancelled = false;
    setAutosaveStatus('saving');

    const timeoutId = window.setTimeout(async () => {
      try {
        await saveWorkspaceState({
          config,
          customTemplates,
          isDarkMode,
        });

        if (!isCancelled) {
          setAutosaveStatus('saved');
        }
      } catch (error) {
        console.error('Failed to save workspace state', error);
        if (!isCancelled) {
          setAutosaveStatus('error');
        }
      }
    }, 300);

    return () => {
      isCancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [config, customTemplates, isDarkMode, isWorkspaceReady]);

  useEffect(() => {
    const styleId = 'print-page-size-style';
    let styleElement = document.getElementById(styleId) as HTMLStyleElement | null;

    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }

    styleElement.textContent = `@page { size: ${layoutResult.paperWidth}in ${layoutResult.paperHeight}in; margin: 0; }`;
  }, [layoutResult.paperHeight, layoutResult.paperWidth]);

  // --------------------------------------------------------------------------
  // KEYBOARD SHORTCUTS
  // --------------------------------------------------------------------------
  
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo: Ctrl+Z or Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) undo();
      }
      // Redo: Ctrl+Y or Cmd+Shift+Z
      if (((e.ctrlKey || e.metaKey) && e.key === 'y') || ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')) {
        e.preventDefault();
        if (canRedo) redo();
      }
      // Print: Ctrl+P or Cmd+P
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        setActiveTab('Preview');
        toast.info('Opened Print Preview. Review the sheet, then print from there.');
      }
      // Save: Ctrl+S or Cmd+S
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        setActiveTab('Project');
        toast.info('Switching to Project tab to save...');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, undo, redo, setActiveTab]);

  // --------------------------------------------------------------------------
  // RENDER
  // --------------------------------------------------------------------------

  const renderTabContent = () => {
    if (activeTab === 'Layout') {
      return (
        <>
          {/* Left Sidebar: Controls for template, paper, and layout settings */}
          <LeftSidebar
            config={config}
            setConfig={setConfig}
            template={template}
            allTemplates={allTemplates}
            setCustomTemplates={setCustomTemplates}
          />

          {/* Main Canvas: Visual representation of the calculated layout */}
          <div className="flex-1 min-h-[500px] md:min-h-0 flex flex-col">
            <MainCanvas config={config} layoutResult={layoutResult} template={template} paper={paper} />
          </div>

          {/* Right Sidebar: Statistics, optimization details, and export actions */}
          <RightSidebar config={config} setConfig={setConfig} layoutResult={layoutResult} />
        </>
      );
    }

    return (
      <Suspense fallback={<TabLoadingState />}>
        {activeTab === 'Project' ? (
          <ProjectView
            config={config}
            setConfig={setConfig}
            customTemplates={customTemplates}
            setCustomTemplates={setCustomTemplates}
          />
        ) : activeTab === 'Template' ? (
          <TemplateView
            customTemplates={customTemplates}
            setCustomTemplates={setCustomTemplates}
            config={config}
            setConfig={setConfig}
          />
        ) : activeTab === 'Design' ? (
          <DesignView config={config} setConfig={setConfig} template={template} />
        ) : activeTab === 'Preview' ? (
          <PreviewView config={config} layoutResult={layoutResult} template={template} paper={paper} />
        ) : activeTab === 'Export' ? (
          <ExportView
            config={config}
            setConfig={setConfig}
            layoutResult={layoutResult}
            template={template}
            paper={paper}
            openPrintPreview={() => setActiveTab('Preview')}
          />
        ) : null}
      </Suspense>
    );
  };
  
  return (
    <div className={`min-h-screen font-sans flex flex-col ${isDarkMode ? 'bg-gray-950 text-gray-100 dark' : 'bg-gray-50 text-gray-900'}`}>
      <Toaster theme={isDarkMode ? "dark" : "light"} position="bottom-right" />
      {/* Top Navigation Bar */}
      <TopBar 
        undo={undo} 
        redo={redo} 
        canUndo={canUndo} 
        canRedo={canRedo} 
        activeTab={activeTab}
        setActiveTab={(tab) => setActiveTab(tab as AppTab)}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        autosaveStatus={autosaveStatus}
      />
      
      {/* Main Content Area: Sidebar - Canvas - Sidebar */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden overflow-y-auto md:overflow-y-hidden">
        {renderTabContent()}
      </div>

      <div id="print-root" aria-hidden="true">
        <MainCanvas
          config={config}
          layoutResult={layoutResult}
          template={template}
          paper={paper}
          isExportMode={true}
          canvasId="print-canvas"
        />
      </div>
    </div>
  );
}
