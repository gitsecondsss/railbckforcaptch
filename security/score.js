export function scoreBehavior(behavior) {
  // Simple trust score: headless = 0, UA missing = 0
  if (behavior.headless) return 0;
  if (!behavior.ua) return 0;
  return 1; // minimal positive trust
}
