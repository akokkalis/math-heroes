// App-wide settings in one place.

export const MONETIZATION = {
  // Number of worlds that are free. Worlds after these need the one-time unlock.
  freeWorlds: 2,
  // Turn the paywall off entirely (everything free) during testing or a promo.
  paywallEnabled: true,
  // Shown on the unlock screen. Real prices come from the store later (RevenueCat).
  displayPrice: '€6.99',
};

export const AVATARS = [
  { id: 'owl', emoji: '🦉', price: 0 },
  { id: 'dolphin', emoji: '🐬', price: 0 },
  { id: 'horse', emoji: '🐴', price: 0 },
  { id: 'cat', emoji: '🐱', price: 0 },
  { id: 'pegasus', emoji: '🦄', price: 40 },
  { id: 'eagle', emoji: '🦅', price: 60 },
  { id: 'octopus', emoji: '🐙', price: 80 },
  { id: 'dragon', emoji: '🐉', price: 120 },
  { id: 'crown', emoji: '👑', price: 200 },
];

export const DEFAULT_DAILY_GOAL = 3; // levels per day
