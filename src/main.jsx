import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Fonts are bundled with the app (not loaded from Google), so they work offline.
// Comfortaa includes Greek letters.
import '@fontsource/comfortaa/greek-400.css';
import '@fontsource/comfortaa/greek-700.css';
import '@fontsource/comfortaa/latin-400.css';
import '@fontsource/comfortaa/latin-700.css';
import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
