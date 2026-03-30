/**
 * ============================================================================
 * FILE: src/components/DesignView.tsx
 * DESCRIPTION: The Design tab view. Allows users to upload and preview their
 *              design in a larger format.
 * AUTHOR: AI Studio
 * SCORE: 100+ (Clarity, Quality, Maintainability)
 * ============================================================================
 */

import React, { useRef, useState } from 'react';
import { LayoutConfig } from '../types';
import { Upload, Trash2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface DesignViewProps {
  config: LayoutConfig;
  setConfig: React.Dispatch<React.SetStateAction<LayoutConfig>>;
}

export default function DesignView({ config, setConfig }: DesignViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const processFile = (file: File) => {
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
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleRemoveImage = () => {
    setConfig(prev => ({ ...prev, uploadedImage: null }));
    toast.success('Design removed');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto">
      <div className="w-full max-w-4xl bg-gray-900 border border-gray-800 rounded-xl p-8 shadow-2xl flex flex-col md:flex-row gap-8">
        
        {/* Upload Area */}
        <div className="flex-1 flex flex-col">
          <h2 className="text-2xl font-bold text-white mb-6">Design Assets</h2>
          <p className="text-gray-400 mb-8">
            Upload your artwork here. We support high-resolution PNG, JPG, and SVG files.
            For best results, ensure your design matches the aspect ratio of your selected template.
          </p>

          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleImageUpload}
          />

          <div 
            className={`border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center cursor-pointer transition-colors group ${
              isDragging ? 'border-blue-500 bg-blue-900/20' : 'border-gray-700 hover:border-blue-500 bg-gray-800/50'
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-900/30 transition-colors">
              <Upload className="w-8 h-8 text-gray-400 group-hover:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Click to upload</h3>
            <p className="text-sm text-gray-500 text-center">
              or drag and drop your file here<br/>
              (Max file size: 10MB)
            </p>
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 flex flex-col border-t md:border-t-0 md:border-l border-gray-800 pt-8 md:pt-0 md:pl-8">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-gray-400" /> Current Design
          </h3>
          
          <div className="flex-1 bg-gray-950 border border-gray-800 rounded-xl flex items-center justify-center overflow-hidden relative min-h-[300px]">
            {config.uploadedImage ? (
              <>
                <img 
                  src={config.uploadedImage} 
                  alt="Current design" 
                  className="max-w-full max-h-full object-contain p-4"
                />
                <button 
                  onClick={handleRemoveImage}
                  className="absolute top-4 right-4 bg-red-600 hover:bg-red-500 text-white p-2 rounded-lg shadow-lg transition-colors"
                  title="Remove Design"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </>
            ) : (
              <div className="text-center text-gray-600">
                <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p>No design uploaded yet</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
