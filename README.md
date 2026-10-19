# Μαθη-Ήρωες · Math Heroes

Gamified math practice for primary-school children (6–12), in Greek and English.
Works fully offline, keeps all data on the device, no ads, no accounts.

## Run it

```bash
npm install
npm run dev        # development server at http://localhost:5173
npm test           # unit tests (question generators, rewards, translations)
npm run build      # production build in dist/, with offline service worker
npm run preview    # serve the production build (test offline here)
```

To test offline: `npm run build && npm run preview`, open the app once, then turn
off the network in the browser dev tools and reload.

## How it is organised

```
src/
  config.js              Free worlds, paywall switch, price label, shop avatars
  App.jsx                Routes (HashRouter so it also works inside Capacitor)
  game/
    generators.js        Procedural questions per topic, age band and difficulty
    worlds.js            The world map: Hercules' labours, 5 levels each, last = boss
    rewards.js           Stars, coins, XP, player level, adaptive difficulty
    entitlement.js       Full-version check; placeholders for store purchase/restore
    sound.js             Sound effects generated in code (no audio files)
    game.test.js         Unit tests
  db/db.js               Local database (IndexedDB via Dexie): profiles, progress, reports
  i18n/
    el.json, en.json     All texts. Add a key to BOTH files (a test checks this)
    I18nProvider.jsx     t(), tList(), formatNumber() — Greek uses 3,5 and 1.000
  state/PlayerProvider.jsx   Current child + full-version flag, shared by all screens
  screens/               ProfilePicker, CreateProfile, WorldMap, Level, Shop, Parent
  components/            Numpad, small UI pieces
```

### React pointers for this codebase

- **State that changes on screen** uses `useState`. Example: `Level.jsx` keeps the
  current question, the typed answer and the phase (`question` → `feedback` → `results`).
- **Data from the database** uses `useLiveQuery(...)` from `dexie-react-hooks`.
  It re-renders automatically when the data changes, so coins update everywhere.
- **Shared values** (language, current child) come from React context:
  `useI18n()` and `usePlayer()`. Think of them as app-wide globals with change tracking.
- Game rules (`src/game/`) are plain JavaScript with no React, so they are easy
  to test and change.

## Common changes

| Change | Where |
|---|---|
| Add or reword a text | `src/i18n/el.json` and `en.json` |
| Number ranges / difficulty | `RANGES` in `src/game/generators.js` |
| How many worlds are free | `MONETIZATION.freeWorlds` in `src/config.js` |
| Everything free (testing/promo) | `MONETIZATION.paywallEnabled = false` |
| Questions per level | `src/game/worlds.js` |
| Add a world | `WORLDS` in `worlds.js` + texts in both JSON files |
| Avatars and prices | `AVATARS` in `src/config.js` |

In development (`npm run dev`) the parent area has a "Testing: unlock / lock"
button to try the premium worlds.

## Native apps (Capacitor)

The Capacitor config is in place. To create the native projects (needs Android
Studio and/or Xcode on your machine):

```bash
npm install @capacitor/android @capacitor/ios
npm run build
npx cap add android
npx cap add ios
npx cap sync
npx cap open android   # or: npx cap open ios
```

Change `appId` in `capacitor.config.json` to your own reverse domain before the
first store upload; it cannot be changed after publishing.

## Monetization plan

Free download with a one-time in-app unlock ("Full version"). Google Play does not
allow a free app to become paid later, so the price lives in the unlock, not the
listing. The purchase flow is a placeholder in `src/game/entitlement.js`; the plan
is RevenueCat (`@revenuecat/purchases-capacitor`), caching the result locally so it
works offline. Purchases and the "Restore purchase" button sit behind the parent gate.

## Roadmap ideas

- Badges and daily challenge
- Word problems (templates with variables, translated per language)
- Recorded read-aloud audio for young children
- More topics: time, money (euro), shapes, place value
- Screen-time limit in the parent area
- Optional backup/sync (FastAPI)
