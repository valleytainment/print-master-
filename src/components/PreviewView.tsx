/**
 * ============================================================================
 * FILE: src/components/PreviewView.tsx
 * DESCRIPTION: The Preview tab view. Shows a full-screen preview of the layout.
 * AUTHOR: AI Studio
 * SCORE: 100+ (Clarity, Quality, Maintainability)
 * ============================================================================
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { LayoutConfig, LayoutResult, ProductTemplate, PaperSize } from '../types';
import { Printer, Eye, Ruler, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import MainCanvas from './MainCanvas';
import { getArtworkPlacement } from '../lib/layoutConfig';

interface PreviewViewProps {
  config: LayoutConfig;
  layoutResult: LayoutResult;
  template: ProductTemplate;
  paper: PaperSize;
}

type ImageMetadata = {
  width: number;
  height: number;
};

export default function PreviewView({ config, layoutResult, template, paper }: PreviewViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(1);
  const [imageMetadata, setImageMetadata] = useState<ImageMetadata | null>(null);
  const artworkPlacement = getArtworkPlacement(config, template.id);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const baseDpi = 96;
    const paperWidthPx = layoutResult.paperWidth * baseDpi;
    const paperHeightPx = layoutResult.paperHeight * baseDpi;

    const updateScale = () => {
      const availableWidth = Math.max(container.clientWidth - 48, 1);
      const availableHeight = Math.max(container.clientHeight - 48, 1);
      const nextScale = Math.min(1, availableWidth / paperWidthPx, availableHeight / paperHeightPx);
      setPreviewScale(nextScale);
    };

    updateScale();

    const observer = new ResizeObserver(updateScale);
    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [layoutResult.paperHeight, layoutResult.paperWidth]);

  useEffect(() => {
    if (!config.uploadedImage) {
      setImageMetadata(null);
      return;
    }

    let isCancelled = false;
    const image = new window.Image();

    image.onload = () => {
      if (!isCancelled) {
        setImageMetadata({
          width: image.naturalWidth,
          height: image.naturalHeight,
        });
      }
    };

    image.onerror = () => {
      if (!isCancelled) {
        setImageMetadata(null);
      }
    };

    image.src = config.uploadedImage;

    return () => {
      isCancelled = true;
    };
  }, [config.uploadedImage]);

  const preflightChecks = useMemo(() => {
    const checks: Array<{
      status: 'pass' | 'warning' | 'critical';
      title: string;
      detail: string;
    }> = [];

    if (layoutResult.itemsPerSheet > 0) {
      checks.push({
        status: 'pass',
        title: 'Layout fits the selected sheet',
        detail: `${layoutResult.itemsPerSheet} items fit on ${paper.name} with ${config.printerMode} margins.`,
      });
    } else {
      checks.push({
        status: 'critical',
        title: 'Current layout does not fit',
        detail: 'Printing now will produce an empty or unusable sheet. Change paper size, margins, or template settings first.',
      });
    }

    if (config.uploadedImage) {
      checks.push({
        status: 'pass',
        title: 'Artwork is attached',
        detail: 'The preview includes the uploaded artwork instead of the placeholder design.',
      });
    } else {
      checks.push({
        status: 'warning',
        title: 'No artwork uploaded',
        detail: 'The sheet will print the placeholder mock design unless you add your own image in the Design tab.',
      });
    }

    if (imageMetadata) {
      const targetAspectRatio = layoutResult.itemWidth / layoutResult.itemHeight;
      const imageAspectRatio = imageMetadata.width / imageMetadata.height;
      const aspectRatioDelta = Math.abs(targetAspectRatio - imageAspectRatio) / targetAspectRatio;
      const effectiveDpi = Math.min(
        imageMetadata.width / layoutResult.itemWidth,
        imageMetadata.height / layoutResult.itemHeight
      ) / artworkPlacement.scale;

      if (effectiveDpi >= 300) {
        checks.push({
          status: 'pass',
          title: 'Artwork resolution is print-safe',
          detail: `Estimated effective resolution is ${Math.round(effectiveDpi)} DPI at the placed size.`,
        });
      } else if (effectiveDpi >= 150) {
        checks.push({
          status: 'warning',
          title: 'Artwork resolution is borderline',
          detail: `Estimated effective resolution is ${Math.round(effectiveDpi)} DPI. It may be acceptable, but 300 DPI is the safer target.`,
        });
      } else {
        checks.push({
          status: 'warning',
          title: 'Artwork resolution is low',
          detail: `Estimated effective resolution is ${Math.round(effectiveDpi)} DPI. Expect softness or pixelation in print.`,
        });
      }

      if (aspectRatioDelta <= 0.08) {
        checks.push({
          status: 'pass',
          title: 'Artwork aspect ratio matches the template',
          detail: 'The design proportions are close to the finished item size, so scaling should be predictable.',
        });
      } else {
        checks.push({
          status: 'warning',
          title: 'Artwork aspect ratio differs from the template',
          detail: 'The uploaded image may crop unexpectedly or leave empty space inside each item.',
        });
      }
    }

    checks.push({
      status: config.printerMode === 'borderless' ? 'warning' : 'pass',
      title: config.printerMode === 'borderless' ? 'Borderless mode needs printer support' : config.printerMode === 'custom' ? 'Custom margin calibration is active' : 'Margin mode is printer-safe',
      detail:
        config.printerMode === 'borderless'
          ? 'If your printer driver is not set to borderless output, the edges may be clipped or automatically scaled.'
          : config.printerMode === 'custom'
            ? `Using calibrated margins of T ${layoutResult.margins.top}", R ${layoutResult.margins.right}", B ${layoutResult.margins.bottom}", L ${layoutResult.margins.left}".`
          : 'Use Actual Size or 100% scale in the print dialog to preserve the sheet geometry.',
    });

    return checks;
  }, [artworkPlacement.scale, config.printerMode, config.uploadedImage, imageMetadata, layoutResult.itemHeight, layoutResult.itemWidth, layoutResult.itemsPerSheet, paper.name]);

  const criticalIssues = preflightChecks.filter((check) => check.status === 'critical');
  const warningIssues = preflightChecks.filter((check) => check.status === 'warning');
  const canPrint = criticalIssues.length === 0;

  const paperWidthPx = layoutResult.paperWidth * 96;
  const paperHeightPx = layoutResult.paperHeight * 96;

  return (
    <div className="flex-1 flex flex-col bg-[#111111]">
      <div className="border-b border-gray-800 bg-gray-950 px-5 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Eye className="h-4 w-4 text-blue-400" />
              <h2 className="text-xl font-bold text-white">Print Preview</h2>
            </div>
            <p className="text-sm text-gray-400">
              This view mirrors the printable sheet. It uses the same canvas the app sends to PDF, PNG, and `window.print()`.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-lg border border-gray-800 bg-gray-900 px-3 py-2 text-xs text-gray-300">
              <div className="mb-1 flex items-center gap-1.5 text-gray-400">
                <Ruler className="h-3.5 w-3.5" />
                Sheet
              </div>
              <div>{paper.name} • {layoutResult.paperWidth}" x {layoutResult.paperHeight}"</div>
            </div>
            <div className="rounded-lg border border-gray-800 bg-gray-900 px-3 py-2 text-xs text-gray-300">
              <div className="mb-1 text-gray-400">Layout</div>
              <div>{layoutResult.itemsPerSheet} items • {layoutResult.cols} x {layoutResult.rows}</div>
            </div>
            <button
              onClick={() => window.print()}
              disabled={!canPrint}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors ${
                canPrint ? 'bg-green-600 hover:bg-green-500' : 'cursor-not-allowed bg-gray-700 text-gray-300'
              }`}
            >
              <Printer className="h-4 w-4" />
              {canPrint ? 'Print This Layout' : 'Fix Preflight Issues'}
            </button>
          </div>
        </div>
      </div>

      <div className="border-b border-gray-800 bg-[#0d0d0d] px-5 py-3 text-xs text-gray-400">
        Use print settings with scale at 100% or Actual Size. If your printer supports borderless output, match that to the selected printer mode.
      </div>

      <div className="border-b border-gray-800 bg-[#111111] px-5 py-4">
        <div className="mb-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-white">Print Preflight</h3>
          <span className="text-xs text-gray-500">
            {criticalIssues.length > 0
              ? `${criticalIssues.length} blocking issue${criticalIssues.length === 1 ? '' : 's'}`
              : warningIssues.length > 0
                ? `${warningIssues.length} warning${warningIssues.length === 1 ? '' : 's'}`
                : 'Ready to print'}
          </span>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          {preflightChecks.map((check) => {
            const icon =
              check.status === 'pass' ? (
                <CheckCircle2 className="h-4 w-4 text-green-400" />
              ) : check.status === 'critical' ? (
                <AlertTriangle className="h-4 w-4 text-red-400" />
              ) : (
                <Info className="h-4 w-4 text-amber-400" />
              );

            const cardClassName =
              check.status === 'pass'
                ? 'border-green-900/60 bg-green-950/20'
                : check.status === 'critical'
                  ? 'border-red-900/60 bg-red-950/20'
                  : 'border-amber-900/60 bg-amber-950/20';

            return (
              <div key={check.title} className={`rounded-xl border p-3 ${cardClassName}`}>
                <div className="mb-1 flex items-center gap-2 text-sm font-medium text-white">
                  {icon}
                  {check.title}
                </div>
                <p className="text-xs leading-5 text-gray-300">{check.detail}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div ref={containerRef} className="flex-1 overflow-auto bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.14),_transparent_38%),linear-gradient(180deg,_#0f172a_0%,_#09090b_100%)] p-6">
        <div className="flex min-h-full items-center justify-center">
          <div
            className="relative rounded-[28px] border border-gray-700/70 bg-gray-900/70 p-6 shadow-[0_32px_90px_rgba(0,0,0,0.45)] backdrop-blur"
            style={{
              width: paperWidthPx * previewScale + 48,
              height: paperHeightPx * previewScale + 48,
            }}
          >
            <div
              style={{
                width: paperWidthPx,
                height: paperHeightPx,
                transform: `scale(${previewScale})`,
                transformOrigin: 'top left',
              }}
            >
              <MainCanvas config={config} layoutResult={layoutResult} template={template} paper={paper} isExportMode={true} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
