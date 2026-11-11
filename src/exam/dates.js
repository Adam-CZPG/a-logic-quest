// Tiny helpers shared by the first screen. Kept apart from engine.js, which pulls in every task generator.

export function dailyKey(date = new Date()) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// tasks in one friend duel
export const DUEL_SIZE = 10;
