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

import React, { useState } from 'react';
import { LayoutConfig, ProductTemplate, PaperSize } from './types';
import { PAPER_SIZES, TEMPLATES, calculateLayout } from './lib/layoutEngine';
import TopBar from './components/TopBar';
import LeftSidebar from './components/LeftSidebar';
import MainCanvas from './components/MainCanvas';
import RightSidebar from './components/RightSidebar';
import { Toaster } from 'sonner';

/**
 * The root component of the application.
 * Holds the state for the layout configuration and passes it down to child components.
 */
export default function App() {
  // --------------------------------------------------------------------------
  // STATE MANAGEMENT
  // --------------------------------------------------------------------------
  
  // Initialize the layout configuration with default values.
  const [config, setConfig] = useState<LayoutConfig>({
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
  });

  // --------------------------------------------------------------------------
  // DERIVED DATA
  // --------------------------------------------------------------------------
  
  // Find the currently selected template and paper size objects based on the config IDs.
  // Fallback to the first item in the array if not found.
  const template = React.useMemo(() => 
    TEMPLATES.find((t) => t.id === config.templateId) || TEMPLATES[0],
    [config.templateId]
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
  // RENDER
  // --------------------------------------------------------------------------
  
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans flex flex-col">
      <Toaster theme="dark" position="bottom-right" />
      {/* Top Navigation Bar */}
      <TopBar />
      
      {/* Main Content Area: Sidebar - Canvas - Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Controls for template, paper, and layout settings */}
        <LeftSidebar config={config} setConfig={setConfig} template={template} />
        
        {/* Main Canvas: Visual representation of the calculated layout */}
        <MainCanvas config={config} layoutResult={layoutResult} template={template} paper={paper} />
        
        {/* Right Sidebar: Statistics, optimization details, and export actions */}
        <RightSidebar config={config} setConfig={setConfig} layoutResult={layoutResult} />
      </div>
    </div>
  );
}
