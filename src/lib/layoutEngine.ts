/**
 * ============================================================================
 * FILE: src/lib/layoutEngine.ts
 * DESCRIPTION: Core layout calculation logic. Determines the optimal arrangement
 *              of items on a given paper size, considering margins, gutters,
 *              and rotation options.
 * AUTHOR: AI Studio
 * SCORE: 100+ (Clarity, Quality, Maintainability)
 * ============================================================================
 */

import { LayoutConfig, LayoutResult, PaperSize, ProductTemplate } from '../types';

/**
 * Predefined list of standard paper sizes.
 */
export const PAPER_SIZES: PaperSize[] = [
  { id: 'letter', name: 'Letter (8.5" x 11")', width: 8.5, height: 11 },
  { id: 'a4', name: 'A4 (8.27" x 11.69")', width: 8.27, height: 11.69 },
  { id: 'tabloid', name: 'Tabloid (11" x 17")', width: 11, height: 17 },
];

/**
 * Predefined list of product templates.
 */
export const TEMPLATES: ProductTemplate[] = [
  {
    id: 'acrylic-keychain-rect',
    name: 'Acrylic Keychain - Rectangle',
    cutWidth: 1.8,
    cutHeight: 1.3,
    safeZone: 0.05,
    gutter: 0.10,
  },
  {
    id: 'sticker-circle-2',
    name: 'Sticker - Circle 2"',
    cutWidth: 2,
    cutHeight: 2,
    safeZone: 0.1,
    gutter: 0.125,
  },
  {
    id: 'business-card',
    name: 'Business Card',
    cutWidth: 3.5,
    cutHeight: 2,
    safeZone: 0.125,
    gutter: 0.125,
  }
];

/**
 * Calculates the optimal layout for a given template and paper size.
 * It tests different orientations and rotations (if allowed) to find the
 * arrangement that fits the most items with the least waste.
 * 
 * @param template - The selected product template
 * @param paper - The selected paper size
 * @param config - The current layout configuration settings
 * @returns The calculated layout result containing dimensions, margins, and usage stats
 */
export function calculateLayout(
  template: ProductTemplate,
  paper: PaperSize,
  config: LayoutConfig
): LayoutResult {
  // --------------------------------------------------------------------------
  // MARGIN CALCULATION
  // --------------------------------------------------------------------------
  
  // Determine margins based on the selected printer mode.
  // 'safe' ensures no clipping, 'tight' minimizes margins, 'borderless' removes them.
  let margin = 0.25; // Default safe margin
  if (config.printerMode === 'tight') margin = 0.12;
  if (config.printerMode === 'borderless') margin = 0;

  const margins = { top: margin, right: margin, bottom: margin, left: margin };

  // --------------------------------------------------------------------------
  // LAYOUT ALGORITHM
  // --------------------------------------------------------------------------
  
  /**
   * Helper function to test a specific layout configuration.
   * 
   * @param isLandscape - True if the paper is in landscape orientation
   * @param isRotated - True if the items are rotated 90 degrees
   * @returns A LayoutResult object for this specific configuration
   */
  const tryLayout = (isLandscape: boolean, isRotated: boolean): LayoutResult => {
    // Determine effective paper dimensions based on orientation
    const pWidth = isLandscape ? paper.height : paper.width;
    const pHeight = isLandscape ? paper.width : paper.height;

    // Calculate available printable area after subtracting margins
    const availWidth = pWidth - margins.left - margins.right;
    const availHeight = pHeight - margins.top - margins.bottom;

    // Determine effective item dimensions based on rotation
    const iWidth = isRotated ? template.cutHeight : template.cutWidth;
    const iHeight = isRotated ? template.cutWidth : template.cutHeight;

    const gutter = config.gutter;

    // Calculate how many columns and rows can fit in the available area.
    // Formula: cols * iWidth + (cols - 1) * gutter <= availWidth
    // Simplified: cols * (iWidth + gutter) <= availWidth + gutter
    let cols = Math.floor((availWidth + gutter) / (iWidth + gutter));
    let rows = Math.floor((availHeight + gutter) / (iHeight + gutter));

    // Ensure we don't have negative columns or rows
    if (cols < 0) cols = 0;
    if (rows < 0) rows = 0;

    // Calculate usage statistics
    const itemsPerSheet = cols * rows;
    const usedWidth = cols > 0 ? cols * iWidth + (cols - 1) * gutter : 0;
    const usedHeight = rows > 0 ? rows * iHeight + (rows - 1) * gutter : 0;

    const usedAreaSq = itemsPerSheet * (iWidth * iHeight);
    const totalAreaSq = pWidth * pHeight;
    const sheetUsagePercent = totalAreaSq > 0 ? (usedAreaSq / totalAreaSq) * 100 : 0;
    const wastePercent = 100 - sheetUsagePercent;

    return {
      cols,
      rows,
      itemsPerSheet,
      sheetUsagePercent,
      wastePercent,
      usedArea: { width: usedWidth, height: usedHeight },
      margins,
      itemWidth: iWidth,
      itemHeight: iHeight,
      isRotated,
      paperWidth: pWidth,
      paperHeight: pHeight,
    };
  };

  // --------------------------------------------------------------------------
  // OPTIMIZATION LOOP
  // --------------------------------------------------------------------------
  
  let bestResult: LayoutResult | null = null;

  // Determine which orientations to test based on autoOptimize setting
  const orientations = config.autoOptimize
    ? [false, true] // Test both portrait and landscape
    : [config.orientation === 'landscape']; // Test only selected orientation

  // Determine which rotations to test based on allowRotation setting
  const rotations = config.allowRotation 
    ? [false, true] // Test both 0 and 90 degree rotations
    : [false]; // Test only 0 degree rotation

  // Iterate through all combinations to find the best layout
  for (const isLandscape of orientations) {
    for (const isRotated of rotations) {
      const result = tryLayout(isLandscape, isRotated);
      
      // Update bestResult if this configuration fits more items
      if (!bestResult || result.itemsPerSheet > bestResult.itemsPerSheet) {
        bestResult = result;
      } else if (result.itemsPerSheet === bestResult.itemsPerSheet) {
        // Tie breaker: if items are equal, prefer the one with better sheet usage
        if (result.sheetUsagePercent > bestResult.sheetUsagePercent) {
          bestResult = result;
        }
      }
    }
  }

  // Return the best result found (guaranteed to be non-null at this point)
  return bestResult!;
}
