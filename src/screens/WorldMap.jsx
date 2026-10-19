import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { currentStreak, db, starsByLevel, today } from '../db/db.js';
import { useI18n } from '../i18n/I18nProvider.jsx';
import { usePlayer } from '../state/PlayerProvider.jsx';
import { WORLDS, isLevelUnlocked, levelsOf } from '../game/worlds.js';
import { isWorldPlayable } from '../game/entitlement.js';
import { playerLevel } from '../game/rewards.js';
import { CoinBadge, LanguageToggle, Stars, avatarEmoji } from '../components/ui.jsx';

export default function WorldMap() {
  const { t } = useI18n();
  const { profile, profileId, isFullVersion } = usePlayer();
  const navigate = useNavigate();

  const stars = useLiveQuery(() => (profileId ? starsByLevel(profileId) : {}), [profileId]) ?? {};
  const streak = useLiveQuery(() => (profileId ? currentStreak(profileId) : 0), [profileId]) ?? 0;
  const doneToday =
    useLiveQuery(
      () => (profileId ? db.sessions.where({ profileId, day: today() }).count() : 0),
      [profileId],
    ) ?? 0;

  if (!profile) return null;
  const xpInfo = playerLevel(profile.xp);

  return (
    <main className="screen">
      <header className="topbar">
        <button className="link-button" onClick={() => navigate('/')}>⇄ {t('map.switch')}</button>
        <LanguageToggle />
      </header>

      <section className="hero-card card">
        <button className="hero-avatar" onClick={() => navigate('/shop')} aria-label={t('map.shop')}>
          {avatarEmoji(profile.avatar)}
        </button>
        <div className="hero-info">
          <h1>{t('map.hello', { name: profile.name })}</h1>
          <div className="xp-row">
            <span className="badge">{t('common.level')} {xpInfo.level}</span>
            <div className="xp-bar"><div style={{ width: `${(xpInfo.progress / xpInfo.needed) * 100}%` }} /></div>
          </div>
          <div className="badge-row">
            <CoinBadge coins={profile.coins} />
            {streak > 0 && <span className="badge">{t('map.streak', { n: streak })}</span>}
            <button className="badge shop-badge" onClick={() => navigate('/shop')}>🛍️ {t('map.shop')}</button>
          </div>
          <p className="goal">
            {doneToday >= profile.dailyGoal
              ? t('map.goalDone')
              : t('map.goal', { done: doneToday, goal: profile.dailyGoal })}
          </p>
        </div>
      </section>

      {WORLDS.map((world) => {
        const playable = isWorldPlayable(world.id, isFullVersion);
        return (
          <section key={world.id} className="world card" style={{ '--world-color': world.color }}>
            <div className="world-header">
              <span className="world-emoji">{world.emoji}</span>
              <div>
                <h2>{t(`world.${world.id}.name`)}</h2>
                <p>{t(`world.${world.id}.story`)}</p>
                {!playable && <span className="badge premium">🔒 {t('map.premium')}</span>}
              </div>
            </div>

            <div className="level-path">
              {levelsOf(world).map((level) => {
                const open = playable && isLevelUnlocked(level.id, stars);
                return (
                  <button
                    key={level.id}
                    className={`level-node ${level.isBoss ? 'boss' : ''} ${open ? '' : 'locked'}`}
                    disabled={!open}
                    onClick={() => navigate(`/play/${level.id}`)}
                  >
                    <span className="level-number">{level.isBoss ? world.emoji : level.number}</span>
                    {open ? <Stars count={stars[level.id] || 0} size="sm" /> : <span>🔒</span>}
                    {level.isBoss && <span className="boss-label">{t('map.boss')}</span>}
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </main>
  );
}
