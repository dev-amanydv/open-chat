const AVATAR_COLORS = [
  "#6366F1",
  "#8B5CF6",
  "#A855F7",
  "#EC4899",
  "#DB2777",
  "#F43F5E",
  "#E11D48",
  "#0EA5E9",
  "#0891B2",
  "#14B8A6",
  "#10B981",
  "#059669",
  "#D97706",
  "#64748B",
];

export function avatarColor(seed: string): string {
  const key = seed.trim().toLowerCase() || "?";
  let hash = 2166136261;
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function initialFor(name: string | undefined | null): string {
  const trimmed = name?.trim();
  if (!trimmed) return "?";
  return trimmed[0].toUpperCase();
}
