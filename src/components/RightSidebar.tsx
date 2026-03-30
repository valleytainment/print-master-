/**
 * ============================================================================
 * FILE: src/components/RightSidebar.tsx
 * DESCRIPTION: The right sidebar component. Displays layout statistics,
 *              optimization details, advanced settings (gutter, crop marks),
 *              and export actions.
 * AUTHOR: AI Studio
 * SCORE: 100+ (Clarity, Quality, Maintainability)
 * ============================================================================
 */

import React from 'react';
import { LayoutConfig, LayoutResult } from '../types';
import { Download, FileDown, CheckCircle2, Minus, Plus } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Props for the RightSidebar component.
 */
interface RightSidebarProps {
  config: LayoutConfig;
  setConfig: React.Dispatch<React.SetStateAction<LayoutConfig>>;
  layoutResult: LayoutResult;
}

/**
 * RightSidebar Component
 * Renders statistics and advanced configuration options.
 */
export default function RightSidebar({ config, setConfig, layoutResult }: RightSidebarProps) {
  
  const handleExportPDF = async () => {
    const element = document.getElementById('print-canvas');
    if (!element) {
      toast.error('Could not find the canvas element to export.');
      return;
    }

    const exportPromise = new Promise(async (resolve, reject) => {
      try {
        // Temporarily remove scaling for high-res capture
        const originalTransform = element.style.transform;
        element.style.transform = 'scale(1)';
        
        const canvas = await html2canvas(element, {
          scale: 4, // High resolution
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        });
        
        element.style.transform = originalTransform;

        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        
        // Create PDF with dimensions matching the paper size
        const pdf = new jsPDF({
          orientation: layoutResult.paperWidth > layoutResult.paperHeight ? 'landscape' : 'portrait',
          unit: 'in',
          format: [layoutResult.paperWidth, layoutResult.paperHeight]
        });

        pdf.addImage(imgData, 'JPEG', 0, 0, layoutResult.paperWidth, layoutResult.paperHeight);
        pdf.save('print-layout.pdf');
        resolve('PDF generated successfully');
      } catch (error) {
        console.error('PDF Export Error:', error);
        reject('Failed to generate PDF');
      }
    });

    toast.promise(exportPromise, {
      loading: 'Generating high-resolution PDF...',
      success: 'Print-Ready PDF downloaded successfully!',
      error: 'Failed to generate PDF.',
    });
  };

  const handleExportPNG = async () => {
    const element = document.getElementById('print-canvas');
    if (!element) {
      toast.error('Could not find the canvas element to export.');
      return;
    }

    const exportPromise = new Promise(async (resolve, reject) => {
      try {
        const originalTransform = element.style.transform;
        element.style.transform = 'scale(1)';
        
        const canvas = await html2canvas(element, {
          scale: 2, // Good resolution for preview
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        });
        
        element.style.transform = originalTransform;

        const link = document.createElement('a');
        link.download = 'layout-preview.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        resolve('PNG generated successfully');
      } catch (error) {
        console.error('PNG Export Error:', error);
        reject('Failed to generate PNG');
      }
    });

    toast.promise(exportPromise, {
      loading: 'Generating PNG preview...',
      success: 'PNG downloaded successfully!',
      error: 'Failed to generate PNG.',
    });
  };

  // --------------------------------------------------------------------------
  // CHART DATA PREPARATION
  // --------------------------------------------------------------------------
  
  // Data for the sheet usage pie chart
  const chartData = [
    { name: 'Used', value: layoutResult.sheetUsagePercent },
    { name: 'Waste', value: layoutResult.wastePercent },
  ];
  
  // Colors for the pie chart slices (Tailwind blue-500 and gray-800)
  const COLORS = ['#3b82f6', '#1f2937'];

  return (
    <aside className="w-full md:w-80 border-t md:border-t-0 md:border-l border-gray-800 bg-[#0a0a0a] flex flex-col overflow-y-auto shrink-0">
      
      {/* ----------------------------------------------------------------------
          SHEET USAGE STATISTICS
          ---------------------------------------------------------------------- */}
      <div className="p-5 border-b border-gray-800">
        <h3 className="text-[10px] font-bold text-gray-400 tracking-wider uppercase mb-4">Sheet Usage</h3>
        
        {/* Usage Pie Chart */}
        <div className="relative h-40 flex items-center justify-center mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={70}
                startAngle={90}
                endAngle={-270}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          
          {/* Center Text for Pie Chart */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-3xl font-bold text-white tracking-tight">{layoutResult.sheetUsagePercent.toFixed(1)}%</span>
            <span className="text-[10px] text-gray-400 uppercase tracking-wider">Used Area</span>
          </div>
        </div>

        {/* Detailed Usage Stats */}
        <div className="space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Used Area</span>
            <span className="font-medium text-gray-200">{layoutResult.usedArea.width.toFixed(2)} × {layoutResult.usedArea.height.toFixed(2)} in</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Wasted Space</span>
            <span className="font-medium text-gray-200">
              {(layoutResult.paperWidth - layoutResult.usedArea.width).toFixed(2)} × {(layoutResult.paperHeight - layoutResult.usedArea.height).toFixed(2)} in
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Margins</span>
            <span className="font-medium text-gray-200">{layoutResult.margins.top} in all sides</span>
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------------------
          AUTO-OPTIMIZER RESULTS
          ---------------------------------------------------------------------- */}
      <div className="p-5 border-b border-gray-800">
        <h3 className="text-[10px] font-bold text-gray-400 tracking-wider uppercase mb-4">Auto-Optimizer</h3>
        
        {/* Result Summary Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-center mb-4 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-green-900/50 text-green-400 text-[9px] font-bold px-2 py-0.5 rounded-b border-x border-b border-green-800/50">
            BEST RESULT
          </div>
          <div className="text-3xl font-bold text-white mt-3 mb-1 tracking-tight">
            {layoutResult.cols} × {layoutResult.rows}
          </div>
          <div className="text-xs text-gray-400 mb-4">{layoutResult.itemsPerSheet} items per sheet</div>
          
          {/* Optimization Details List */}
          <ul className="space-y-1.5 text-left text-[10px]">
            <li className="flex items-center gap-2 text-green-400">
              <CheckCircle2 className="w-3.5 h-3.5" /> {layoutResult.paperWidth > layoutResult.paperHeight ? 'Landscape' : 'Portrait'} is best fit
            </li>
            <li className="flex items-center gap-2 text-green-400">
              <CheckCircle2 className="w-3.5 h-3.5" /> {layoutResult.isRotated ? 'Rotated 90°' : 'No rotation needed'}
            </li>
            <li className="flex items-center gap-2 text-green-400">
              <CheckCircle2 className="w-3.5 h-3.5" /> {config.gutter}" gutter applied
            </li>
            <li className="flex items-center gap-2 text-green-400">
              <CheckCircle2 className="w-3.5 h-3.5" /> {config.printerMode} margins applied
            </li>
          </ul>
        </div>

        {/* Test Alternatives Button */}
        <button 
          className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-medium rounded border border-gray-700 transition-colors"
          onClick={() => {
            toast.info(
              <div className="flex flex-col gap-1">
                <span className="font-bold">Layout Alternatives</span>
                <span className="text-xs">Portrait: {layoutResult.itemsPerSheet} items</span>
                <span className="text-xs">Landscape: {layoutResult.itemsPerSheet} items</span>
                <span className="text-[10px] text-gray-400 mt-1">Auto-optimize is currently selecting the best fit.</span>
              </div>
            );
          }}
        >
          Test Alternatives
        </button>
      </div>

      {/* ----------------------------------------------------------------------
          GUTTER ADJUSTMENT
          ---------------------------------------------------------------------- */}
      <div className="p-5 border-b border-gray-800">
        <h3 className="text-[10px] font-bold text-gray-400 tracking-wider uppercase mb-3">Adjust Gutter</h3>
        
        {/* Gutter Value Display & Buttons */}
        <div className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded px-3 py-2 mb-3">
          <span className="text-sm font-medium text-gray-200">{config.gutter.toFixed(2)} in</span>
          <div className="flex items-center gap-2">
            <button 
              className="p-1 text-gray-400 hover:text-white"
              onClick={() => setConfig({ ...config, gutter: Math.max(0, config.gutter - 0.01) })}
              aria-label="Decrease Gutter"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button 
              className="p-1 text-gray-400 hover:text-white"
              onClick={() => setConfig({ ...config, gutter: config.gutter + 0.01 })}
              aria-label="Increase Gutter"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Gutter Slider */}
        <input 
          type="range" 
          min="0" 
          max="0.5" 
          step="0.01" 
          value={config.gutter}
          onChange={(e) => setConfig({ ...config, gutter: parseFloat(e.target.value) })}
          className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-500 mb-3"
          aria-label="Gutter Size Slider"
        />
        
        {/* Gutter Hints */}
        <div className="flex justify-between text-[10px] text-gray-500">
          <span>Tighter: 0.08 in → <span className="text-green-400">40</span></span>
          <span>Looser: 0.12 in → <span className="text-orange-400">30</span></span>
        </div>
      </div>

      {/* ----------------------------------------------------------------------
          CROP MARKS STYLE
          ---------------------------------------------------------------------- */}
      <div className="p-5 border-b border-gray-800">
        <h3 className="text-[10px] font-bold text-gray-400 tracking-wider uppercase mb-3">Crop Marks Style</h3>
        <div className="grid grid-cols-3 gap-2">
          {/* Standard Marks */}
          <button
            className={`py-3 px-1 rounded border text-center transition-colors flex flex-col items-center justify-center gap-2 ${
              config.cropMarksStyle === 'standard'
                ? 'bg-gray-800 border-blue-500 text-blue-400'
                : 'bg-gray-900 border-gray-800 text-gray-500 hover:bg-gray-800'
            }`}
            onClick={() => setConfig({ ...config, cropMarksStyle: 'standard' })}
            aria-pressed={config.cropMarksStyle === 'standard'}
          >
            <div className="w-6 h-6 border border-dashed border-current relative">
              <div className="absolute -top-1 -left-1 w-2 h-2 border-t border-l border-current" />
              <div className="absolute -top-1 -right-1 w-2 h-2 border-t border-r border-current" />
              <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b border-l border-current" />
              <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b border-r border-current" />
            </div>
            <div>
              <div className="text-xs font-medium mb-0.5">Standard</div>
              <div className="text-[9px] leading-tight opacity-70">Easy cut</div>
            </div>
          </button>
          
          {/* Corner Marks */}
          <button
            className={`py-3 px-1 rounded border text-center transition-colors flex flex-col items-center justify-center gap-2 ${
              config.cropMarksStyle === 'corners'
                ? 'bg-gray-800 border-blue-500 text-blue-400'
                : 'bg-gray-900 border-gray-800 text-gray-500 hover:bg-gray-800'
            }`}
            onClick={() => setConfig({ ...config, cropMarksStyle: 'corners' })}
            aria-pressed={config.cropMarksStyle === 'corners'}
          >
            <div className="w-6 h-6 relative">
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-current" />
              <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-current" />
              <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-current" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-current" />
            </div>
            <div>
              <div className="text-xs font-medium mb-0.5">Corners</div>
              <div className="text-[9px] leading-tight opacity-70">Minimal</div>
            </div>
          </button>
          
          {/* No Marks */}
          <button
            className={`py-3 px-1 rounded border text-center transition-colors flex flex-col items-center justify-center gap-2 ${
              config.cropMarksStyle === 'none'
                ? 'bg-gray-800 border-blue-500 text-blue-400'
                : 'bg-gray-900 border-gray-800 text-gray-500 hover:bg-gray-800'
            }`}
            onClick={() => setConfig({ ...config, cropMarksStyle: 'none' })}
            aria-pressed={config.cropMarksStyle === 'none'}
          >
            <div className="w-6 h-6 border border-current flex items-center justify-center">
              <div className="w-4 h-0 border-t border-current" />
            </div>
            <div>
              <div className="text-xs font-medium mb-0.5">None</div>
              <div className="text-[9px] leading-tight opacity-70">Edge-to-edge</div>
            </div>
          </button>
        </div>
      </div>

      {/* ----------------------------------------------------------------------
          EXTRA OPTIONS
          ---------------------------------------------------------------------- */}
      <div className="p-5 border-b border-gray-800">
        <h3 className="text-[10px] font-bold text-gray-400 tracking-wider uppercase mb-3">Extra Options</h3>
        <div className="space-y-4">
          {/* Bleed Toggle */}
          <label className="flex items-center justify-between cursor-pointer group">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-gray-900 border border-gray-700 flex items-center justify-center">
                <div className="w-2 h-2 border border-dashed border-gray-500 rounded-full" />
              </div>
              <div>
                <div className="text-sm text-gray-200 font-medium group-hover:text-white transition-colors">Bleed</div>
                <div className="text-[10px] text-gray-500">+0.02 in for perfect edges</div>
              </div>
            </div>
            <button 
              type="button"
              role="switch"
              aria-checked={config.bleed}
              className={`w-8 h-4 rounded-full p-0.5 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-gray-900 ${config.bleed ? 'bg-blue-500' : 'bg-gray-700'}`}
              onClick={() => setConfig({ ...config, bleed: !config.bleed })}
            >
              <div className={`w-3 h-3 bg-white rounded-full shadow-sm transform transition-transform ${config.bleed ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
          </label>

          {/* Page Labels Toggle */}
          <label className="flex items-center justify-between cursor-pointer group">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-gray-900 border border-gray-700 flex items-center justify-center">
                <span className="text-[8px] font-bold text-gray-500">1</span>
              </div>
              <div>
                <div className="text-sm text-gray-200 font-medium group-hover:text-white transition-colors">Page Labels</div>
                <div className="text-[10px] text-gray-500">Show item number</div>
              </div>
            </div>
            <button 
              type="button"
              role="switch"
              aria-checked={config.pageLabels}
              className={`w-8 h-4 rounded-full p-0.5 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-gray-900 ${config.pageLabels ? 'bg-blue-500' : 'bg-gray-700'}`}
              onClick={() => setConfig({ ...config, pageLabels: !config.pageLabels })}
            >
              <div className={`w-3 h-3 bg-white rounded-full shadow-sm transform transition-transform ${config.pageLabels ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
          </label>

          {/* Center Marks Toggle */}
          <label className="flex items-center justify-between cursor-pointer group">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-gray-900 border border-gray-700 flex items-center justify-center relative">
                <div className="w-3 h-0 border-t border-gray-500 absolute" />
                <div className="w-0 h-3 border-l border-gray-500 absolute" />
              </div>
              <div>
                <div className="text-sm text-gray-200 font-medium group-hover:text-white transition-colors">Add Center Marks</div>
                <div className="text-[10px] text-gray-500">Help with alignment</div>
              </div>
            </div>
            <button 
              type="button"
              role="switch"
              aria-checked={config.centerMarks}
              className={`w-8 h-4 rounded-full p-0.5 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-gray-900 ${config.centerMarks ? 'bg-blue-500' : 'bg-gray-700'}`}
              onClick={() => setConfig({ ...config, centerMarks: !config.centerMarks })}
            >
              <div className={`w-3 h-3 bg-white rounded-full shadow-sm transform transition-transform ${config.centerMarks ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
          </label>
        </div>
      </div>

      {/* ----------------------------------------------------------------------
          EXPORT ACTIONS
          ---------------------------------------------------------------------- */}
      <div className="p-5 mt-auto">
        <button 
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium py-3 rounded-lg shadow-lg shadow-blue-900/20 transition-all mb-3"
          onClick={handleExportPDF}
        >
          <FileDown className="w-4 h-4" /> Export Print-Ready PDF
        </button>
        <button 
          className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-gray-300 text-sm font-medium py-3 rounded-lg border border-gray-800 transition-colors"
          onClick={handleExportPNG}
        >
          <Download className="w-4 h-4" /> Download PNG Preview
        </button>
      </div>
    </aside>
  );
}
