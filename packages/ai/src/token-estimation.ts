export const countApproximateTokens = (text: string): number =>
  Math.max(1, text.trim().split(/\s+/).filter(Boolean).length);
