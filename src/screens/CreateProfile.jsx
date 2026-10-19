import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProfile } from '../db/db.js';
import { useI18n } from '../i18n/I18nProvider.jsx';
import { usePlayer } from '../state/PlayerProvider.jsx';
import { AVATARS, DEFAULT_DAILY_GOAL } from '../config.js';

const FREE_AVATARS = AVATARS.filter((a) => a.price === 0);

export default function CreateProfile() {
  const { t } = useI18n();
  const { selectProfile } = usePlayer();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(FREE_AVATARS[0].id);
  const [ageBand, setAgeBand] = useState('young');

  const submit = async (event) => {
    event.preventDefault();
    const id = await createProfile({ name: name.trim(), avatar, ageBand, dailyGoal: DEFAULT_DAILY_GOAL });
    selectProfile(id);
    navigate('/map');
  };

  return (
    <main className="screen">
      <header className="topbar">
        <button className="link-button" onClick={() => navigate('/')}>← {t('common.back')}</button>
      </header>
      <h1 className="title">{t('create.title')}</h1>

      <form className="card form" onSubmit={submit}>
        <label className="field">
          <span>{t('create.name')}</span>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={20} autoFocus required />
        </label>

        <fieldset className="field">
          <legend>{t('create.avatar')}</legend>
          <div className="choice-row">
            {FREE_AVATARS.map((a) => (
              <button
                type="button"
                key={a.id}
                className={`avatar-choice ${avatar === a.id ? 'selected' : ''}`}
                onClick={() => setAvatar(a.id)}
              >
                {a.emoji}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="field">
          <legend>{t('create.age')}</legend>
          <div className="choice-row">
            {['young', 'older'].map((band) => (
              <button
                type="button"
                key={band}
                className={`pill ${ageBand === band ? 'selected' : ''}`}
                onClick={() => setAgeBand(band)}
              >
                {t(`create.${band}`)}
              </button>
            ))}
          </div>
        </fieldset>

        <button className="big-button" type="submit" disabled={!name.trim()}>
          {t('create.submit')}
        </button>
      </form>
    </main>
  );
}
