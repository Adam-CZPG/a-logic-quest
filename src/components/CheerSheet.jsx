import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSettings } from '@/lib/settings';
import { CHEERS, sendCheer } from '@/lib/league';
import { cn } from '@/lib/utils';

// Send a cheer: the child picks one of the ready phrases – there is no text box on purpose.
export default function CheerSheet({ to, onClose }) {
  const { t } = useSettings();
  const [state, setState] = useState(null); // null | 'busy' | 'ok' | 'limit' | 'notfriends' | 'offline'

  const pick = async (i) => {
    setState('busy');
    try {
      const r = await sendCheer(to.code, i);
      setState(r === 'ok' ? 'ok' : r === 'limit' ? 'limit' : r === 'notfriends' ? 'notfriends' : 'offline');
      if (r === 'ok') setTimeout(onClose, 900);
    } catch {
      setState('offline');
    }
  };

  return (
    <AnimatePresence>
      {to && (
        <motion.div className="fixed inset-0 z-40 bg-ink/40 grid place-items-end sm:place-items-center p-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div role="dialog" aria-modal="true" aria-label={t('ch.send')} className="sheet w-full max-w-md p-4"
            initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }} onClick={(e) => e.stopPropagation()} style={{ marginBottom: 'var(--safe-bottom)' }}>
            <h2 className="font-heading font-bold text-xl flex items-center gap-2"><span aria-hidden="true">{to.avatar}</span>{t('ch.sendTo', { name: to.name })}</h2>
            <div className="mt-3 grid grid-cols-2 gap-1.5">
              {CHEERS.map((emoji, i) => (
                <button key={i} disabled={state === 'busy' || state === 'ok'} onClick={() => pick(i)}
                  className="flex items-center gap-2 rounded-xl border-2 border-line bg-sheet px-2.5 py-2 text-start text-sm font-bold hover:border-pen active:scale-[0.98] disabled:opacity-60">
                  <span className="text-xl" aria-hidden="true">{emoji}</span><span className="leading-tight">{t(`ch.p${i}`)}</span>
                </button>
              ))}
            </div>
            {state && state !== 'busy' && (
              <p className={cn('mt-3 text-sm font-bold text-center', state === 'ok' ? 'text-ok' : 'text-redpen')}>
                {state === 'ok' ? `✓ ${t('ch.sent')}` : state === 'limit' ? t('ch.limit') : state === 'notfriends' ? t('ch.notfriends') : t('league.offline')}
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
