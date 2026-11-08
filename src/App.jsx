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
import { DuelHub, DuelView, DuelOpen, WebHome, WEB_ONLY } from '@/pages/Duel';
import League, { FollowOpen } from '@/pages/League';
import Friends from '@/pages/Friends';
import { ClassesHome, ClassView, CheersInbox } from '@/pages/Classes';

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
      if (m) return navigate(`/d?d=${m[1]}`);
      const f = String(url).match(/[?&]c=([A-Z0-9]{6})/i);
      if (f) navigate(`/f?c=${f[1]}`);
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
            <Route path="/f" element={<FollowOpen />} />
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
            <Route path="/league" element={<Guard><League /></Guard>} />
            <Route path="/friends" element={<Guard><Friends /></Guard>} />
            <Route path="/classes" element={<Guard><ClassesHome /></Guard>} />
            <Route path="/class/:code" element={<Guard><ClassView /></Guard>} />
            <Route path="/cheers" element={<Guard><CheersInbox /></Guard>} />
            <Route path="/f" element={<FollowOpen />} />
            <Route path="/duel/:id" element={<Guard><DuelView /></Guard>} />
            <Route path="/" element={<Guard><Home /></Guard>} />
            <Route path="/subject/:subject" element={<Guard><Subject /></Guard>} />
            <Route path="/play/:kind" element={<Guard><Player /></Guard>} />
            <Route path="/stats" element={<Guard><Stats /></Guard>} />
            <Route path="/settings" element={<Guard><Settings /></Guard>} />
            {/* the old puzzle games (Logic Quest) move to the MAT MATSTERFA app; old links land on Home */}
            {['/games', '/game/:level', '/logic', '/achievements'].map((p) => <Route key={p} path={p} element={<Navigate to="/" replace />} />)}
            <Route path="*" element={<PageNotFound />} />
          </Routes>
        )}
        <Toaster />
      </Router>
    </SettingsProvider>
  );
}
