// Who is playing right now, and whether the full version is unlocked.
// useLiveQuery re-renders automatically when the database changes,
// so coins and XP update on screen without any extra code.

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getSetting, setSetting } from '../db/db.js';
import { loadFullVersion } from '../game/entitlement.js';

const PlayerContext = createContext(null);

export function PlayerProvider({ children }) {
  const [profileId, setProfileIdState] = useState(null);
  const [ready, setReady] = useState(false);
  const [isFullVersion, setIsFullVersion] = useState(false);

  useEffect(() => {
    Promise.all([getSetting('currentProfileId'), loadFullVersion()]).then(([id, full]) => {
      setProfileIdState(id);
      setIsFullVersion(full);
      setReady(true);
    });
  }, []);

  const selectProfile = useCallback((id) => {
    setProfileIdState(id);
    setSetting('currentProfileId', id);
  }, []);

  const refreshFullVersion = useCallback(async () => {
    setIsFullVersion(await loadFullVersion());
  }, []);

  const profile = useLiveQuery(() => (profileId ? db.profiles.get(profileId) : undefined), [profileId]);

  return (
    <PlayerContext.Provider
      value={{ ready, profileId, profile, selectProfile, isFullVersion, refreshFullVersion }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  return useContext(PlayerContext);
}
