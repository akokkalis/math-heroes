// Parent area: protected by a math gate (a requirement for kids' apps in
// both stores), then shows weekly reports, settings and the full-version unlock.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, deleteProfile, weeklyReport } from '../db/db.js';
import { useI18n } from '../i18n/I18nProvider.jsx';
import { usePlayer } from '../state/PlayerProvider.jsx';
import { randInt } from '../game/generators.js';
import {
  devSetFullVersion,
  purchaseFullVersion,
  restorePurchase,
} from '../game/entitlement.js';
import { MONETIZATION } from '../config.js';
import { LanguageToggle, avatarEmoji } from '../components/ui.jsx';

export default function Parent() {
  const [passed, setPassed] = useState(false);
  return passed ? <ParentArea /> : <ParentGate onPass={() => setPassed(true)} />;
}

function ParentGate({ onPass }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [puzzle] = useState(() => ({ a: randInt(11, 19), b: randInt(3, 9) }));
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);

  const submit = (event) => {
    event.preventDefault();
    if (Number(value) === puzzle.a * puzzle.b) onPass();
    else {
      setError(true);
      setValue('');
    }
  };

  return (
    <main className="screen screen-center">
      <header className="topbar">
        <button className="link-button" onClick={() => navigate(-1)}>← {t('common.back')}</button>
      </header>
      <h1 className="title">🔒 {t('parent.gateTitle')}</h1>
      <form className="card form" onSubmit={submit}>
        <label className="field">
          <span>{t('parent.gateQuestion', puzzle)}</span>
          <input inputMode="numeric" value={value} onChange={(e) => setValue(e.target.value)} autoFocus />
        </label>
        {error && <p className="notice">{t('parent.gateWrong')}</p>}
        <button className="big-button" type="submit">{t('common.continue')}</button>
      </form>
    </main>
  );
}

function ParentArea() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { isFullVersion, refreshFullVersion, profileId, selectProfile } = usePlayer();
  const profiles = useLiveQuery(() => db.profiles.toArray(), []) ?? [];
  const [notice, setNotice] = useState('');

  const buy = async () => {
    try {
      await purchaseFullVersion();
      await refreshFullVersion();
    } catch {
      setNotice(t('parent.purchaseUnavailable'));
    }
  };

  const restore = async () => {
    await restorePurchase();
    await refreshFullVersion();
  };

  const toggleDev = async () => {
    await devSetFullVersion(!isFullVersion);
    await refreshFullVersion();
  };

  const remove = async (p) => {
    if (!window.confirm(t('parent.confirmDelete', { name: p.name }))) return;
    await deleteProfile(p.id);
    if (p.id === profileId) selectProfile(null);
  };

  return (
    <main className="screen">
      <header className="topbar">
        <button className="link-button" onClick={() => navigate('/')}>← {t('common.back')}</button>
        <LanguageToggle />
      </header>
      <h1 className="title">{t('parent.title')}</h1>
      <p className="muted center">{t('parent.privacy')}</p>

      {profiles.map((p) => (
        <ChildReport key={p.id} profile={p} onDelete={() => remove(p)} />
      ))}

      <section className="card unlock">
        <h2>⭐ {t('parent.unlockTitle')}</h2>
        {isFullVersion ? (
          <p>{t('parent.owned')}</p>
        ) : (
          <>
            <p>{t('parent.unlockText')}</p>
            <button className="big-button" onClick={buy}>
              {t('parent.buy', { price: MONETIZATION.displayPrice })}
            </button>
          </>
        )}
        <button className="link-button" onClick={restore}>{t('parent.restore')}</button>
        {notice && <p className="notice">{notice}</p>}
        {(import.meta.env.DEV || MONETIZATION.testUnlock) && (
          <>
            <p className="muted">{t('parent.testNote')}</p>
            <button className="link-button" onClick={toggleDev}>🛠 {t('parent.devUnlock')}</button>
          </>
        )}
      </section>
    </main>
  );
}

function ChildReport({ profile, onDelete }) {
  const { t, formatNumber } = useI18n();
  const report = useLiveQuery(() => weeklyReport(profile.id), [profile.id]);

  const setGoal = (dailyGoal) => db.profiles.update(profile.id, { dailyGoal });
  const pct = (c, n) => `${formatNumber(Math.round((c / n) * 100))}%`;

  return (
    <section className="card child-report">
      <div className="child-header">
        <span className="profile-avatar small">{avatarEmoji(profile.avatar)}</span>
        <h2>{profile.name}</h2>
      </div>

      <h3>{t('parent.week')}</h3>
      {!report || report.questions === 0 ? (
        <p className="muted">{t('parent.noData')}</p>
      ) : (
        <>
          <div className="stat-row">
            <Stat label={t('parent.daysActive')} value={`${report.daysActive}/7`} />
            <Stat label={t('parent.levels')} value={formatNumber(report.levelsPlayed)} />
            <Stat label={t('parent.questions')} value={formatNumber(report.questions)} />
            <Stat label={t('parent.accuracy')} value={pct(report.correct, report.questions)} />
          </div>
          <ul className="topic-list">
            {Object.entries(report.byTopic).map(([topic, s]) => (
              <li key={topic}>
                <span>{t(`topic.${topic}`)}</span>
                <div className="meter"><div style={{ width: `${(s.correct / s.total) * 100}%` }} /></div>
                <span>{pct(s.correct, s.total)}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      <label className="field inline">
        <span>{t('parent.dailyGoal')}</span>
        <select value={profile.dailyGoal} onChange={(e) => setGoal(Number(e.target.value))}>
          {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </label>
      <button className="link-button danger" onClick={onDelete}>{t('parent.deleteProfile')}</button>
    </section>
  );
}

function Stat({ label, value }) {
  return (
    <div className="stat">
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}
