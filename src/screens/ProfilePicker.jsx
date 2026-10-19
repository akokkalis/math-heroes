import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db.js';
import { useI18n } from '../i18n/I18nProvider.jsx';
import { usePlayer } from '../state/PlayerProvider.jsx';
import { LanguageToggle, avatarEmoji } from '../components/ui.jsx';

export default function ProfilePicker() {
  const { t } = useI18n();
  const { selectProfile } = usePlayer();
  const navigate = useNavigate();
  const profiles = useLiveQuery(() => db.profiles.toArray(), []);

  const choose = (id) => {
    selectProfile(id);
    navigate('/map');
  };

  return (
    <main className="screen screen-center">
      <header className="topbar">
        <LanguageToggle />
        <button className="link-button" onClick={() => navigate('/parent')}>🔒 {t('profiles.parents')}</button>
      </header>

      <div className="logo">🏛️</div>
      <h1 className="title">{t('app.title')}</h1>
      <p className="subtitle">{t('app.tagline')}</p>

      <h2>{t('profiles.title')}</h2>
      <div className="profile-grid">
        {profiles?.map((p) => (
          <button key={p.id} className="profile-card" onClick={() => choose(p.id)}>
            <span className="profile-avatar">{avatarEmoji(p.avatar)}</span>
            <span className="profile-name">{p.name}</span>
          </button>
        ))}
        <button className="profile-card add" onClick={() => navigate('/new')}>
          <span className="profile-avatar">＋</span>
          <span className="profile-name">{t('profiles.add')}</span>
        </button>
      </div>
    </main>
  );
}
