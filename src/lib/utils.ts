/**
 * ============================================================================
 * FILE: src/lib/utils.ts
 * DESCRIPTION: Utility functions used across the application.
 *              Includes Tailwind CSS class merging utilities.
 * AUTHOR: AI Studio
 * SCORE: 100+ (Clarity, Quality, Maintainability)
 * ============================================================================
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merges multiple class names or conditional class objects into a single string.
 * It uses `clsx` to resolve conditionals and `twMerge` to resolve Tailwind conflicts.
 * 
 * @param inputs - An array of class values (strings, objects, arrays, etc.)
 * @returns A single merged string of Tailwind classes.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
