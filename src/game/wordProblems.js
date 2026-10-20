// Word problems (προβλήματα).
//
// Each template is written once in Greek and once in English. The numbers,
// the character and the item change every time, so a few templates give
// hundreds of different problems.
//
// HOW TO ADD A PROBLEM
// 1. Copy a template below and give it a new unique `id`.
// 2. `topic` is the operation: 'add' | 'sub' | 'mul' | 'div' | 'multi' (two steps).
// 3. `make(rng, L)` picks the numbers and returns
//      { a, b, c?, answer, hint }
//    - L holds the number limits for the child's age and the level difficulty
//      (L.max for + and −, L.table for × and ÷).
//    - `hint` is the calculation shown after two wrong tries, as a list of
//      tokens: numbers, 'add' | 'sub' | 'mul' | 'div', '(' and ')'.
// 4. Write the text with placeholders:
//      {a} {b} {c}   the numbers
//      {A.nom}       "η Μαρία" / "Maria"     (who the problem is about)
//      {B.nom}       a second, different child
//      {A.acc} {A.gen} {A.to} {A.cl}   Greek forms: τη Μαρία, της Μαρίας, στη Μαρία, της
//      {A.subj} {A.obj} {A.poss}       English: she/he, her/him, her/his
//      {item}        plural item, e.g. "μήλα" / "apples"
//      {item.how}    Πόσα / Πόσες (Greek, matches the item's gender)
//      {item.other}  άλλα / άλλες
//      {item.the}    τα / τις
//      {item.more}   περισσότερα / περισσότερες
//    The first letter of each sentence is capitalised automatically.
// 5. If the problem uses an item, set `items` to a tag: 'any' | 'food' | 'collect' | 'share'.
// 6. Run `npm test` — it renders every template in both languages and checks the maths.

import { RANGES, randInt } from './generators.js';

// ---------- the five characters ----------
export const CHARACTERS = {
  maria: {
    el: { nom: 'η Μαρία', acc: 'τη Μαρία', gen: 'της Μαρίας', to: 'στη Μαρία', cl: 'της' },
    en: { nom: 'Maria', acc: 'Maria', gen: "Maria's", subj: 'she', obj: 'her', poss: 'her' },
  },
  nikos: {
    el: { nom: 'ο Νίκος', acc: 'τον Νίκο', gen: 'του Νίκου', to: 'στον Νίκο', cl: 'του' },
    en: { nom: 'Nikos', acc: 'Nikos', gen: "Nikos's", subj: 'he', obj: 'him', poss: 'his' },
  },
  eleni: {
    el: { nom: 'η Ελένη', acc: 'την Ελένη', gen: 'της Ελένης', to: 'στην Ελένη', cl: 'της' },
    en: { nom: 'Eleni', acc: 'Eleni', gen: "Eleni's", subj: 'she', obj: 'her', poss: 'her' },
  },
  giorgos: {
    el: { nom: 'ο Γιώργος', acc: 'τον Γιώργο', gen: 'του Γιώργου', to: 'στον Γιώργο', cl: 'του' },
    en: { nom: 'Giorgos', acc: 'Giorgos', gen: "Giorgos's", subj: 'he', obj: 'him', poss: 'his' },
  },
  anna: {
    el: { nom: 'η Άννα', acc: 'την Άννα', gen: 'της Άννας', to: 'στην Άννα', cl: 'της' },
    en: { nom: 'Anna', acc: 'Anna', gen: "Anna's", subj: 'she', obj: 'her', poss: 'her' },
  },
};

// ---------- items ----------
// Only neuter and feminine plurals: their Greek nominative and accusative are
// identical, so the sentence is correct wherever the item appears.
// Numbers in problems are always 2 or more, so items are always plural.
export const ITEMS = {
  apple: { emoji: '🍎', gender: 'n', el: 'μήλα', en: 'apples', tags: ['food', 'collect', 'share'] },
  orange: { emoji: '🍊', gender: 'n', el: 'πορτοκάλια', en: 'oranges', tags: ['food', 'collect', 'share'] },
  cookie: { emoji: '🍪', gender: 'n', el: 'κουλουράκια', en: 'cookies', tags: ['food', 'share'] },
  candy: { emoji: '🍬', gender: 'f', el: 'καραμέλες', en: 'sweets', tags: ['food', 'share'] },
  olive: { emoji: '🫒', gender: 'f', el: 'ελιές', en: 'olives', tags: ['food', 'collect'] },
  pencil: { emoji: '✏️', gender: 'n', el: 'μολύβια', en: 'pencils', tags: ['share'] },
  sticker: { emoji: '⭐', gender: 'n', el: 'αυτοκόλλητα', en: 'stickers', tags: ['share'] },
  card: { emoji: '🃏', gender: 'f', el: 'κάρτες', en: 'cards', tags: ['share'] },
  ball: { emoji: '⚽', gender: 'f', el: 'μπάλες', en: 'balls', tags: [] },
  shell: { emoji: '🐚', gender: 'n', el: 'κοχύλια', en: 'shells', tags: ['collect', 'share'] },
  flower: { emoji: '🌼', gender: 'n', el: 'λουλούδια', en: 'flowers', tags: ['collect', 'share'] },
};

