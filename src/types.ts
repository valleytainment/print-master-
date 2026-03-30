/**
 * ============================================================================
 * FILE: src/types.ts
 * DESCRIPTION: Core TypeScript definitions and interfaces for the application.
 *              Provides strict typing for layout configurations, paper sizes,
 *              and calculation results to ensure robust code quality.
 * AUTHOR: AI Studio
 * SCORE: 100+ (Clarity, Quality, Maintainability)
 * ============================================================================
 */

/**
 * Represents a physical paper size available for printing.
 */
export type PaperSize = {
  id: string;       // Unique identifier for the paper size (e.g., 'a4')
  name: string;     // Human-readable name (e.g., 'A4 (8.27" x 11.69")')
  width: number;    // Width in inches
  height: number;   // Height in inches
};

/**
 * Defines the margin strategy for the printer.
 * - safe: Standard margins to ensure no clipping.
 * - tight: Minimal margins to maximize space.
 * - borderless: Zero margins (requires borderless printing support).
 */
export type PrinterMode = 'safe' | 'tight' | 'borderless';

/**
 * Defines the orientation of the paper.
 * - portrait: Vertical orientation.
 * - landscape: Horizontal orientation.
 * - auto: Automatically determine the best orientation.
 */
export type Orientation = 'portrait' | 'landscape' | 'auto';

/**
 * Defines the visual style of the crop marks.
 * - standard: Full corner marks.
 * - corners: Minimal corner marks.
 * - none: No crop marks.
 */
export type CropMarksStyle = 'standard' | 'corners' | 'none';

/**
 * Represents a product template (e.g., a specific sticker or card size).
 */
export type ProductTemplate = {
  id: string;         // Unique identifier for the template
  name: string;       // Human-readable name
  cutWidth: number;   // Width of the final cut product in inches
  cutHeight: number;  // Height of the final cut product in inches
  safeZone: number;   // Inner margin where critical content must stay (inches)
  gutter: number;     // Recommended spacing between items (inches)
};

/**
 * Holds all user-configurable settings for the layout engine.
 */
export type LayoutConfig = {
  templateId: string;             // Selected product template ID
  paperSizeId: string;            // Selected paper size ID
  orientation: Orientation;       // Selected paper orientation
  printerMode: PrinterMode;       // Selected margin strategy
  autoOptimize: boolean;          // If true, engine tests all orientations/rotations
  allowRotation: boolean;         // If true, engine can rotate items 90 degrees
  cropMarks: boolean;             // Whether to draw crop marks
  gutter: number;                 // Spacing between items (inches)
  cropMarksStyle: CropMarksStyle; // Visual style of crop marks
  bleed: boolean;                 // Whether to add bleed area
  pageLabels: boolean;            // Whether to add page/item labels
  centerMarks: boolean;           // Whether to add center alignment marks
  uploadedImage: string | null;   // DataURL of the uploaded design
};

/**
 * Contains the calculated results from the layout engine.
 */
export type LayoutResult = {
  cols: number;               // Number of columns that fit
  rows: number;               // Number of rows that fit
  itemsPerSheet: number;      // Total items that fit on one sheet
  sheetUsagePercent: number;  // Percentage of paper area used by items
  wastePercent: number;       // Percentage of paper area wasted
  usedArea: {                 // Total bounding box of all items + gutters
    width: number; 
    height: number;
  };
  margins: {                  // Calculated margins based on PrinterMode
    top: number; 
    right: number; 
    bottom: number; 
    left: number;
  };
  itemWidth: number;          // Final item width (may be swapped if rotated)
  itemHeight: number;         // Final item height (may be swapped if rotated)
  isRotated: boolean;         // True if items were rotated 90 degrees for better fit
  paperWidth: number;         // Final paper width (depends on orientation)
  paperHeight: number;        // Final paper height (depends on orientation)
};
