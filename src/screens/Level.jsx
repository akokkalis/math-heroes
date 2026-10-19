// One level: a series of questions, then the results screen.
//
// The screen moves through three phases:
//   'question' -> the child answers
//   'feedback' -> right/wrong message, then "Continue"
//   'results'  -> stars, coins, XP

import { useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useI18n } from '../i18n/I18nProvider.jsx';
import { usePlayer } from '../state/PlayerProvider.jsx';
import { findLevel } from '../game/worlds.js';
import { generateQuestion, checkAnswer } from '../game/generators.js';
import { adaptDifficulty, rewardsFor } from '../game/rewards.js';
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

  // The key resets all state when the child presses "Play again".
  return <LevelGame key={levelId} level={level} profile={profile} profileId={profileId} />;
}

function LevelGame({ level, profile, profileId }) {
  const { t, tList } = useI18n();
  const navigate = useNavigate();

  const [round, setRound] = useState(0); // bumps on "Play again"
  const [answers, setAnswers] = useState([]);
  const [streak, setStreak] = useState(0); // +n right in a row, -n wrong in a row
  const [question, setQuestion] = useState(() =>
    generateQuestion(level.topic, profile.ageBand, level.difficulty),
  );
  const [typed, setTyped] = useState('');
  const [phase, setPhase] = useState('question');
  const [lastCorrect, setLastCorrect] = useState(null);
  const [message, setMessage] = useState('');
  const [rewards, setRewards] = useState(null);

  const answer = (given) => {
    const correct = checkAnswer(question, given);
    if (correct) sounds.correct(); else sounds.wrong();
    setLastCorrect(correct);
    setMessage(pickOne(tList(correct ? 'feedback.correct' : 'feedback.wrong')));
    setAnswers((prev) => [...prev, { correct }]);
    setStreak((s) => (correct ? Math.max(1, s + 1) : Math.min(-1, s - 1)));
    setPhase('feedback');
  };

  const next = async () => {
    if (answers.length >= level.questionCount) {
      const correct = answers.filter((a) => a.correct).length;
      const previous = (await starsByLevel(profileId))[level.id] || 0;
      const result = rewardsFor({ correct, total: answers.length, previousStars: previous, isBoss: level.isBoss });
      await saveLevelResult({ profileId, level, answers, rewards: result });
      if (result.stars > 0) sounds.win();
      setRewards({ ...result, correct, total: answers.length });
      setPhase('results');
      return;
    }
    const difficulty = adaptDifficulty(level.difficulty, streak);
    setQuestion(generateQuestion(level.topic, profile.ageBand, difficulty));
    setTyped('');
    setPhase('question');
  };

  const replay = () => {
    setRound((r) => r + 1);
    setAnswers([]);
    setStreak(0);
    setQuestion(generateQuestion(level.topic, profile.ageBand, level.difficulty));
    setTyped('');
    setRewards(null);
    setPhase('question');
  };

  if (phase === 'results') {
    return <Results rewards={rewards} onReplay={replay} onMap={() => navigate('/map')} key={round} />;
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
        <AnswerInput question={question} typed={typed} setTyped={setTyped} onAnswer={answer} />
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
  const { t, formatNumber } = useI18n();
  const op = t(`ops.${question.topic}`);

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

function AnswerInput({ question, typed, setTyped, onAnswer }) {
  const { t, formatNumber } = useI18n();

  if (question.format === 'choice') {
    return (
      <div className="choices">
        {question.choices.map((c) => (
          <button key={c} className="choice" onClick={() => onAnswer(c)}>
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
  let shown;
  if (question.format === 'truefalse') {
    shown = t(question.answer ? 'common.true' : 'common.false');
  } else {
    shown = formatNumber(question.answer);
  }
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
      <p className="subtitle">{t('results.score', { correct: rewards.correct, total: rewards.total })}</p>
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
