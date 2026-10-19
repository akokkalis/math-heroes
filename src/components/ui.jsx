// Small shared building blocks used by several screens.

import { useI18n } from '../i18n/I18nProvider.jsx';
import { AVATARS } from '../config.js';

export function avatarEmoji(id) {
  return AVATARS.find((a) => a.id === id)?.emoji ?? '🦉';
}

export function LanguageToggle() {
  const { lang, setLang } = useI18n();
  return (
    <div className="lang-toggle" role="group" aria-label="Language">
      <button className={lang === 'el' ? 'active' : ''} onClick={() => setLang('el')}>ΕΛ</button>
      <button className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')}>EN</button>
    </div>
  );
}

export function Stars({ count, max = 3, size = 'md' }) {
  return (
    <span className={`stars stars-${size}`} aria-label={`${count}/${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={i < count ? 'star on' : 'star'}>★</span>
      ))}
    </span>
  );
}

export function CoinBadge({ coins }) {
  const { formatNumber } = useI18n();
  return <span className="badge coin">🪙 {formatNumber(coins)}</span>;
}

// Renders an expression like "12 + 7" or a fraction "3/4".
export function Fraction({ value }) {
  const { formatNumber } = useI18n();
  return (
    <span className="fraction">
      <span>{formatNumber(value[0])}</span>
      <span className="fraction-bar" />
      <span>{formatNumber(value[1])}</span>
    </span>
  );
}
