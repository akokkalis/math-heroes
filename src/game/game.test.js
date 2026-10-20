import { describe, expect, it } from 'vitest';
import { generateQuestion, makeDistractors, checkAnswer } from './generators.js';
import { rewardsFor, starsFor, playerLevel, adaptDifficulty } from './rewards.js';
import { ALL_LEVELS, isLevelUnlocked, WORLDS } from './worlds.js';
import { generateWordProblem, renderWordProblem, TEMPLATES, CHARACTERS } from './wordProblems.js';
import { generateWordQuestion } from './generators.js';
import { pointsFor, maxAttemptsFor } from './rewards.js';
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

// Evaluate a hint like [c, 'sub', '(', a, 'mul', b, ')'] to check the answer.
function evalHint(tokens) {
  const js = tokens
    .map((t) => ({ add: '+', sub: '-', mul: '*', div: '/' })[t] ?? t)
    .join(' ');
  return Function(`return (${js})`)();
}

describe('word problems', () => {
  it('every template makes correct maths and clean text in both languages', () => {
    for (const template of TEMPLATES) {
      for (const band of BANDS) {
        for (let d = 1; d <= 6; d++) {
          for (let i = 0; i < 60; i++) {
            const q = generateWordProblem(template.topic, band, d);
            if (q.templateId !== template.id) continue;
            const { a, b, c } = q.vars;
            for (const n of [a, b, c, q.answer].filter((x) => x !== undefined)) {
              expect(Number.isInteger(n)).toBe(true);
            }
            expect(a).toBeGreaterThanOrEqual(2);
            expect(b).toBeGreaterThanOrEqual(2);
            expect(q.answer).toBeGreaterThanOrEqual(1);
            expect(evalHint(q.hint)).toBe(q.answer);
            expect(q.vars.A).not.toBe(q.vars.B);
            for (const lang of ['el', 'en']) {
              const text = renderWordProblem(q, lang);
              expect(text, `${template.id} ${lang}: ${text}`).not.toMatch(/[{}]|undefined|null/);
              expect(text[0]).toBe(text[0].toUpperCase());
            }
            // Greek text should contain no Latin letters
            expect(renderWordProblem(q, 'el')).not.toMatch(/[A-Za-z]/);
          }
        }
      }
    }
  });

  it('can generate every template', () => {
    const seen = new Set();
    for (let i = 0; i < 3000; i++) {
      for (const band of BANDS) seen.add(generateQuestion('word', band, (i % 6) + 1).templateId);
    }
    expect([...seen].sort()).toEqual(TEMPLATES.map((t) => t.id).sort());
  });

  it('offers the right answer among the choices', () => {
    for (let i = 0; i < 500; i++) {
      const q = generateWordQuestion('add', 'young', 1);
      expect(q.format).toBe('choice');
      expect(q.choices).toContain(q.answer);
      expect(new Set(q.choices).size).toBe(q.choices.length);
    }
  });

  it('uses all five characters with Greek articles', () => {
    expect(Object.keys(CHARACTERS)).toHaveLength(5);
    const q = { templateId: 'add-buy', vars: { a: 3, b: 4, A: 'nikos', B: 'maria', item: 'apple' } };
    expect(renderWordProblem(q, 'el')).toBe('Ο Νίκος έχει 3 μήλα. Αγοράζει άλλα 4. Πόσα μήλα έχει τώρα;');
    expect(renderWordProblem(q, 'en')).toBe('Nikos has 3 apples. He buys 4 more. How many apples does he have now?');
    const f = { templateId: 'sub-eat', vars: { a: 9, b: 4, A: 'maria', B: 'nikos', item: 'candy' } };
    expect(renderWordProblem(f, 'el')).toBe('Η Μαρία είχε 9 καραμέλες. Έφαγε 4. Πόσες καραμέλες της έμειναν;');
  });
});

describe('second tries', () => {
  it('gives full points first time, half later, none when shown', () => {
    expect(pointsFor({ solved: true, attempts: 1 })).toBe(1);
    expect(pointsFor({ solved: true, attempts: 3 })).toBe(0.5);
    expect(pointsFor({ solved: false, attempts: 3 })).toBe(0);
  });

  it('allows the right number of tries per format', () => {
    expect(maxAttemptsFor({ format: 'truefalse' })).toBe(1);
    expect(maxAttemptsFor({ format: 'choice', choices: [1, 2, 3, 4] })).toBe(3);
    expect(maxAttemptsFor({ format: 'choice', choices: ['<', '=', '>'] })).toBe(2);
    expect(maxAttemptsFor({ format: 'numpad' })).toBe(3);
  });
});
