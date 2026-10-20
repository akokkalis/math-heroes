// Turning a finished level into stars, coins and XP.

export function starsFor(correct, total) {
  const ratio = total ? correct / total : 0;
  if (ratio >= 0.9) return 3;
  if (ratio >= 0.7) return 2;
  if (ratio >= 0.5) return 1;
  return 0;
}

// Points for one question: full point on the first try, half a point if the
// child got there on a later try, nothing if the answer had to be shown.
export function pointsFor({ solved, attempts }) {
  if (!solved) return 0;
  return attempts === 1 ? 1 : 0.5;
}

// Coins: 1 per point, plus 5 for every NEW star earned on this level.
// Replaying for the same stars still pays a little, but not enough to farm.
// `correct` may be fractional (sum of points).
export function rewardsFor({ correct, total, previousStars = 0, isBoss = false }) {
  const stars = starsFor(correct, total);
  const newStars = Math.max(0, stars - previousStars);
  const coins = Math.round(correct) + newStars * 5 + (isBoss && newStars > 0 ? 20 : 0);
  const xp = Math.round(correct * 10);
  return { stars, newStars, coins, xp };
}

// How many tries a question allows before the answer is shown.
export function maxAttemptsFor(question) {
  if (question.format === 'truefalse') return 1;
  if (question.format === 'choice') return Math.min(3, question.choices.length - 1);
  return 3;
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
