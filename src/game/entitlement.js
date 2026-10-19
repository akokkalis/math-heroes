// Who has the full version, and which worlds need it.
// The purchase itself is not wired up yet: later this calls RevenueCat
// (@revenuecat/purchases-capacitor) and caches the result locally so it
// keeps working offline. Everything else in the app only uses these functions.

import { MONETIZATION } from '../config.js';
import { worldIndex } from './worlds.js';
import { getSetting, setSetting } from '../db/db.js';

export function isWorldPremium(worldId) {
  if (!MONETIZATION.paywallEnabled) return false;
  return worldIndex(worldId) >= MONETIZATION.freeWorlds;
}

export function isWorldPlayable(worldId, isFullVersion) {
  return isFullVersion || !isWorldPremium(worldId);
}

export async function loadFullVersion() {
  return Boolean(await getSetting('fullVersion', false));
}

// Placeholder for the real store purchase.
export async function purchaseFullVersion() {
  // TODO: replace with RevenueCat purchase flow.
  throw new Error('purchase-not-available');
}

// Placeholder for "Restore purchase" (required by both stores).
export async function restorePurchase() {
  // TODO: replace with RevenueCat restore.
  return loadFullVersion();
}

// Development helper so you can test premium worlds before the store is set up.
export async function devSetFullVersion(value) {
  await setSetting('fullVersion', value);
}