const GREEK_GENDER_WORDS = {
  n: { how: 'πόσα', other: 'άλλα', the: 'τα', more: 'περισσότερα' },
  f: { how: 'πόσες', other: 'άλλες', the: 'τις', more: 'περισσότερες' },
};

// ---------- helpers for templates ----------
const add = (L, rng) => {
  const a = randInt(2, L.max - 2, rng);
  const b = randInt(2, Math.max(2, L.max - a), rng);
  return { a, b, answer: a + b, hint: [a, 'add', b] };
};
const sub = (L, rng) => {
  const a = randInt(5, L.max, rng);
  const b = randInt(2, a - 2, rng);
  return { a, b, answer: a - b, hint: [a, 'sub', b] };
};
const mul = (L, rng) => {
  const a = randInt(2, L.table, rng);
  const b = randInt(2, 10, rng);
  return { a, b, answer: a * b, hint: [a, 'mul', b] };
};
// a ÷ b, always exact
const div = (L, rng) => {
  const b = randInt(2, Math.min(10, L.table), rng);
  const answer = randInt(2, 10, rng);
  return { a: b * answer, b, answer, hint: [b * answer, 'div', b] };
};

// ---------- templates ----------
export const TEMPLATES = [
  // ===== addition =====
  {
    id: 'add-buy', topic: 'add', items: 'any',
    make: (rng, L) => add(L, rng),
    el: '{A.nom} έχει {a} {item}. Αγοράζει {item.other} {b}. {item.how} {item} έχει τώρα;',
    en: '{A.nom} has {a} {item}. {A.subj} buys {b} more. How many {item} does {A.subj} have now?',
  },
  {
    id: 'add-together', topic: 'add', items: 'any',
    make: (rng, L) => add(L, rng),
    el: '{A.nom} έχει {a} {item} και {B.nom} έχει {b}. {item.how} {item} έχουν μαζί;',
    en: '{A.nom} has {a} {item} and {B.nom} has {b}. How many {item} do they have together?',
  },
  {
    id: 'add-collect', topic: 'add', items: 'collect',
    make: (rng, L) => add(L, rng),
    el: '{A.nom} μάζεψε {a} {item} το πρωί και {b} το απόγευμα. {item.how} {item} μάζεψε συνολικά;',
    en: '{A.nom} collected {a} {item} in the morning and {b} in the afternoon. How many {item} did {A.subj} collect in total?',
  },
  {
    id: 'add-money', topic: 'add',
    make: (rng, L) => add(L, rng),
    el: '{A.nom} έχει {a} ευρώ. {B.nom} {A.cl} δίνει {b} ευρώ ακόμα. Πόσα ευρώ έχει τώρα {A.nom};',
    en: '{A.nom} has €{a}. {B.nom} gives {A.obj} €{b} more. How many euros does {A.nom} have now?',
  },
  {
    id: 'add-pages', topic: 'add',
    make: (rng, L) => add(L, rng),
    el: '{A.nom} διάβασε {a} σελίδες τη Δευτέρα και {b} σελίδες την Τρίτη. Πόσες σελίδες διάβασε συνολικά;',
    en: '{A.nom} read {a} pages on Monday and {b} pages on Tuesday. How many pages did {A.subj} read in total?',
  },

  // ===== subtraction =====
  {
    id: 'sub-eat', topic: 'sub', items: 'food',
    make: (rng, L) => sub(L, rng),
    el: '{A.nom} είχε {a} {item}. Έφαγε {b}. {item.how} {item} {A.cl} έμειναν;',
    en: '{A.nom} had {a} {item}. {A.subj} ate {b}. How many {item} are left?',
  },
  {
    id: 'sub-give', topic: 'sub', items: 'share',
    make: (rng, L) => sub(L, rng),
    el: '{A.nom} έχει {a} {item}. Δίνει {b} {B.to}. {item.how} {item} {A.cl} μένουν;',
    en: '{A.nom} has {a} {item}. {A.subj} gives {b} to {B.nom}. How many {item} does {A.subj} have left?',
  },
  {
    id: 'sub-compare', topic: 'sub', items: 'any',
    make: (rng, L) => sub(L, rng),
    el: '{A.nom} έχει {a} {item} και {B.nom} έχει {b}. {item.how} {item.more} {item} έχει {A.nom} από {B.acc};',
    en: '{A.nom} has {a} {item} and {B.nom} has {b}. How many more {item} does {A.nom} have than {B.nom}?',
  },
  {
    id: 'sub-money', topic: 'sub',
    make: (rng, L) => sub(L, rng),
    el: '{A.nom} έχει {a} ευρώ. Αγοράζει ένα βιβλίο που κοστίζει {b} ευρώ. Πόσα ευρώ {A.cl} μένουν;',
    en: '{A.nom} has €{a}. {A.subj} buys a book that costs €{b}. How many euros does {A.subj} have left?',
  },
  {
    id: 'sub-bus', topic: 'sub',
    make: (rng, L) => sub(L, rng),
    el: 'Σε ένα λεωφορείο είναι {a} παιδιά. Στη στάση κατεβαίνουν {b}. Πόσα παιδιά μένουν στο λεωφορείο;',
    en: 'There are {a} children on a bus. At the stop, {b} get off. How many children are still on the bus?',
  },

  // ===== multiplication =====
  {
    id: 'mul-bags', topic: 'mul', items: 'any',
    make: (rng, L) => mul(L, rng),
    el: '{A.nom} έχει {a} σακούλες. Κάθε σακούλα έχει {b} {item}. {item.how} {item} έχει συνολικά;',
    en: '{A.nom} has {a} bags. Each bag has {b} {item}. How many {item} does {A.subj} have in total?',
  },
  {
    id: 'mul-desks', topic: 'mul',
    make: (rng, L) => mul(L, rng),
    el: 'Στην τάξη υπάρχουν {a} σειρές με {b} θρανία η καθεμία. Πόσα θρανία υπάρχουν;',
    en: 'In the classroom there are {a} rows with {b} desks in each. How many desks are there?',
  },
  {
    id: 'mul-notebooks', topic: 'mul',
    make: (rng, L) => mul(L, rng),
    el: '{A.nom} αγοράζει {a} τετράδια. Κάθε τετράδιο κοστίζει {b} ευρώ. Πόσα ευρώ πληρώνει;',
    en: '{A.nom} buys {a} notebooks. Each notebook costs €{b}. How many euros does {A.subj} pay?',
  },
  {
    id: 'mul-days', topic: 'mul',
    make: (rng, L) => mul(L, rng),
    el: '{A.nom} λύνει {b} ασκήσεις κάθε μέρα. Πόσες ασκήσεις λύνει σε {a} μέρες;',
    en: '{A.nom} solves {b} exercises every day. How many exercises does {A.subj} solve in {a} days?',
  },
  {
    id: 'mul-horses', topic: 'mul',
    make: (rng, L) => {
      const a = randInt(2, Math.max(3, L.table), rng);
      return { a, b: 4, answer: a * 4, hint: [a, 'mul', 4] };
    },
    el: 'Σε μια φάρμα υπάρχουν {a} άλογα. Κάθε άλογο έχει {b} πόδια. Πόσα πόδια έχουν όλα μαζί;',
    en: 'On a farm there are {a} horses. Each horse has {b} legs. How many legs do they have altogether?',
  },

  // ===== division =====
  {
    id: 'div-share', topic: 'div', items: 'share',
    make: (rng, L) => div(L, rng),
    el: '{A.nom} έχει {a} {item} και {item.the} μοιράζει εξίσου σε {b} φίλους. {item.how} {item} παίρνει ο καθένας;',
    en: '{A.nom} has {a} {item} and shares them equally among {b} friends. How many {item} does each friend get?',
  },
  {
    id: 'div-boxes', topic: 'div', items: 'any',
    make: (rng, L) => div(L, rng),
    el: 'Σε κάθε κουτί χωράνε {b} {item}. Πόσα κουτιά χρειάζονται για {a} {item};',
    en: 'Each box holds {b} {item}. How many boxes are needed for {a} {item}?',
  },
  {
    id: 'div-teams', topic: 'div',
    make: (rng, L) => div(L, rng),
    el: 'Στη γυμναστική είναι {a} παιδιά. Χωρίζονται σε ομάδες των {b}. Πόσες ομάδες γίνονται;',
    en: 'There are {a} children in the PE lesson. They split into teams of {b}. How many teams are there?',
  },
  {
    id: 'div-icecream', topic: 'div',
    make: (rng, L) => div(L, rng),
    el: '{A.nom} πλήρωσε {a} ευρώ για {b} παγωτά. Όλα κοστίζουν το ίδιο. Πόσα ευρώ κοστίζει το ένα παγωτό;',
    en: '{A.nom} paid €{a} for {b} ice creams. They all cost the same. How many euros does one ice cream cost?',
  },
  {
    id: 'div-book', topic: 'div',
    make: (rng, L) => div(L, rng),
    el: 'Ένα βιβλίο έχει {a} σελίδες. {A.nom} διαβάζει {b} σελίδες τη μέρα. Σε πόσες μέρες θα το τελειώσει;',
    en: 'A book has {a} pages. {A.nom} reads {b} pages a day. In how many days will {A.subj} finish it?',
  },

  // ===== two steps (older children) =====
  {
    id: 'multi-change', topic: 'multi',
    make: (rng) => {
      const a = randInt(2, 6, rng);
      const b = randInt(2, 9, rng);
      const cost = a * b;
      const c = [10, 20, 50, 100].find((note) => note > cost);
      return { a, b, c, answer: c - cost, hint: [c, 'sub', '(', a, 'mul', b, ')'] };
    },
    el: '{A.nom} αγοράζει {a} τετράδια. Το καθένα κοστίζει {b} ευρώ. Πληρώνει με {c} ευρώ. Πόσα ευρώ ρέστα παίρνει;',
    en: '{A.nom} buys {a} notebooks. Each one costs €{b}. {A.subj} pays with €{c}. How many euros of change does {A.subj} get?',
  },
  {
    id: 'multi-packs', topic: 'multi', items: 'share',
    make: (rng) => {
      const a = randInt(2, 6, rng);
      const b = randInt(2, 10, rng);
      const c = randInt(2, a * b - 2, rng);
      return { a, b, c, answer: a * b - c, hint: ['(', a, 'mul', b, ')', 'sub', c] };
    },
    el: '{A.nom} αγοράζει {a} πακέτα με {b} {item} το καθένα. Δίνει {c} {B.to}. {item.how} {item} {A.cl} μένουν;',
    en: '{A.nom} buys {a} packs with {b} {item} in each. {A.subj} gives {c} to {B.nom}. How many {item} does {A.subj} have left?',
  },
  {
    id: 'multi-more', topic: 'multi', items: 'any',
    make: (rng, L) => {
      const third = Math.max(4, Math.floor(L.max / 3));
      const a = randInt(2, third, rng);
      const b = randInt(2, third, rng);
      return { a, b, answer: a + (a + b), hint: [a, 'add', '(', a, 'add', b, ')'] };
    },
    el: '{A.nom} έχει {a} {item}. {B.nom} έχει {b} {item.more} από {A.acc}. {item.how} {item} έχουν μαζί;',
    en: '{A.nom} has {a} {item}. {B.nom} has {b} more than {A.nom}. How many {item} do they have together?',
  },
  {
    id: 'multi-baskets', topic: 'multi', items: 'collect',
    make: (rng) => {
      const c = randInt(2, 6, rng);
      const each = randInt(2, 10, rng);
      const total = c * each;
      const a = randInt(2, total - 2, rng);
      return { a, b: total - a, c, answer: each, hint: ['(', a, 'add', total - a, ')', 'div', c] };
    },
    el: '{A.nom} μάζεψε {a} {item} και {B.nom} μάζεψε {b}. {item.the} μοιράζουν εξίσου σε {c} καλάθια. {item.how} {item} μπαίνουν σε κάθε καλάθι;',
    en: '{A.nom} collected {a} {item} and {B.nom} collected {b}. They share them equally into {c} baskets. How many {item} go in each basket?',
  },
];

