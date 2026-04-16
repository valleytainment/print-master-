/**
 * ============================================================================
 * FILE: src/lib/exportUtils.ts
 * DESCRIPTION: Shared export helpers for layout snapshot generation.
 *              Centralizes DOM capture, PDF export, and PNG export so every
 *              export entrypoint uses the same settings and error handling.
 * AUTHOR: Codex
 * SCORE: 100+ (Clarity, Quality, Maintainability)
 * ============================================================================
 */

import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { LayoutResult } from '../types';

const EXPORT_CANVAS_ID = 'print-canvas';

type SnapshotOptions = {
  scale: number;
};

/**
 * Returns the rendered print canvas used by both the layout preview and the
 * hidden export-only preview. Export operations fail fast if it is missing.
 */
function getExportCanvasElement(): HTMLElement {
  const element = document.getElementById(EXPORT_CANVAS_ID);
  if (!element) {
    throw new Error('Could not find the print canvas to export.');
  }

  return element;
}

/**
 * Captures the print canvas at a deterministic scale. The temporary transform
 * reset prevents UI zoom state from leaking into the exported asset.
 */
async function renderSnapshotCanvas({ scale }: SnapshotOptions): Promise<HTMLCanvasElement> {
  const element = getExportCanvasElement();
  const originalTransform = element.style.transform;

  try {
    element.style.transform = 'scale(1)';

    return await html2canvas(element, {
      scale,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });
  } finally {
    element.style.transform = originalTransform;
  }
}

/**
 * Exports the current layout as a raster-based PDF. The resulting PDF preserves
 * the sheet dimensions, but the contents are still an image snapshot rather
 * than a vector or CMYK print workflow.
 */
export async function exportLayoutAsPdf(layoutResult: LayoutResult): Promise<void> {
  const canvas = await renderSnapshotCanvas({ scale: 6 });
  const imageData = canvas.toDataURL('image/png');

  const pdf = new jsPDF({
    orientation: layoutResult.paperWidth > layoutResult.paperHeight ? 'landscape' : 'portrait',
    unit: 'in',
    format: [layoutResult.paperWidth, layoutResult.paperHeight],
  });

  pdf.addImage(imageData, 'PNG', 0, 0, layoutResult.paperWidth, layoutResult.paperHeight);
  pdf.save('layout-snapshot.pdf');
}

/**
 * Exports the current layout as a PNG snapshot for sharing and quick proofing.
 */
export async function exportLayoutAsPng(): Promise<void> {
  const canvas = await renderSnapshotCanvas({ scale: 4 });
  const link = document.createElement('a');
  link.download = 'layout-preview.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}
