// Procedural question generators.
// Every question is generated from numbers, so content never runs out
// and the app needs no question bank or internet connection.
//
// A question looks like:
// {
//   topic: 'add' | 'sub' | 'mul' | 'div' | 'frac',
//   a, b,            // operands (for 'frac' these are [numerator, denominator])
//   answer,          // number, or '<' | '>' | '=' for fractions
//   format: 'choice' | 'numpad' | 'truefalse',
//   choices,         // for 'choice'
//   shown,           // for 'truefalse': the result displayed to the child
// }

import { generateWordProblem } from './wordProblems.js';

// Difficulty runs from 1 (easiest) to 6 (boss level).
// ageBand is 'young' (6-8) or 'older' (9-12).
export const RANGES = {
  add: { young: [10, 20, 20, 50, 100, 100], older: [50, 100, 500, 1000, 1000, 5000] },
  mul: { young: [2, 3, 5, 5, 10, 10], older: [5, 10, 10, 12, 12, 15] },
};

const clampDifficulty = (d) => Math.max(1, Math.min(6, Math.round(d)));

export const randInt = (min, max, rng = Math.random) =>
  Math.floor(rng() * (max - min + 1)) + min;

const pick = (list, rng = Math.random) => list[Math.floor(rng() * list.length)];

function shuffle(list, rng = Math.random) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Plausible wrong answers: off by one or two, off by ten, digits swapped.
export function makeDistractors(answer, count = 3, rng = Math.random) {
  const candidates = new Set();
  const offsets = [1, -1, 2, -2, 10, -10, 3, -3];
  for (const o of shuffle(offsets, rng)) candidates.add(answer + o);
  if (answer >= 10) candidates.add(Number(String(answer).split('').reverse().join('')));
  candidates.delete(answer);
  const valid = [...candidates].filter((n) => n >= 0);
  return shuffle(valid, rng).slice(0, count);
}

function withFormat(q, formats, rng) {
  const format = pick(formats, rng);
  if (format === 'choice') {
    return { ...q, format, choices: shuffle([q.answer, ...makeDistractors(q.answer, 3, rng)], rng) };
  }
  if (format === 'truefalse') {
    const isTrue = rng() < 0.5;
    const shown = isTrue ? q.answer : makeDistractors(q.answer, 1, rng)[0];
    return { ...q, format, shown, answer: shown === q.answer };
  }
  return { ...q, format: 'numpad' };
}

// Younger children and easier levels see more multiple choice.
function formatsFor(ageBand, d) {
  if (ageBand === 'young' && d <= 2) return ['choice', 'choice', 'truefalse'];
  return ['choice', 'numpad', 'numpad', 'truefalse'];
}

function genAdd(ageBand, d, rng) {
  const max = RANGES.add[ageBand][d - 1];
  const a = randInt(1, max - 1, rng);
  const b = randInt(1, max - a, rng);
  return { topic: 'add', a, b, answer: a + b };
}

function genSub(ageBand, d, rng) {
  const max = RANGES.add[ageBand][d - 1];
  const a = randInt(2, max, rng);
  const b = randInt(1, a - 1, rng);
  return { topic: 'sub', a, b, answer: a - b };
}

function genMul(ageBand, d, rng) {
  const maxTable = RANGES.mul[ageBand][d - 1];
  const a = randInt(1, maxTable, rng);
  const b = randInt(1, ageBand === 'older' && d >= 4 ? 12 : 10, rng);
  return { topic: 'mul', a, b, answer: a * b };
}

function genDiv(ageBand, d, rng) {
  // Built backwards from a multiplication, so it always divides evenly.
  const { a: divisor, b: quotient } = genMul(ageBand, d, rng);
  const b = Math.max(1, divisor);
  return { topic: 'div', a: b * quotient, b, answer: quotient };
}

function genFrac(ageBand, d, rng) {
  const sameDenominator = ageBand === 'young' || d <= 2;
  const maxDen = ageBand === 'young' ? 4 + d : 6 + d * 2;
  const den1 = randInt(2, maxDen, rng);
  const den2 = sameDenominator ? den1 : randInt(2, maxDen, rng);
  const a = [randInt(1, den1, rng), den1];
  const b = [randInt(1, den2, rng), den2];
  const left = a[0] * b[1];
  const right = b[0] * a[1];
  const answer = left > right ? '>' : left < right ? '<' : '=';
  return { topic: 'frac', a, b, answer, format: 'choice', choices: ['<', '=', '>'] };
}

const GENERATORS = { add: genAdd, sub: genSub, mul: genMul, div: genDiv, frac: genFrac };

// Four answer choices: the right one, an optional "wrong operation" trap,
// and close-by distractors.
export function makeChoices(answer, trap = null, rng = Math.random) {
  const wrong = [];
  if (trap !== null && trap !== answer) wrong.push(trap);
  for (const d of makeDistractors(answer, 4, rng)) if (!wrong.includes(d)) wrong.push(d);
  return shuffle([answer, ...wrong.slice(0, 3)], rng);
}

export function generateQuestion(topic, ageBand = 'young', difficulty = 1, rng = Math.random) {
  const d = clampDifficulty(difficulty);
  if (topic === 'word') {
    return generateWordProblem(null, ageBand, d, rng, (answer, trap) => makeChoices(answer, trap, rng));
  }
  const gen = GENERATORS[topic];
  if (!gen) throw new Error(`Unknown topic: ${topic}`);
  const q = gen(ageBand, d, rng);
  if (q.format) return q; // fractions set their own format
  return withFormat(q, formatsFor(ageBand, d), rng);
}

export function checkAnswer(question, given) {
  return given === question.answer;
}

// A word problem for one specific operation (used to mix word problems into boss levels).
export function generateWordQuestion(subtopic, ageBand = 'young', difficulty = 1, rng = Math.random) {
  return generateWordProblem(subtopic, ageBand, clampDifficulty(difficulty), rng, (answer, trap) =>
    makeChoices(answer, trap, rng),
  );
}
