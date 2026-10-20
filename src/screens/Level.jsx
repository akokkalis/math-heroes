// One level: a series of questions, then the results screen.
//
// For each question:
//   1st wrong try  -> "Try again!" (the wrong choice is greyed out)
//   2nd wrong try  -> a hint appears
//   3rd wrong try  -> the right answer is shown
// (True/false questions show the answer straight away, since there are only two options.)
//
// The screen moves through three phases:
//   'question' -> the child answers (possibly several tries)
//   'feedback' -> right/wrong message, then "Continue"
//   'results'  -> stars, coins, XP

import { useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useI18n } from '../i18n/I18nProvider.jsx';
import { usePlayer } from '../state/PlayerProvider.jsx';
import { findLevel, WORD_PROBLEMS_IN_BOSS } from '../game/worlds.js';
import { generateQuestion, generateWordQuestion, checkAnswer } from '../game/generators.js';
import { renderWordProblem } from '../game/wordProblems.js';
import { adaptDifficulty, maxAttemptsFor, pointsFor, rewardsFor } from '../game/rewards.js';
import { saveLevelResult, starsByLevel } from '../db/db.js';
import { isWorldPlayable } from '../game/entitlement.js';
import { sounds } from '../game/sound.js';
import { Numpad } from '../components/Numpad.jsx';
import { Fraction, Stars } from '../components/ui.jsx';

const pickOne = (list) => list[Math.floor(Math.random() * list.length)];

export default function Level() {
  const { levelId } = useParams();
  const level = findLevel(levelId);
  const { profile, profileId, isFullVersion } = usePlayer();

  if (!level || !profile) return <Navigate to="/map" replace />;
  if (!isWorldPlayable(level.worldId, isFullVersion)) return <Navigate to="/map" replace />;

  // The key resets all state when you open a different level.
  return <LevelGame key={levelId} level={level} profile={profile} profileId={profileId} />;
}

// Boss levels mix in a word problem every 3rd question.
function makeQuestion(level, ageBand, difficulty, index) {
  if (level.isBoss && WORD_PROBLEMS_IN_BOSS.includes(level.topic) && index % 3 === 2) {
    return generateWordQuestion(level.topic, ageBand, difficulty);
  }
  return generateQuestion(level.topic, ageBand, difficulty);
}

