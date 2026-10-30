import { NavLink } from 'react-router-dom';
import { House, BarChart3, Gamepad2, Settings } from 'lucide-react';
import { useT } from '@/lib/settings';
import { cn } from '@/lib/utils';

const TABS = [
  { to: '/', icon: House, key: 'nav.home', end: true },
  { to: '/stats', icon: BarChart3, key: 'nav.stats' },
  { to: '/games', icon: Gamepad2, key: 'nav.games' },
  { to: '/settings', icon: Settings, key: 'nav.settings' },
];

export default function AppShell({ children }) {
  const t = useT();
  return (
    <div className="paper min-h-screen">
      <div className="max-w-2xl mx-auto px-4 pb-28" style={{ paddingTop: 'calc(var(--safe-top) + 12px)' }}>
        {children}
      </div>
      <nav className="fixed bottom-0 inset-x-0 z-30 bg-sheet/95 backdrop-blur border-t-2 border-line" style={{ paddingBottom: 'var(--safe-bottom)' }}>
        <div className="max-w-2xl mx-auto grid grid-cols-4">
          {TABS.map(({ to, icon: Icon, key, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => cn('flex flex-col items-center gap-0.5 py-2.5 text-xs font-bold transition-colors', isActive ? 'text-pen' : 'text-ink-soft hover:text-ink')}
            >
              {({ isActive }) => (
                <>
                  <span className={cn('w-12 h-7 rounded-full grid place-items-center transition-colors', isActive && 'bg-pen-soft')}>
                    <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                  </span>
                  {t(key)}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
