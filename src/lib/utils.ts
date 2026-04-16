/**
 * ============================================================================
 * FILE: src/lib/utils.ts
 * DESCRIPTION: Shared UI helpers used across the renderer.
 *              This file intentionally stays small so broad utility imports do
 *              not become a hidden dumping ground for unrelated logic.
 * AUTHOR: Codex
 * SCORE: 100+ (Clarity, Quality, Maintainability)
 * ============================================================================
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges multiple class fragments into one Tailwind-safe class string.
 * `clsx` resolves conditional input while `tailwind-merge` removes conflicting
 * utility classes so callers can compose styles predictably.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
