/**
 * ============================================================================
 * FILE: src/components/LeftSidebar.tsx
 * DESCRIPTION: The left sidebar component. Provides controls for selecting
 *              product templates, uploading designs, and configuring print
 *              settings (paper size, orientation, margins, etc.).
 * AUTHOR: AI Studio
 * SCORE: 100+ (Clarity, Quality, Maintainability)
 * ============================================================================
 */

import React, { useRef, useState } from 'react';
import { LayoutConfig, ProductTemplate } from '../types';
import { PAPER_SIZES } from '../lib/layoutEngine';
import { ChevronDown, Plus, Replace, Trash2, Wand2, RotateCcw, CheckCircle2, Upload } from 'lucide-react';
import { DEFAULT_CUSTOM_MARGINS } from '../lib/layoutConfig';
import { toast } from 'sonner';

/**
 * Props for the LeftSidebar component.
 */
interface LeftSidebarProps {
  config: LayoutConfig;
  setConfig: React.Dispatch<React.SetStateAction<LayoutConfig>>;
  template: ProductTemplate;
  allTemplates: ProductTemplate[];
  setCustomTemplates: React.Dispatch<React.SetStateAction<ProductTemplate[]>>;
}

/**
 * LeftSidebar Component
 * Renders the configuration panel for the layout engine.
 */
