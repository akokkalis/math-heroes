// The world map: the labours of Hercules, one math topic per world.
// Names and stories live in the i18n files under world.<id>.*
// To add a world, add an entry here and its texts in el.json / en.json.

export const LEVELS_PER_WORLD = 5;
export const QUESTIONS_PER_LEVEL = 10;
export const QUESTIONS_PER_BOSS = 15;

export const WORLDS = [
  { id: 'lion', topic: 'add', emoji: '🦁', color: '#e0a32e' },
  { id: 'hydra', topic: 'sub', emoji: '🐍', color: '#3f9b6b' },
  { id: 'hind', topic: 'mul', emoji: '🦌', color: '#c0703d' },
  { id: 'boar', topic: 'div', emoji: '🐗', color: '#8a5a3c' },
  { id: 'stables', topic: 'frac', emoji: '🏛️', color: '#4a72b8' },
  { id: 'apples', topic: 'word', emoji: '🍏', color: '#b8962e' },
];

// Boss levels of these topics mix in word problems (every 3rd question).
export const WORD_PROBLEMS_IN_BOSS = ['add', 'sub', 'mul', 'div'];

// Level ids look like "lion-3". The last level of each world is the boss.
export function levelsOf(world) {
  return Array.from({ length: LEVELS_PER_WORLD }, (_, i) => {
    const number = i + 1;
    return {
      id: `${world.id}-${number}`,
      worldId: world.id,
      topic: world.topic,
      number,
      isBoss: number === LEVELS_PER_WORLD,
      difficulty: number === LEVELS_PER_WORLD ? 6 : number,
      questionCount: number === LEVELS_PER_WORLD ? QUESTIONS_PER_BOSS : QUESTIONS_PER_LEVEL,
    };
  });
}

export const ALL_LEVELS = WORLDS.flatMap(levelsOf);

export function findLevel(levelId) {
  return ALL_LEVELS.find((l) => l.id === levelId);
}

export function worldIndex(worldId) {
  return WORLDS.findIndex((w) => w.id === worldId);
}

// A level is unlocked when the previous level has at least one star.
// The very first level is always open.
export function isLevelUnlocked(levelId, starsByLevel) {
  const idx = ALL_LEVELS.findIndex((l) => l.id === levelId);
  if (idx <= 0) return true;
  return (starsByLevel[ALL_LEVELS[idx - 1].id] || 0) >= 1;
}
