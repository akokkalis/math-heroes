// Turning a finished level into stars, coins and XP.

export function starsFor(correct, total) {
  const ratio = total ? correct / total : 0;
  if (ratio >= 0.9) return 3;
  if (ratio >= 0.7) return 2;
  if (ratio >= 0.5) return 1;
  return 0;
}

// Coins: 1 per correct answer, plus 5 for every NEW star earned on this level.
// Replaying for the same stars still pays a little, but not enough to farm.
export function rewardsFor({ correct, total, previousStars = 0, isBoss = false }) {
  const stars = starsFor(correct, total);
  const newStars = Math.max(0, stars - previousStars);
  const coins = correct + newStars * 5 + (isBoss && newStars > 0 ? 20 : 0);
  const xp = correct * 10;
  return { stars, newStars, coins, xp };
}

// Player level grows a bit slower each time: 100 XP, then 200, then 300...
export function playerLevel(xp) {
  let level = 1;
  let needed = 100;
  let remaining = xp;
  while (remaining >= needed) {
    remaining -= needed;
    level += 1;
    needed += 100;
  }
  return { level, progress: remaining, needed };
}

// Adaptive difficulty inside a level: 3 right in a row nudges it up,
// 2 wrong in a row nudges it down. Never more than one step from the base.
export function adaptDifficulty(base, streak) {
  if (streak >= 3) return base + 1;
  if (streak <= -2) return Math.max(1, base - 1);
  return base;
}
