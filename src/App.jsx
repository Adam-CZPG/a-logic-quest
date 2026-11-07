import { useEffect } from 'react';
import { HashRouter as Router, Route, Routes, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import PageNotFound from './lib/PageNotFound';
import ScrollToTop from './components/ScrollToTop';
import { SettingsProvider, useSettings } from '@/lib/settings';
import { onHardwareBack, exitApp, setupNativeChrome, syncReminder, onAppUrl } from '@/lib/native';
import Onboarding from '@/pages/Onboarding';
import Home from '@/pages/Home';
import Subject from '@/pages/Subject';
import Player from '@/pages/Player';
import Stats from '@/pages/Stats';
import Settings from '@/pages/Settings';
import GamesHome from '@/pages/GamesHome';
import Game from '@/pages/Game';
import LogicGame from '@/pages/LogicGame';
import Achievements from '@/pages/Achievements';
import { DuelHub, DuelView, DuelOpen, WebHome, WEB_ONLY } from '@/pages/Duel';

function NativeBridge() {
  const location = useLocation();
  const navigate = useNavigate();
  const { settings, t } = useSettings();

  useEffect(() => {
    setupNativeChrome(document.documentElement.classList.contains('dark'));
  }, [settings.theme]);

  // keep the daily reminder text in the chosen language
  useEffect(() => {
    if (settings.reminder?.on) syncReminder(settings.reminder, t);
  }, [settings.lang]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let off = () => {};
    onHardwareBack(() => {
      if (location.pathname === '/' || location.pathname === '/welcome') exitApp();
      else navigate(-1);
    }).then((fn) => { off = fn; });
    return () => off();
  }, [location.pathname, navigate]);

  // gbexam://d?d=… (a duel link opened in the installed app)
  useEffect(() => {
    let off = () => {};
    onAppUrl((url) => {
      const m = String(url).match(/[?&]d=([A-Za-z0-9_-]+)/);
      if (m) navigate(`/d?d=${m[1]}`);
    }).then((fn) => { off = fn; });
    return () => off();
  }, [navigate]);
  return null;
}

function Guard({ children }) {
  const { settings } = useSettings();
  if (!settings.onboarded) return <Navigate to="/welcome" replace />;
  return children;
}

export default function App() {
  return (
    <SettingsProvider>
      <Router>
        <ScrollToTop />
        <NativeBridge />
        {WEB_ONLY ? (
          // the public web page (duel links) only runs duels; everything else is in the app
          <Routes>
            <Route path="/welcome" element={<Onboarding />} />
            <Route path="/d" element={<DuelOpen />} />
            <Route path="/duel/:id" element={<Guard><DuelView /></Guard>} />
            <Route path="/play/:kind" element={<Guard><Player /></Guard>} />
            <Route path="/" element={<Guard><WebHome /></Guard>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        ) : (
          <Routes>
            <Route path="/welcome" element={<Onboarding />} />
            <Route path="/d" element={<DuelOpen />} />
            <Route path="/duel" element={<Guard><DuelHub /></Guard>} />
            <Route path="/duel/:id" element={<Guard><DuelView /></Guard>} />
            <Route path="/" element={<Guard><Home /></Guard>} />
            <Route path="/subject/:subject" element={<Guard><Subject /></Guard>} />
            <Route path="/play/:kind" element={<Guard><Player /></Guard>} />
            <Route path="/stats" element={<Guard><Stats /></Guard>} />
            <Route path="/settings" element={<Guard><Settings /></Guard>} />
            <Route path="/games" element={<GamesHome />} />
            <Route path="/game/:level" element={<Game />} />
            <Route path="/logic" element={<LogicGame />} />
            <Route path="/achievements" element={<Achievements />} />
            <Route path="*" element={<PageNotFound />} />
          </Routes>
        )}
        <Toaster />
      </Router>
    </SettingsProvider>
  );
}