function LevelGame({ level, profile, profileId }) {
  const { t, tList } = useI18n();
  const navigate = useNavigate();

  const [answers, setAnswers] = useState([]); // { correct, points, topic }
  const [streak, setStreak] = useState(0); // +n right first time in a row, -n wrong in a row
  const [question, setQuestion] = useState(() => makeQuestion(level, profile.ageBand, level.difficulty, 0));
  const [typed, setTyped] = useState('');
  const [wrongTries, setWrongTries] = useState(0);
  const [ruledOut, setRuledOut] = useState([]); // wrong choices already tried
  const [phase, setPhase] = useState('question');
  const [lastCorrect, setLastCorrect] = useState(null);
  const [message, setMessage] = useState('');
  const [rewards, setRewards] = useState(null);

  const maxAttempts = maxAttemptsFor(question);
  const showHint = wrongTries > 0 && (wrongTries >= 2 || wrongTries === maxAttempts - 1);

  const finishQuestion = (solved, attempts) => {
    const firstTry = solved && attempts === 1;
    setAnswers((prev) => [
      ...prev,
      { correct: firstTry, points: pointsFor({ solved, attempts }), topic: question.topic },
    ]);
    setStreak((s) => (firstTry ? Math.max(1, s + 1) : Math.min(-1, s - 1)));
    setLastCorrect(solved);
    setMessage(pickOne(tList(solved ? 'feedback.correct' : 'feedback.wrong')));
    setPhase('feedback');
  };

  const answer = (given) => {
    const attempts = wrongTries + 1;
    if (checkAnswer(question, given)) {
      sounds.correct();
      finishQuestion(true, attempts);
      return;
    }
    sounds.wrong();
    if (attempts >= maxAttempts) {
      finishQuestion(false, attempts);
      return;
    }
    // Let the child try again.
    setWrongTries(attempts);
    setRuledOut((prev) => [...prev, given]);
    setTyped('');
  };

  const next = async () => {
    if (answers.length >= level.questionCount) {
      const points = answers.reduce((sum, a) => sum + a.points, 0);
      const firstTry = answers.filter((a) => a.correct).length;
      const retried = answers.filter((a) => !a.correct && a.points > 0).length;
      const previous = (await starsByLevel(profileId))[level.id] || 0;
      const result = rewardsFor({ correct: points, total: answers.length, previousStars: previous, isBoss: level.isBoss });
      await saveLevelResult({ profileId, level, answers, rewards: result });
      if (result.stars > 0) sounds.win();
      setRewards({ ...result, firstTry, retried, total: answers.length });
      setPhase('results');
      return;
    }
    const difficulty = adaptDifficulty(level.difficulty, streak);
    setQuestion(makeQuestion(level, profile.ageBand, difficulty, answers.length));
    setTyped('');
    setWrongTries(0);
    setRuledOut([]);
    setPhase('question');
  };

  const replay = () => {
    setAnswers([]);
    setStreak(0);
    setQuestion(makeQuestion(level, profile.ageBand, level.difficulty, 0));
    setTyped('');
    setWrongTries(0);
    setRuledOut([]);
    setRewards(null);
    setPhase('question');
  };

  if (phase === 'results') {
    return <Results rewards={rewards} onReplay={replay} onMap={() => navigate('/map')} />;
  }

  const progress = (answers.length / level.questionCount) * 100;
  const shownNumber = Math.min(answers.length + (phase === 'question' ? 1 : 0), level.questionCount);

  return (
    <main className={`screen level-screen ${level.isBoss ? 'boss-level' : ''}`}>
      <header className="topbar">
        <button className="link-button" onClick={() => navigate('/map')}>✕ {t('level.quit')}</button>
        <span className="muted">{t('level.progress', { n: shownNumber, total: level.questionCount })}</span>
      </header>
      <div className="progress-bar"><div style={{ width: `${progress}%` }} /></div>

      <QuestionView question={question} />

      {phase === 'question' && (
        <>
          {wrongTries > 0 && (
            <div className="try-again" role="status" key={wrongTries}>
              <p>{t('level.tryAgain')}</p>
              {showHint && <Hint question={question} />}
            </div>
          )}
          <AnswerInput
            question={question}
            typed={typed}
            setTyped={setTyped}
            onAnswer={answer}
            ruledOut={ruledOut}
          />
        </>
      )}

      {phase === 'feedback' && (
        <div className={`feedback ${lastCorrect ? 'good' : 'bad'}`} role="status">
          <div className="feedback-icon">{lastCorrect ? '🦉✨' : '🦉'}</div>
          <p className="feedback-text">{message}</p>
          {!lastCorrect && <CorrectAnswer question={question} />}
          <button className="big-button" onClick={next} autoFocus>{t('common.continue')} →</button>
        </div>
      )}
    </main>
  );
}

function QuestionView({ question }) {
  const { t, lang, formatNumber } = useI18n();

  if (question.topic === 'word') {
    return (
      <section className="question word">
        <p className="word-text">{renderWordProblem(question, lang, formatNumber)}</p>
        {question.picture && <Picture {...question.picture} />}
      </section>
    );
  }

  if (question.topic === 'frac') {
    return (
      <section className="question">
        <p className="question-hint">{t('level.fracQuestion')}</p>
        <div className="expression">
          <Fraction value={question.a} /> <span className="blank">?</span> <Fraction value={question.b} />
        </div>
      </section>
    );
  }

  const op = t(`ops.${question.topic}`);
  const result = question.format === 'truefalse' ? formatNumber(question.shown) : '?';
  return (
    <section className="question">
      {question.format === 'truefalse' && <p className="question-hint">{t('level.isItTrue')}</p>}
      <div className="expression">
        {formatNumber(question.a)} {op} {formatNumber(question.b)} = <span className="blank">{result}</span>
      </div>
    </section>
  );
}

// Emoji counters for young children: 🍎🍎🍎 + 🍎🍎, or 🍎🍎🍎🍎🍎 with 2 crossed out.
function Picture({ emoji, a, b, op }) {
  const row = (count, className = '') =>
    Array.from({ length: count }, (_, i) => <span key={i} className={className}>{emoji}</span>);
  if (op === 'add') {
    return (
      <div className="picture" aria-hidden="true">
        <span className="picture-group">{row(a)}</span>
        <span className="picture-op">+</span>
        <span className="picture-group">{row(b)}</span>
      </div>
    );
  }
  return (
    <div className="picture" aria-hidden="true">
      <span className="picture-group">
        {row(a - b)}
        {row(b, 'crossed')}
      </span>
    </div>
  );
}

