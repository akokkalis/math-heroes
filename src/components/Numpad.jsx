// Big on-screen number pad. Easier for small fingers than the phone keyboard,
// and it never pops up the system keyboard over the question.

import { sounds } from '../game/sound.js';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'ok'];

export function Numpad({ value, onChange, onSubmit, disabled, okLabel }) {
  const press = (key) => {
    if (disabled) return;
    sounds.tap();
    if (key === 'del') onChange(value.slice(0, -1));
    else if (key === 'ok') {
      if (value) onSubmit();
    }
    else if (value.length < 6) onChange(value + key);
  };

  return (
    <div className="numpad">
      <div className="numpad-display" aria-live="polite">{value || '?'}</div>
      <div className="numpad-keys">
        {KEYS.map((key) => (
          <button
            key={key}
            className={`numpad-key ${key === 'ok' ? 'ok' : ''} ${key === 'del' ? 'del' : ''}`}
            onClick={() => press(key)}
            disabled={disabled || (key === 'ok' && !value)}
            aria-label={key === 'del' ? 'delete' : key === 'ok' ? okLabel : key}
          >
            {key === 'del' ? '⌫' : key === 'ok' ? '✓' : key}
          </button>
        ))}
      </div>
    </div>
  );
}
