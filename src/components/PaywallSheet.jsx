import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Lock, X, Loader2 } from 'lucide-react';
import { useSettings } from '@/lib/settings';
import { currencyFor } from '@/i18n';
import { getOffer, buyPremium, restorePremium, usePremium } from '@/lib/premium';
import { haptic } from '@/lib/native';

// shown until Play answers (or in the browser); the real price always comes from Google Play
function fallbackOffer(lang, curriculum) {
  return { price: currencyFor(lang, curriculum) === 'Kč' ? '299 Kč' : '11,99 €' };
}

// "Unlock everything" sheet: what the full version gives, the price, buy and restore.
export default function PaywallSheet({ open, onClose }) {
  const { t, settings } = useSettings();
  const premium = usePremium();
  const [offer, setOffer] = useState(null);
  const [busy, setBusy] = useState(null); // 'buy' | 'restore'
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    if (!open) return;
    setMsg(null);
    let alive = true;
    getOffer().then((o) => alive && setOffer(o));
    return () => {
      alive = false;
    };
  }, [open]);

  // bought → thank you, then close
  useEffect(() => {
    if (!open || !premium) return;
    const id = setTimeout(onClose, 1600);
    return () => clearTimeout(id);
  }, [open, premium, onClose]);

  const shown = offer || fallbackOffer(settings.lang, settings.curriculum);

  async function buy() {
    setBusy('buy');
    setMsg(null);
    const r = await buyPremium();
    setBusy(null);
    if (r === 'ok') haptic('success');
    else if (r === 'unavailable') setMsg(t('pay.unavailable'));
    else if (r === 'error') setMsg(t('pay.error'));
  }

  async function restore() {
    setBusy('restore');
    setMsg(null);
    const r = await restorePremium();
    setBusy(null);
    if (r === 'none') setMsg(t('pay.noneFound'));
    else if (r === 'unavailable') setMsg(t('pay.unavailable'));
  }

  const perks = ['pay.perk1', 'pay.perk2', 'pay.perk3', 'pay.perk4'];

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 bg-ink/40 grid place-items-end sm:place-items-center p-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div role="dialog" aria-modal="true" aria-label={t('pay.title')} className="sheet relative w-full max-w-md p-4 pt-5"
            initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }} onClick={(e) => e.stopPropagation()} style={{ marginBottom: 'var(--safe-bottom)' }}>
            <button onClick={onClose} aria-label={t('common.close')} className="absolute top-3 end-3 w-9 h-9 rounded-full grid place-items-center hover:bg-pen-soft"><X className="w-5 h-5" /></button>

            {premium ? (
              <div className="py-6 text-center">
                <p className="text-5xl" aria-hidden="true">🎉</p>
                <h2 className="font-heading font-extrabold text-2xl mt-3">{t('pay.thanks')}</h2>
                <p className="text-ink-soft mt-1">{t('pay.thanksDesc')}</p>
              </div>
            ) : (
              <>
                <span className="w-12 h-12 rounded-2xl bg-marker border-2 border-[#1B2340] text-[#1B2340] grid place-items-center shadow-[2px_2px_0_0_rgba(27,35,64,0.85)]"><Lock className="w-6 h-6" /></span>
                <h2 className="font-heading font-extrabold text-2xl mt-3 pe-8 leading-tight">{t('pay.title')}</h2>
                <p className="text-sm text-ink-soft mt-1">{t('pay.desc')}</p>

                <ul className="mt-3 space-y-1.5">
                  {perks.map((k) => (
                    <li key={k} className="flex gap-2 text-[15px]"><Check className="w-5 h-5 text-ok shrink-0 mt-0.5" />{t(k)}</li>
                  ))}
                </ul>

                {/* one honest price, no fake discount */}
                <div className="mt-4 rounded-2xl border-2 border-dashed border-pen/50 bg-pen-soft/60 p-3 flex items-center gap-3">
                  <span className="flex-1 min-w-0">
                    <span className="block text-xs font-bold uppercase tracking-wide text-ink-soft">{t('pay.once')}</span>
                    <span className="flex items-baseline gap-2 flex-wrap">
                      <span className="font-heading font-extrabold text-3xl text-pen tabular">{shown.price}</span>
                    </span>
                  </span>
                </div>

                <button onClick={buy} disabled={!!busy}
                  className="mt-4 w-full py-3.5 rounded-2xl border-[3px] border-[#1B2340] bg-ok text-white font-heading font-extrabold text-lg shadow-[3px_3px_0_0_rgba(27,35,64,0.85)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-70 flex items-center justify-center gap-2">
                  {busy === 'buy' && <Loader2 className="w-5 h-5 animate-spin" />}{t('pay.buy')}
                </button>
                {msg && <p role="status" className="mt-2 text-sm text-center text-redpen font-bold">{msg}</p>}
                <div className="mt-3 flex items-center justify-between gap-2 text-sm">
                  <button onClick={restore} disabled={!!busy} className="font-bold text-pen underline underline-offset-2 flex items-center gap-1.5">
                    {busy === 'restore' && <Loader2 className="w-4 h-4 animate-spin" />}{t('pay.restore')}
                  </button>
                  <span className="text-ink-soft text-xs text-end">{t('pay.note')}</span>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