function Hint({ question }) {
  const { t, formatNumber } = useI18n();
  const n = formatNumber;
  const op = (name) => t(`ops.${name}`);

  let text;
  switch (question.topic) {
    case 'word': {
      const expr = question.hint
        .map((tok) => (typeof tok === 'number' ? n(tok) : ['add', 'sub', 'mul', 'div'].includes(tok) ? op(tok) : tok))
        .join(' ')
        .replace(/\( /g, '(')
        .replace(/ \)/g, ')');
      return (
        <div className="hint">
          <span>💡 {t('hint.word')}</span>
          <strong className="hint-expr">{expr} = ?</strong>
        </div>
      );
    }
    case 'add': {
      const big = Math.max(question.a, question.b);
      const small = Math.min(question.a, question.b);
      text = big + small <= 20 ? t('hint.add', { big, small }) : t('hint.addBig');
      break;
    }
    case 'sub':
      text = question.a <= 20 ? t('hint.sub', { a: question.a, b: question.b }) : t('hint.subBig');
      break;
    case 'mul': {
      const { a, b } = question;
      const repeat = (value, times) => Array.from({ length: times }, () => n(value)).join(` ${op('add')} `);
      const expr = `${n(a)} ${op('mul')} ${n(b)}`;
      if (b <= 5) text = t('hint.mul', { expr, expansion: repeat(a, b) });
      else if (a <= 5) text = t('hint.mul', { expr, expansion: repeat(b, a) });
      else text = t('hint.mulTable', { a });
      break;
    }
    case 'div':
      text = t('hint.div', { a: question.a, b: question.b });
      break;
    case 'frac':
      text = question.a[1] === question.b[1] ? t('hint.fracSame') : t('hint.fracDiff');
      break;
    default:
      return null;
  }
  return <div className="hint">💡 {text}</div>;
}

function AnswerInput({ question, typed, setTyped, onAnswer, ruledOut }) {
  const { t, formatNumber } = useI18n();

  if (question.format === 'choice') {
    return (
      <div className="choices">
        {question.choices.map((c) => (
          <button
            key={c}
            className={`choice ${ruledOut.includes(c) ? 'ruled-out' : ''}`}
            onClick={() => onAnswer(c)}
            disabled={ruledOut.includes(c)}
          >
            {formatNumber(c)}
          </button>
        ))}
      </div>
    );
  }

  if (question.format === 'truefalse') {
    return (
      <div className="choices two">
        <button className="choice yes" onClick={() => onAnswer(true)}>✓ {t('common.true')}</button>
        <button className="choice no" onClick={() => onAnswer(false)}>✗ {t('common.false')}</button>
      </div>
    );
  }

  return (
    <Numpad
      value={typed}
      onChange={setTyped}
      onSubmit={() => onAnswer(Number(typed))}
      okLabel={t('level.check')}
    />
  );
}

function CorrectAnswer({ question }) {
  const { t, formatNumber } = useI18n();
  const shown =
    question.format === 'truefalse'
      ? t(question.answer ? 'common.true' : 'common.false')
      : formatNumber(question.answer);
  return <p className="correct-answer">{t('level.correctAnswer', { answer: shown })}</p>;
}

function Results({ rewards, onReplay, onMap }) {
  const { t } = useI18n();
  const headline = useMemo(() => {
    if (rewards.stars === 3) return t('results.great');
    if (rewards.stars >= 1) return t('results.good');
    return t('results.tryAgain');
  }, [rewards.stars, t]);

  return (
    <main className="screen screen-center results">
      <div className="results-mascot">{rewards.stars > 0 ? '🏆' : '🦉'}</div>
      <h1 className="title">{headline}</h1>
      <Stars count={rewards.stars} size="lg" />
      <p className="subtitle">{t('results.score', { correct: rewards.firstTry, total: rewards.total })}</p>
      {rewards.retried > 0 && <p className="muted">{t('results.retries', { n: rewards.retried })}</p>}
      <div className="badge-row center">
        <span className="badge coin">🪙 {t('results.coins', { n: rewards.coins })}</span>
        <span className="badge">⭐ {t('results.xp', { n: rewards.xp })}</span>
      </div>
      <div className="button-row">
        <button className="big-button secondary" onClick={onReplay}>↻ {t('results.replay')}</button>
        <button className="big-button" onClick={onMap}>🗺️ {t('results.map')}</button>
      </div>
    </main>
  );
}
