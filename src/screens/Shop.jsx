import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { buyAvatar } from '../db/db.js';
import { useI18n } from '../i18n/I18nProvider.jsx';
import { usePlayer } from '../state/PlayerProvider.jsx';
import { AVATARS } from '../config.js';
import { sounds } from '../game/sound.js';
import { CoinBadge } from '../components/ui.jsx';

export default function Shop() {
  const { t, formatNumber } = useI18n();
  const { profile, profileId } = usePlayer();
  const navigate = useNavigate();
  const [notice, setNotice] = useState('');

  if (!profile) return null;

  const choose = async (avatar) => {
    const ok = await buyAvatar(profileId, avatar);
    if (ok) {
      sounds.correct();
      setNotice('');
    } else {
      sounds.wrong();
      setNotice(t('shop.notEnough'));
    }
  };

  return (
    <main className="screen">
      <header className="topbar">
        <button className="link-button" onClick={() => navigate('/map')}>← {t('common.back')}</button>
        <CoinBadge coins={profile.coins} />
      </header>
      <h1 className="title">🛍️ {t('shop.title')}</h1>
      {notice && <p className="notice">{notice}</p>}

      <div className="shop-grid">
        {AVATARS.map((a) => {
          const owned = profile.ownedAvatars.includes(a.id);
          const inUse = profile.avatar === a.id;
          return (
            <button
              key={a.id}
              className={`shop-item card ${inUse ? 'selected' : ''}`}
              onClick={() => choose(a)}
              disabled={inUse}
            >
              <span className="shop-emoji">{a.emoji}</span>
              <span className="shop-price">
                {inUse ? t('shop.inUse') : owned ? t('shop.use') : `🪙 ${formatNumber(a.price)}`}
              </span>
            </button>
          );
        })}
      </div>
    </main>
  );
}