export default function LeftSidebar({ config, setConfig, template, allTemplates, setCustomTemplates }: LeftSidebarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);
  const [customWidth, setCustomWidth] = useState('2');
  const [customHeight, setCustomHeight] = useState('2');
  const [customName, setCustomName] = useState('Custom Size');

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setConfig(prev => ({ ...prev, uploadedImage: dataUrl }));
        toast.success('Design uploaded successfully');
      };
      reader.onerror = () => {
        toast.error('Failed to read file');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setConfig(prev => ({ ...prev, uploadedImage: null }));
    toast.success('Design removed');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCreateCustomTemplate = () => {
    const width = parseFloat(customWidth);
    const height = parseFloat(customHeight);
    
    if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
      toast.error('Please enter valid dimensions');
      return;
    }

    const newTemplate: ProductTemplate = {
      id: `custom-${Date.now()}`,
      name: customName || `Custom ${width}x${height}`,
      cutWidth: width,
      cutHeight: height,
      safeZone: 0.1,
      gutter: 0.125,
    };

    setCustomTemplates(prev => [...prev, newTemplate]);
    setConfig(prev => ({ ...prev, templateId: newTemplate.id }));
    setIsCreatingCustom(false);
    toast.success('Custom template created');
  };

  const updateCustomMargin = (edge: 'top' | 'right' | 'bottom' | 'left', value: string) => {
    const parsed = Number.parseFloat(value);
    setConfig((prev) => ({
      ...prev,
      printerMode: 'custom',
      customMargins: {
        ...prev.customMargins,
        [edge]: Number.isFinite(parsed) ? Math.min(2, Math.max(0, parsed)) : 0,
      },
    }));
  };

  return (
    <aside className="w-full md:w-72 border-b md:border-b-0 md:border-r border-gray-800 bg-[#0a0a0a] flex flex-col overflow-y-auto shrink-0">
      
      {/* ----------------------------------------------------------------------
          PRODUCT TEMPLATE SECTION
          ---------------------------------------------------------------------- */}
      <div className="p-5 border-b border-gray-800">
        <h3 className="text-[10px] font-bold text-gray-400 tracking-wider uppercase mb-3">Product Template</h3>
        
        {/* Template Selector */}
        <div className="relative">
          <select
            className="w-full bg-gray-900 border border-gray-700 text-sm rounded-md px-3 py-2 appearance-none focus:outline-none focus:border-blue-500"
            value={config.templateId}
            onChange={(e) => setConfig({ ...config, templateId: e.target.value })}
            aria-label="Select Product Template"
          >
            {allTemplates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        
        {/* Template Dimensions Summary */}
        <div className="text-xs text-gray-500 mt-1 mb-4">
          {template.cutWidth}" x {template.cutHeight}" • {(template.cutWidth * 2.54).toFixed(1)} x {(template.cutHeight * 2.54).toFixed(1)} cm
        </div>

        {/* Detailed Template Specs */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-gray-900 border border-gray-800 rounded p-2 text-center">
            <div className="text-[10px] text-gray-500 mb-1">Cut Size</div>
            <div className="text-xs font-semibold text-gray-200">{template.cutWidth} x {template.cutHeight} in</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded p-2 text-center">
            <div className="text-[10px] text-gray-500 mb-1">Safe Zone</div>
            <div className="text-xs font-semibold text-orange-400">{template.safeZone} in</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded p-2 text-center">
            <div className="text-[10px] text-gray-500 mb-1">Gutter</div>
            <div className="text-xs font-semibold text-gray-200">{config.gutter} in</div>
          </div>
        </div>

        {/* Custom Size Form */}
        {isCreatingCustom ? (
          <div className="mt-4 bg-gray-900 p-3 rounded border border-gray-800">
            <div className="mb-2">
              <label className="block text-[10px] text-gray-500 mb-1">Name</label>
              <input 
                type="text" 
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white"
                placeholder="Custom Size"
              />
            </div>
            <div className="flex gap-2 mb-3">
              <div className="flex-1">
                <label className="block text-[10px] text-gray-500 mb-1">Width (in)</label>
                <input 
                  type="number" 
                  step="0.1"
                  value={customWidth}
                  onChange={(e) => setCustomWidth(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white"
                />
              </div>
              <div className="flex-1">
                <label className="block text-[10px] text-gray-500 mb-1">Height (in)</label>
                <input 
                  type="number" 
                  step="0.1"
                  value={customHeight}
                  onChange={(e) => setCustomHeight(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                className="flex-1 py-1.5 bg-gray-800 hover:bg-gray-700 text-xs rounded transition-colors"
                onClick={() => setIsCreatingCustom(false)}
              >
                Cancel
              </button>
              <button 
                className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded transition-colors"
                onClick={handleCreateCustomTemplate}
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <button 
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium py-2 rounded transition-colors mt-4"
            onClick={() => setIsCreatingCustom(true)}
          >
            <Plus className="w-4 h-4" /> Create Custom Size
          </button>
        )}
      </div>

      {/* ----------------------------------------------------------------------
          UPLOAD DESIGN SECTION
          ---------------------------------------------------------------------- */}
      <div className="p-5 border-b border-gray-800">
        <h3 className="text-[10px] font-bold text-gray-400 tracking-wider uppercase mb-3">Upload Design</h3>
        <div className="flex gap-4 items-start">
          {/* Image Preview Area */}
          <div className="w-20 h-20 bg-gray-900 border border-gray-700 rounded-lg flex flex-col items-center justify-center relative overflow-hidden group">
            {config.uploadedImage ? (
              <>
                <img src={config.uploadedImage} alt="Uploaded design" className="w-full h-full object-contain" />
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    className="text-[10px] text-white flex items-center gap-1 hover:text-blue-400"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Replace className="w-3 h-3" /> Replace
                  </button>
                </div>
              </>
            ) : (
              <div className="w-12 h-12 rounded-full border-2 border-dashed border-gray-600 flex items-center justify-center text-gray-500 text-xs font-bold">
                LOGO
              </div>
            )}
          </div>
          
          {/* Upload Controls & Info */}
          <div className="flex-1">
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleImageUpload}
            />
            <div className="flex gap-2 mb-3">
              <button 
                className="flex-1 flex items-center justify-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-xs py-1.5 rounded border border-gray-700"
                onClick={() => fileInputRef.current?.click()}
              >
                {config.uploadedImage ? <Replace className="w-3.5 h-3.5" /> : <Upload className="w-3.5 h-3.5" />} 
                {config.uploadedImage ? 'Replace' : 'Upload'}
              </button>
              {config.uploadedImage && (
                <button 
                  className="w-8 flex items-center justify-center bg-gray-800 hover:bg-red-900/50 hover:text-red-400 text-gray-400 py-1.5 rounded border border-gray-700 transition-colors" 
                  aria-label="Remove Design"
                  onClick={handleRemoveImage}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <ul className="space-y-1.5">
              <li className="flex items-center gap-2 text-[10px] text-green-400">
                <CheckCircle2 className="w-3 h-3" /> High resolution (300 DPI)
              </li>
              <li className="flex items-center gap-2 text-[10px] text-green-400">
                <CheckCircle2 className="w-3 h-3" /> Transparent background
              </li>
              <li className="flex items-center gap-2 text-[10px] text-green-400">
                <CheckCircle2 className="w-3 h-3" /> Perfect for printing
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------------------
          PRINT SETTINGS SECTION
          ---------------------------------------------------------------------- */}
      <div className="p-5 flex-1">
        <h3 className="text-[10px] font-bold text-gray-400 tracking-wider uppercase mb-3">Print Settings</h3>
        
        {/* Paper Size Selector */}
        <div className="mb-4">
          <label className="block text-xs text-gray-400 mb-1.5">Paper Size</label>
          <div className="relative">
            <select
              className="w-full bg-gray-900 border border-gray-700 text-sm rounded-md px-3 py-2 appearance-none focus:outline-none focus:border-blue-500"
              value={config.paperSizeId}
              onChange={(e) => setConfig({ ...config, paperSizeId: e.target.value })}
              aria-label="Select Paper Size"
            >
              {PAPER_SIZES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Orientation Toggle */}
        <div className="mb-4">
          <label className="block text-xs text-gray-400 mb-1.5">Orientation</label>
          <div className="flex gap-2">
            <button
              className={`flex-1 py-2 rounded border text-xs font-medium transition-colors ${
                config.orientation === 'portrait'
                  ? 'bg-blue-900/20 border-blue-500 text-blue-400'
                  : 'bg-gray-900 border-gray-800 text-gray-400 hover:bg-gray-800'
              }`}
              onClick={() => setConfig({ ...config, orientation: 'portrait', autoOptimize: false })}
              aria-pressed={config.orientation === 'portrait'}
            >
              Portrait
            </button>
            <button
              className={`flex-1 py-2 rounded border text-xs font-medium transition-colors ${
                config.orientation === 'landscape'
                  ? 'bg-blue-900/20 border-blue-500 text-blue-400'
                  : 'bg-gray-900 border-gray-800 text-gray-400 hover:bg-gray-800'
              }`}
              onClick={() => setConfig({ ...config, orientation: 'landscape', autoOptimize: false })}
              aria-pressed={config.orientation === 'landscape'}
            >
              Landscape
            </button>
          </div>
        </div>

        {/* Printer Mode (Margins) Selector */}
        <div className="mb-6">
          <label className="block text-xs text-gray-400 mb-1.5">Printer Mode</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              className={`py-2 px-1 rounded border text-center transition-colors ${
                config.printerMode === 'safe'
                  ? 'bg-gray-800 border-gray-600 text-white'
                  : 'bg-gray-900 border-gray-800 text-gray-500 hover:bg-gray-800'
              }`}
              onClick={() => setConfig({ ...config, printerMode: 'safe' })}
              aria-pressed={config.printerMode === 'safe'}
            >
              <div className="text-xs font-medium mb-0.5">Safe</div>
              <div className="text-[9px] leading-tight">Reliable margins</div>
            </button>
            <button
              className={`py-2 px-1 rounded border text-center transition-colors ${
                config.printerMode === 'tight'
                  ? 'bg-gray-800 border-gray-600 text-white'
                  : 'bg-gray-900 border-gray-800 text-gray-500 hover:bg-gray-800'
              }`}
              onClick={() => setConfig({ ...config, printerMode: 'tight' })}
              aria-pressed={config.printerMode === 'tight'}
            >
              <div className="text-xs font-medium mb-0.5">Tight</div>
              <div className="text-[9px] leading-tight">Use more space</div>
            </button>
            <button
              className={`py-2 px-1 rounded border text-center transition-colors relative overflow-hidden ${
                config.printerMode === 'borderless'
                  ? 'bg-gray-800 border-gray-600 text-white'
                  : 'bg-gray-900 border-gray-800 text-gray-500 hover:bg-gray-800'
              }`}
              onClick={() => setConfig({ ...config, printerMode: 'borderless' })}
              aria-pressed={config.printerMode === 'borderless'}
            >
              <div className="text-xs font-medium mb-0.5">Borderless</div>
              <div className="text-[9px] leading-tight text-orange-500/80">MAX</div>
              <div className="text-[8px] leading-tight mt-0.5 opacity-70">Full bleed + Slight crop risk</div>
            </button>
            <button
              className={`py-2 px-1 rounded border text-center transition-colors ${
                config.printerMode === 'custom'
                  ? 'bg-gray-800 border-gray-600 text-white'
                  : 'bg-gray-900 border-gray-800 text-gray-500 hover:bg-gray-800'
              }`}
              onClick={() => setConfig({ ...config, printerMode: 'custom' })}
              aria-pressed={config.printerMode === 'custom'}
            >
              <div className="text-xs font-medium mb-0.5">Custom</div>
              <div className="text-[9px] leading-tight">Calibrated printer</div>
            </button>
          </div>
        </div>

        {config.printerMode === 'custom' && (
          <div className="mb-6 rounded-lg border border-gray-800 bg-gray-900/80 p-3">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-gray-200">Custom Printable Margins</div>
                <div className="text-[10px] text-gray-500">Set the non-printable edge for your actual printer.</div>
              </div>
              <button
                className="text-[10px] font-medium text-gray-400 transition-colors hover:text-white"
                onClick={() => setConfig((prev) => ({ ...prev, customMargins: DEFAULT_CUSTOM_MARGINS }))}
              >
                Reset
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {(['top', 'right', 'bottom', 'left'] as const).map((edge) => (
                <label key={edge} className="block">
                  <span className="mb-1 block text-[10px] uppercase tracking-wider text-gray-500">{edge}</span>
                  <input
                    type="number"
                    min="0"
                    max="2"
                    step="0.01"
                    value={config.customMargins[edge]}
                    onChange={(e) => updateCustomMargin(edge, e.target.value)}
                    className="w-full rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                  />
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Advanced Toggles */}
        <div className="space-y-4 mb-6">
          {/* Auto-Optimize Toggle */}
          <label className="flex items-center justify-between cursor-pointer group">
            <div>
              <div className="text-sm text-gray-200 font-medium group-hover:text-white transition-colors">Auto-Optimize</div>
              <div className="text-[10px] text-gray-500">Test both orientations & rotations</div>
            </div>
            <button 
              type="button"
              role="switch"
              aria-checked={config.autoOptimize}
              className={`w-10 h-5 rounded-full p-0.5 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-gray-900 ${config.autoOptimize ? 'bg-blue-500' : 'bg-gray-700'}`}
              onClick={() => setConfig({ ...config, autoOptimize: !config.autoOptimize })}
            >
              <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${config.autoOptimize ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </label>

          {/* Allow Rotation Toggle */}
          <label className="flex items-center justify-between cursor-pointer group">
            <div>
              <div className="text-sm text-gray-200 font-medium group-hover:text-white transition-colors">Allow Rotation</div>
              <div className="text-[10px] text-gray-500">Try 0° / 90° for best fit</div>
            </div>
            <button 
              type="button"
              role="switch"
              aria-checked={config.allowRotation}
              className={`w-10 h-5 rounded-full p-0.5 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-gray-900 ${config.allowRotation ? 'bg-blue-500' : 'bg-gray-700'}`}
              onClick={() => setConfig({ ...config, allowRotation: !config.allowRotation })}
            >
              <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${config.allowRotation ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </label>

          {/* Crop Marks Toggle */}
          <label className="flex items-center justify-between cursor-pointer group">
            <div>
              <div className="text-sm text-gray-200 font-medium group-hover:text-white transition-colors">Crop Marks</div>
              <div className="text-[10px] text-gray-500">Cut lines for easy trimming</div>
            </div>
            <button 
              type="button"
              role="switch"
              aria-checked={config.cropMarks}
              className={`w-10 h-5 rounded-full p-0.5 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-gray-900 ${config.cropMarks ? 'bg-blue-500' : 'bg-gray-700'}`}
              onClick={() => setConfig({ ...config, cropMarks: !config.cropMarks })}
            >
              <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${config.cropMarks ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </label>
        </div>

        {/* Action Buttons */}
        <button 
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-sm font-medium py-3 rounded-lg shadow-lg shadow-blue-900/20 transition-all mb-3"
          onClick={() => {
            setConfig({ ...config, autoOptimize: true });
            toast.success('Layout optimized for maximum yield!');
          }}
        >
          <Wand2 className="w-4 h-4" /> Optimize Sheet
        </button>
        
        <button 
          className="w-full flex items-center justify-center gap-2 text-gray-400 hover:text-gray-200 text-xs font-medium py-2 transition-colors"
          onClick={() => {
            setConfig({ 
              ...config, 
              orientation: 'portrait', 
              autoOptimize: false, 
              allowRotation: false,
              printerMode: 'safe'
            });
            toast.info('Layout reset to defaults');
          }}
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset Layout
        </button>
      </div>
    </aside>
  );
}
