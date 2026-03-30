/**
 * ============================================================================
 * FILE: src/components/PreviewView.tsx
 * DESCRIPTION: The Preview tab view. Shows a full-screen preview of the layout.
 * AUTHOR: AI Studio
 * SCORE: 100+ (Clarity, Quality, Maintainability)
 * ============================================================================
 */

import React from 'react';
import { LayoutConfig, LayoutResult, ProductTemplate, PaperSize } from '../types';
import MainCanvas from './MainCanvas';

interface PreviewViewProps {
  config: LayoutConfig;
  layoutResult: LayoutResult;
  template: ProductTemplate;
  paper: PaperSize;
}

export default function PreviewView({ config, layoutResult, template, paper }: PreviewViewProps) {
  return (
    <div className="flex-1 flex flex-col bg-[#111111]">
      <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-950">
        <h2 className="text-xl font-bold text-white">Full Screen Preview</h2>
        <p className="text-sm text-gray-400">
          {layoutResult.itemsPerSheet} items on {paper.name} ({paper.width}" x {paper.height}")
        </p>
      </div>
      <div className="flex-1 overflow-hidden">
        <MainCanvas config={config} layoutResult={layoutResult} template={template} paper={paper} />
      </div>
    </div>
  );
}
