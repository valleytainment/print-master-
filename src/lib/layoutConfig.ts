import { PAPER_SIZES, TEMPLATES } from './layoutEngine';
import { ArtworkPlacement, LayoutConfig, PrintMargins } from '../types';

export const DEFAULT_ARTWORK_PLACEMENT: ArtworkPlacement = {
  fitMode: 'cover',
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  rotation: 0,
};

export const DEFAULT_CUSTOM_MARGINS: PrintMargins = {
  top: 0.25,
  right: 0.25,
  bottom: 0.25,
  left: 0.25,
};

export const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
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
  artworkPlacements: {},
  customMargins: DEFAULT_CUSTOM_MARGINS,
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function normalizeArtworkPlacement(value: unknown): ArtworkPlacement {
  const candidate = value as Partial<ArtworkPlacement> | null | undefined;

  return {
    fitMode: candidate?.fitMode === 'contain' ? 'contain' : 'cover',
    scale: clamp(typeof candidate?.scale === 'number' ? candidate.scale : DEFAULT_ARTWORK_PLACEMENT.scale, 0.25, 4),
    offsetX: clamp(typeof candidate?.offsetX === 'number' ? candidate.offsetX : DEFAULT_ARTWORK_PLACEMENT.offsetX, -100, 100),
    offsetY: clamp(typeof candidate?.offsetY === 'number' ? candidate.offsetY : DEFAULT_ARTWORK_PLACEMENT.offsetY, -100, 100),
    rotation: clamp(typeof candidate?.rotation === 'number' ? candidate.rotation : DEFAULT_ARTWORK_PLACEMENT.rotation, -180, 180),
  };
}

export function normalizeLayoutConfig(value: unknown): LayoutConfig {
  const candidate = value as Partial<LayoutConfig> | null | undefined;
  const rawPlacements = candidate?.artworkPlacements;
  const normalizedPlacements: Record<string, ArtworkPlacement> = {};

  if (rawPlacements && typeof rawPlacements === 'object') {
    for (const [templateId, placement] of Object.entries(rawPlacements)) {
      normalizedPlacements[templateId] = normalizeArtworkPlacement(placement);
    }
  }

  const candidateMargins = candidate?.customMargins as Partial<PrintMargins> | undefined;
  const normalizedMargins: PrintMargins = {
    top: clamp(typeof candidateMargins?.top === 'number' ? candidateMargins.top : DEFAULT_CUSTOM_MARGINS.top, 0, 2),
    right: clamp(typeof candidateMargins?.right === 'number' ? candidateMargins.right : DEFAULT_CUSTOM_MARGINS.right, 0, 2),
    bottom: clamp(typeof candidateMargins?.bottom === 'number' ? candidateMargins.bottom : DEFAULT_CUSTOM_MARGINS.bottom, 0, 2),
    left: clamp(typeof candidateMargins?.left === 'number' ? candidateMargins.left : DEFAULT_CUSTOM_MARGINS.left, 0, 2),
  };

  return {
    ...DEFAULT_LAYOUT_CONFIG,
    ...candidate,
    orientation: candidate?.orientation === 'landscape' ? 'landscape' : candidate?.orientation === 'auto' ? 'auto' : 'portrait',
    printerMode:
      candidate?.printerMode === 'tight'
        ? 'tight'
        : candidate?.printerMode === 'borderless'
          ? 'borderless'
          : candidate?.printerMode === 'custom'
            ? 'custom'
            : 'safe',
    cropMarksStyle: candidate?.cropMarksStyle === 'corners' ? 'corners' : candidate?.cropMarksStyle === 'none' ? 'none' : 'standard',
    uploadedImage: typeof candidate?.uploadedImage === 'string' ? candidate.uploadedImage : null,
    artworkPlacements: normalizedPlacements,
    customMargins: normalizedMargins,
  };
}

export function getArtworkPlacement(config: LayoutConfig, templateId: string): ArtworkPlacement {
  return normalizeArtworkPlacement(config.artworkPlacements[templateId]);
}