// ---------- choosing a problem ----------

// Which operations appear at each difficulty (1–6).
function topicsFor(ageBand, d) {
  if (ageBand === 'young') {
    if (d <= 2) return ['add', 'sub'];
    if (d <= 4) return ['add', 'sub', 'mul'];
    return ['add', 'sub', 'mul', 'div'];
  }
  if (d <= 1) return ['add', 'sub'];
  if (d <= 2) return ['add', 'sub', 'mul', 'div'];
  if (d <= 4) return ['mul', 'div', 'multi'];
  return ['add', 'sub', 'mul', 'div', 'multi', 'multi'];
}

function limitsFor(ageBand, d) {
  // Word problems are harder to read, so numbers stay one step smaller.
  const i = Math.max(0, d - 2);
  return { max: RANGES.add[ageBand][i], table: RANGES.mul[ageBand][Math.max(i, 1)] };
}

const pick = (list, rng) => list[Math.floor(rng() * list.length)];

function pickItem(tag, rng) {
  const ids = Object.keys(ITEMS).filter((id) => tag === 'any' || ITEMS[id].tags.includes(tag));
  return pick(ids, rng);
}

function pickTwoCharacters(rng) {
  const ids = Object.keys(CHARACTERS);
  const A = pick(ids, rng);
  const B = pick(ids.filter((id) => id !== A), rng);
  return { A, B };
}

