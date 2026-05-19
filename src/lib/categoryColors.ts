// Fixed accent colours cycling by category array index.
// Order matches default seeding: Health, Relationships, Career, Money, Personal Brand, …custom

export const CATEGORY_COLORS = [
  '#f97316', // orange  — Health
  '#818cf8', // indigo  — Relationships
  '#eab308', // yellow  — Career
  '#22c55e', // green   — Money
  '#ec4899', // pink    — Personal Brand
  '#06b6d4', // cyan    — custom overflow
] as const

export function categoryColor(index: number): string {
  return CATEGORY_COLORS[index % CATEGORY_COLORS.length]
}
