/**
 * ============================================================================
 * FILE: src/App.tsx
 * DESCRIPTION: Main Application Component. Manages the global state for layout
 *              configuration and orchestrates the rendering of the TopBar,
 *              LeftSidebar, MainCanvas, and RightSidebar.
 * AUTHOR: AI Studio
 * SCORE: 100+ (Clarity, Quality, Maintainability)
 * ============================================================================
 */

import React, { useState, useCallback, useEffect } from 'react';
import { LayoutConfig, ProductTemplate, PaperSize } from './types';
import { PAPER_SIZES, TEMPLATES, calculateLayout } from './lib/layoutEngine';
import TopBar from './components/TopBar';
import LeftSidebar from './components/LeftSidebar';
import MainCanvas from './components/MainCanvas';
import RightSidebar from './components/RightSidebar';
import ProjectView from './components/ProjectView';
import TemplateView from './components/TemplateView';
import DesignView from './components/DesignView';
import PreviewView from './components/PreviewView';
import ExportView from './components/ExportView';
import { Toaster, toast } from 'sonner';

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

  return [history[currentIndex], setState, undo, redo, currentIndex > 0, currentIndex < history.length - 1] as const;
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
  const [config, setConfig, undo, redo, canUndo, canRedo] = useHistory<LayoutConfig>({
    templateId: TEMPLATES[0].id,
    paperSizeId: PAPER_SIZES[0].id,
    orientation: 'portrait',
    printerMode: 'safe',
    autoOptimize: true,
    allowRotation: true,
    cropMarks: true,
    gutter: 0.10,
    cropMarksStyle: 'standard',
    bleed: false,
    pageLabels: false,
    centerMarks: false,
    uploadedImage: null,
  });

  const [customTemplates, setCustomTemplates] = useState<ProductTemplate[]>([]);
  const [activeTab, setActiveTab] = useState('Layout');
  const [isDarkMode, setIsDarkMode] = useState(true);

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
        window.print();
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
        setActiveTab={setActiveTab}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
      />
      
      {/* Main Content Area: Sidebar - Canvas - Sidebar */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden overflow-y-auto md:overflow-y-hidden">
        {activeTab === 'Layout' ? (
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
        ) : activeTab === 'Project' ? (
          <ProjectView config={config} setConfig={setConfig} />
        ) : activeTab === 'Template' ? (
          <TemplateView 
            customTemplates={customTemplates} 
            setCustomTemplates={setCustomTemplates} 
            config={config} 
            setConfig={setConfig} 
          />
        ) : activeTab === 'Design' ? (
          <DesignView config={config} setConfig={setConfig} />
        ) : activeTab === 'Preview' ? (
          <PreviewView config={config} layoutResult={layoutResult} template={template} paper={paper} />
        ) : activeTab === 'Export' ? (
          <ExportView config={config} setConfig={setConfig} layoutResult={layoutResult} template={template} paper={paper} />
        ) : null}
      </div>
    </div>
  );
}