// A plausible wrong answer: what you get with the wrong operation.
function wrongOperationAnswer(q) {
  const { a, b, answer } = q.vars;
  const candidates = { add: a - b, sub: a + b, mul: a + b, div: a - b, multi: a * b }[q.subtopic];
  return Number.isInteger(candidates) && candidates >= 0 && candidates !== answer ? candidates : null;
}

/**
 * Make a word problem.
 * @param subtopic  'add' | 'sub' | 'mul' | 'div' | 'multi', or null to choose by difficulty
 */
export function generateWordProblem(subtopic, ageBand = 'young', difficulty = 1, rng = Math.random, makeChoices) {
  const d = Math.max(1, Math.min(6, Math.round(difficulty)));
  const topic = subtopic ?? pick(topicsFor(ageBand, d), rng);
  const template = pick(TEMPLATES.filter((t) => t.topic === topic), rng);
  const numbers = template.make(rng, limitsFor(ageBand, d));
  const { A, B } = pickTwoCharacters(rng);
  const item = template.items ? pickItem(template.items, rng) : null;

  const q = {
    topic: 'word',
    subtopic: topic,
    templateId: template.id,
    vars: { ...numbers, A, B, item },
    answer: numbers.answer,
    hint: numbers.hint,
  };

  // Little pictures help 6–8 year olds who are still learning to read.
  if (ageBand === 'young' && item && (topic === 'add' || topic === 'sub') && numbers.a <= 10 && numbers.b <= 10) {
    q.picture = { emoji: ITEMS[item].emoji, a: numbers.a, b: numbers.b, op: topic };
  }

  const useChoices = ageBand === 'young' ? d <= 3 : d <= 1;
  if (useChoices && makeChoices) {
    q.format = 'choice';
    q.choices = makeChoices(q.answer, wrongOperationAnswer(q));
  } else {
    q.format = 'numpad';
  }
  return q;
}

// ---------- turning a problem into text ----------

const capitalise = (text) =>
  text.replace(/(^|[.!?;]\s+)(\p{L})/gu, (_, before, letter) => before + letter.toUpperCase());

export function renderWordProblem(q, lang, formatNumber = String) {
  const template = TEMPLATES.find((t) => t.id === q.templateId);
  const v = q.vars;
  const item = v.item ? ITEMS[v.item] : null;

  const text = template[lang].replace(/\{([\w.]+)\}/g, (match, key) => {
    if (key === 'a' || key === 'b' || key === 'c') return formatNumber(v[key]);
    const [who, form] = key.split('.');
    if (who === 'A' || who === 'B') return CHARACTERS[v[who]][lang][form] ?? match;
    if (who === 'item' && item) {
      if (!form) return item[lang];
      if (lang === 'el') return GREEK_GENDER_WORDS[item.gender][form] ?? match;
      return { how: 'how many', other: 'more', the: 'the', more: 'more' }[form] ?? match;
    }
    return match;
  });
  return capitalise(text);
}
