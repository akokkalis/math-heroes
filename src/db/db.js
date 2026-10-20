// Local database (IndexedDB via Dexie). Everything stays on the device.
//
// Tables:
//   profiles   - one row per child
//   progress   - best stars per child per level
//   answers    - one row per answered question (used for parent reports)
//   sessions   - one row per finished level (used for daily goals / streaks)
//   settings   - simple key/value store (language, current profile, purchase...)

import Dexie from 'dexie';

export const db = new Dexie('math-heroes');

db.version(1).stores({
  profiles: '++id, name',
  progress: '[profileId+levelId], profileId',
  answers: '++id, profileId, [profileId+day], topic',
  sessions: '++id, profileId, [profileId+day]',
  settings: 'key',
});

export const today = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// ---- settings ----
export async function getSetting(key, fallback = null) {
  const row = await db.settings.get(key);
  return row ? row.value : fallback;
}

export async function setSetting(key, value) {
  await db.settings.put({ key, value });
}

// ---- profiles ----
export async function createProfile({ name, avatar, ageBand, dailyGoal }) {
  return db.profiles.add({
    name,
    avatar,
    ageBand,
    dailyGoal,
    coins: 0,
    xp: 0,
    ownedAvatars: [avatar],
    createdAt: Date.now(),
  });
}

export async function deleteProfile(profileId) {
  await db.transaction('rw', db.profiles, db.progress, db.answers, db.sessions, async () => {
    await db.profiles.delete(profileId);
    await db.progress.where({ profileId }).delete();
    await db.answers.where({ profileId }).delete();
    await db.sessions.where({ profileId }).delete();
  });
}

// ---- progress ----
export async function starsByLevel(profileId) {
  const rows = await db.progress.where({ profileId }).toArray();
  return Object.fromEntries(rows.map((r) => [r.levelId, r.stars]));
}

// Saves a finished level in one transaction: answers, best stars, coins, XP.
export async function saveLevelResult({ profileId, level, answers, rewards }) {
  const day = today();
  await db.transaction('rw', db.profiles, db.progress, db.answers, db.sessions, async () => {
    await db.answers.bulkAdd(
      // `correct` = right on the first try (used for the parent report).
      answers.map((a) => ({ profileId, day, topic: a.topic ?? level.topic, correct: a.correct, ts: Date.now() })),
    );
    const existing = await db.progress.get([profileId, level.id]);
    if (!existing || rewards.stars > existing.stars) {
      await db.progress.put({ profileId, levelId: level.id, stars: rewards.stars });
    }
    await db.sessions.add({ profileId, day, levelId: level.id, stars: rewards.stars, ts: Date.now() });
    const profile = await db.profiles.get(profileId);
    await db.profiles.update(profileId, {
      coins: profile.coins + rewards.coins,
      xp: profile.xp + rewards.xp,
    });
  });
}

// ---- shop ----
export async function buyAvatar(profileId, avatar) {
  return db.transaction('rw', db.profiles, async () => {
    const p = await db.profiles.get(profileId);
    if (p.ownedAvatars.includes(avatar.id)) {
      await db.profiles.update(profileId, { avatar: avatar.id });
      return true;
    }
    if (p.coins < avatar.price) return false;
    await db.profiles.update(profileId, {
      coins: p.coins - avatar.price,
      ownedAvatars: [...p.ownedAvatars, avatar.id],
      avatar: avatar.id,
    });
    return true;
  });
}

// ---- reports ----
// Days in a row (ending today or yesterday) with at least one finished level.
export async function currentStreak(profileId) {
  const sessions = await db.sessions.where({ profileId }).toArray();
  const days = new Set(sessions.map((s) => s.day));
  let streak = 0;
  const cursor = new Date();
  if (!days.has(today(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (days.has(today(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export async function weeklyReport(profileId) {
  const since = new Date();
  since.setDate(since.getDate() - 6);
  const sinceDay = today(since);
  const answers = (await db.answers.where({ profileId }).toArray()).filter((a) => a.day >= sinceDay);
  const sessions = (await db.sessions.where({ profileId }).toArray()).filter((s) => s.day >= sinceDay);

  const byTopic = {};
  for (const a of answers) {
    byTopic[a.topic] ??= { total: 0, correct: 0 };
    byTopic[a.topic].total += 1;
    if (a.correct) byTopic[a.topic].correct += 1;
  }
  return {
    daysActive: new Set(sessions.map((s) => s.day)).size,
    levelsPlayed: sessions.length,
    questions: answers.length,
    correct: answers.filter((a) => a.correct).length,
    byTopic,
  };
}
