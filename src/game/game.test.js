import { describe, expect, it } from 'vitest';
import { generateQuestion, makeDistractors, checkAnswer } from './generators.js';
import { rewardsFor, starsFor, playerLevel, adaptDifficulty } from './rewards.js';
import { ALL_LEVELS, isLevelUnlocked, WORLDS } from './worlds.js';
import el from '../i18n/el.json';
import en from '../i18n/en.json';

const TOPICS = ['add', 'sub', 'mul', 'div', 'frac'];
const BANDS = ['young', 'older'];

describe('question generators', () => {
  it('produces correct, non-negative, whole answers for every topic and difficulty', () => {
    for (const topic of TOPICS) {
      for (const band of BANDS) {
        for (let d = 1; d <= 6; d++) {
          for (let i = 0; i < 300; i++) {
            const q = generateQuestion(topic, band, d);
            if (topic === 'frac') {
              const [an, ad] = q.a;
              const [bn, bd] = q.b;
              const expected = an / ad > bn / bd ? '>' : an / ad < bn / bd ? '<' : '=';
              expect(q.answer).toBe(expected);
              continue;
            }
            const real = { add: q.a + q.b, sub: q.a - q.b, mul: q.a * q.b, div: q.a / q.b }[topic];
            expect(Number.isInteger(real)).toBe(true);
            expect(real).toBeGreaterThanOrEqual(0);
            if (q.format === 'truefalse') expect(q.answer).toBe(q.shown === real);
            else expect(q.answer).toBe(real);
            if (q.format === 'choice') {
              expect(q.choices).toContain(q.answer);
              expect(new Set(q.choices).size).toBe(q.choices.length);
              expect(q.choices.length).toBeGreaterThanOrEqual(2);
            }
          }
        }
      }
    }
  });

  it('keeps young addition small at level 1', () => {
    for (let i = 0; i < 200; i++) {
      const q = generateQuestion('add', 'young', 1);
      expect(q.a + q.b).toBeLessThanOrEqual(10);
    }
  });

  it('never offers the right answer as a distractor', () => {
    for (let n = 0; n < 200; n++) {
      expect(makeDistractors(n)).not.toContain(n);
    }
  });

  it('checks answers', () => {
    const q = { answer: 12 };
    expect(checkAnswer(q, 12)).toBe(true);
    expect(checkAnswer(q, 11)).toBe(false);
  });
});

describe('rewards', () => {
  it('gives stars by accuracy', () => {
    expect(starsFor(10, 10)).toBe(3);
    expect(starsFor(7, 10)).toBe(2);
    expect(starsFor(5, 10)).toBe(1);
    expect(starsFor(4, 10)).toBe(0);
  });

  it('only pays star bonus for new stars', () => {
    expect(rewardsFor({ correct: 10, total: 10, previousStars: 0 }).coins).toBe(25);
    expect(rewardsFor({ correct: 10, total: 10, previousStars: 3 }).coins).toBe(10);
  });

  it('levels up with growing XP steps', () => {
    expect(playerLevel(0).level).toBe(1);
    expect(playerLevel(100).level).toBe(2);
    expect(playerLevel(299).level).toBe(2);
    expect(playerLevel(300).level).toBe(3);
  });

  it('adapts difficulty by one step at most', () => {
    expect(adaptDifficulty(3, 4)).toBe(4);
    expect(adaptDifficulty(3, -2)).toBe(2);
    expect(adaptDifficulty(1, -5)).toBe(1);
    expect(adaptDifficulty(3, 1)).toBe(3);
  });
});

describe('worlds', () => {
  it('unlocks levels in order', () => {
    expect(isLevelUnlocked(ALL_LEVELS[0].id, {})).toBe(true);
    expect(isLevelUnlocked(ALL_LEVELS[1].id, {})).toBe(false);
    expect(isLevelUnlocked(ALL_LEVELS[1].id, { [ALL_LEVELS[0].id]: 1 })).toBe(true);
  });
});

describe('translations', () => {
  it('has the same keys in Greek and English', () => {
    expect(Object.keys(el).sort()).toEqual(Object.keys(en).sort());
  });

  it('has names and stories for every world and topic', () => {
    for (const w of WORLDS) {
      for (const dict of [el, en]) {
        expect(dict[`world.${w.id}.name`]).toBeTruthy();
        expect(dict[`world.${w.id}.story`]).toBeTruthy();
        expect(dict[`topic.${w.topic}`]).toBeTruthy();
      }
    }
  });
});
