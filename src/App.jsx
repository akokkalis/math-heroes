// Routes. HashRouter (#/map) works both as a website and inside the
// Capacitor native app, where there is no web server to handle real URLs.

import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { I18nProvider } from './i18n/I18nProvider.jsx';
import { PlayerProvider, usePlayer } from './state/PlayerProvider.jsx';
import ProfilePicker from './screens/ProfilePicker.jsx';
import CreateProfile from './screens/CreateProfile.jsx';
import WorldMap from './screens/WorldMap.jsx';
import Level from './screens/Level.jsx';
import Shop from './screens/Shop.jsx';
import Parent from './screens/Parent.jsx';

// Screens that need a selected child send you back to the start otherwise.
function NeedsProfile({ children }) {
  const { profileId } = usePlayer();
  return profileId ? children : <Navigate to="/" replace />;
}

function AppRoutes() {
  const { ready } = usePlayer();
  if (!ready) return null;
  return (
    <Routes>
      <Route path="/" element={<ProfilePicker />} />
      <Route path="/new" element={<CreateProfile />} />
      <Route path="/map" element={<NeedsProfile><WorldMap /></NeedsProfile>} />
      <Route path="/play/:levelId" element={<NeedsProfile><Level /></NeedsProfile>} />
      <Route path="/shop" element={<NeedsProfile><Shop /></NeedsProfile>} />
      <Route path="/parent" element={<Parent />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <PlayerProvider>
        <HashRouter>
          <AppRoutes />
        </HashRouter>
      </PlayerProvider>
    </I18nProvider>
  );
}
