// Warm editorial accent palette — matches cream design system
// Named colours by category convention, falling back to index-based cycling.

export const CATEGORY_NAME_COLORS: Record<string, string> = {
  'Health':           '#D7642C',
  'Relationships':    '#D6557A',
  'Career':           '#4A4EE0',
  'Money':            '#2E8C7A',
  'Personal Brand':   '#1A1814',
}

const FALLBACK_COLORS = [
  '#D7642C', // terracotta
  '#4A4EE0', // indigo
  '#2E8C7A', // teal
  '#D6557A', // rose
  '#1A1814', // ink
  '#8B826F', // warm grey
] as const

/** Resolve a category's accent color by name first, then by index. */
export function getCategoryColor(name: string, index = 0): string {
  return CATEGORY_NAME_COLORS[name] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length]
}

/** Legacy index-based accessor kept for backward compat. */
export function categoryColor(index: number): string {
  return FALLBACK_COLORS[index % FALLBACK_COLORS.length]
}
