// A broken screen must never leave the child with a blank page: show a calm message and a way back.
// The stored results are not touched here.
import { Component } from 'react';
import { RotateCcw, Home } from 'lucide-react';
import { useSettings } from '@/lib/settings';

function Fallback({ onRetry }) {
  const { t } = useSettings();
  return (
    <div className="min-h-screen bg-paper text-ink grid place-items-center p-6" role="alert">
      <div className="sheet w-full max-w-sm p-6 text-center">
        <h1 className="font-heading font-extrabold text-2xl">{t('err.title')}</h1>
        <p className="mt-2 text-ink-soft">{t('err.text')}</p>
        <div className="mt-5 grid gap-2.5">
          <button onClick={onRetry} className="h-12 rounded-2xl bg-pen text-on-pen font-bold flex items-center justify-center gap-2">
            <RotateCcw className="w-5 h-5" aria-hidden="true" />{t('err.retry')}
          </button>
          <a href="#/" onClick={() => setTimeout(() => window.location.reload(), 0)} className="h-12 rounded-2xl border-2 border-line bg-sheet font-bold flex items-center justify-center gap-2">
            <Home className="w-5 h-5" aria-hidden="true" />{t('err.home')}
          </a>
        </div>
      </div>
    </div>
  );
}

export default class ErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error('[TryFixPass] screen failed:', error);
  }

  componentDidUpdate(prev) {
    // moving to another screen clears the error
    if (this.state.failed && prev.resetKey !== this.props.resetKey) this.setState({ failed: false });
  }

  render() {
    // a full reload also recovers a screen whose code failed to load
    if (this.state.failed) return <Fallback onRetry={() => window.location.reload()} />;
    return this.props.children;
  }
}
