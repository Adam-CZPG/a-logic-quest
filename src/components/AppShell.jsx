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

// `header` stays frozen at the top while the page scrolls underneath it.
export default function AppShell({ header, children }) {
  const t = useT();
  return (
    <div className="paper min-h-screen">
      {header && (
        <header className="sticky top-0 z-20 bg-paper/95 backdrop-blur border-b border-line" style={{ paddingTop: 'var(--safe-top)' }}>
          <div className="max-w-2xl mx-auto px-4 py-2.5">{header}</div>
        </header>
      )}
      <div className="max-w-2xl mx-auto px-4" style={{ paddingTop: header ? 12 : 'calc(var(--safe-top) + 12px)', paddingBottom: 'calc(var(--safe-bottom) + 120px)' }}>
        {children}
      </div>
      <nav className="fixed bottom-0 inset-x-0 z-30 bg-sheet/95 backdrop-blur border-t border-line" style={{ paddingBottom: 'var(--safe-bottom)' }}>
        <div className="max-w-2xl mx-auto grid grid-cols-4">
          {TABS.map(({ to, icon: Icon, key, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => cn('flex flex-col items-center gap-0.5 py-1.5 text-[11px] font-bold transition-colors', isActive ? 'text-pen' : 'text-ink-soft hover:text-ink')}
            >
              {({ isActive }) => (
                <>
                  <span className={cn('w-11 h-6 rounded-full grid place-items-center transition-colors', isActive && 'bg-pen-soft')}>
                    <Icon className="w-[18px] h-[18px]" strokeWidth={isActive ? 2.5 : 2} />
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

// Small page title used inside frozen headers.
export function PageTitle({ children, right }) {
  return (
    <div className="flex items-center gap-2 h-10">
      <h1 className="font-heading font-extrabold text-2xl leading-none flex-1 truncate">{children}</h1>
      {right}
    </div>
  );
}
