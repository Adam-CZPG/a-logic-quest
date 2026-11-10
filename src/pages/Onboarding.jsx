import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Check } from 'lucide-react';
import { useSettings } from '@/lib/settings';
import { LANGS } from '@/i18n';
import { CURRICULA, DE_STATES, gradesFor, fitGrade } from '@/exam/taxonomy';
import { cn } from '@/lib/utils';
import logo from '@/assets/logo.svg';

export default function Onboarding() {
  const { settings, update, t } = useSettings();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(settings.name || '');

  const choose = (patch, next) => {
    update(patch);
    if (next === 'done') {
      update((prev) => ({ onboarded: true, startedAt: prev.startedAt || Date.now(), startGrade: prev.startGrade || prev.grade }));
      navigate('/', { replace: true });
    } else setStep(next);
  };

  return (
    <div className="paper min-h-screen" style={{ paddingTop: 'calc(var(--safe-top) + 16px)' }}>
      <div className="max-w-md mx-auto px-5 pb-10">
        <div className="flex items-center h-10">
          {step > 0 && (
            <button onClick={() => setStep(step === 4 && settings.curriculum !== 'de' ? 2 : step - 1)} aria-label={t('common.back')} className="w-10 h-10 grid place-items-center rounded-xl hover:bg-pen-soft">
              <ChevronLeft className="w-6 h-6 rtl:rotate-180" />
            </button>
          )}
          <div className="ms-auto flex gap-1.5" aria-hidden="true">
            {(settings.curriculum === 'de' ? [0, 1, 2, 3, 4] : [0, 1, 2, 4]).map((i) => <span key={i} className={cn('h-2 rounded-full transition-all', i === step ? 'w-6 bg-pen' : 'w-2 bg-line')} />)}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>
            {step === 0 && (
              <>
                <h1 className="font-heading font-extrabold text-4xl mt-6 leading-tight flex items-center gap-3">
                  <img src={logo} alt="" className="w-14 h-14 rounded-2xl shadow-md" />
                  {t('app.name')}
                </h1>
                <p className="mt-2 font-heading font-extrabold text-lg">{t('app.slogan')}</p>
                <p className="mt-2 text-ink-soft text-lg">{t('ob.welcome')} {t('ob.pickLang')}</p>
                <div className="mt-6 grid grid-cols-2 gap-2.5">
                  {LANGS.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => { const c = { de: 'de', sk: 'sk' }[l.code] || 'cz'; choose({ lang: l.code, curriculum: c, grade: fitGrade(c, settings.grade) }, 1); }}
                      className={cn('sheet flex items-center gap-2.5 px-3 py-3 text-start font-bold text-[15px] hover:border-pen', settings.lang === l.code && 'border-pen bg-pen-soft')}
                    >
                      <span className="text-2xl" aria-hidden="true">{l.flag}</span>
                      <span className="truncate">{l.name}</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {step === 1 && (
              <form onSubmit={(e) => { e.preventDefault(); if (name.trim()) choose({ name: name.trim().slice(0, 30) }, 2); }}>
                <h1 className="font-heading font-extrabold text-3xl mt-6">{t('ob.name')}</h1>
                <p className="mt-2 text-ink-soft">{t('ob.nameHint')}</p>
                <input autoFocus value={name} onChange={(e) => setName(e.target.value)} maxLength={30} placeholder={t('ob.namePh')} aria-label={t('ob.namePh')}
                  className="mt-6 w-full rounded-2xl border-2 border-line focus:border-pen outline-none bg-sheet px-4 py-3.5 text-xl font-bold" />
                <button type="submit" disabled={!name.trim()} className="mt-4 w-full rounded-2xl bg-pen text-on-pen py-3.5 font-bold text-lg disabled:opacity-40">
                  {t('ob.continue')}
                </button>
              </form>
            )}

            {step === 2 && (
              <>
                <h1 className="font-heading font-extrabold text-3xl mt-6">{t('ob.pickCountry')}</h1>
                <div className="mt-6 space-y-3">
                  {Object.values(CURRICULA).map((c) => (
                    <button
                      key={c.id}
                      onClick={() => choose({ curriculum: c.id, grade: fitGrade(c.id, settings.grade) }, c.states ? 3 : 4)}
                      className={cn('sheet w-full flex items-center gap-4 p-5 text-start hover:border-pen', settings.curriculum === c.id && 'border-pen bg-pen-soft')}
                    >
                      <span className="text-4xl" aria-hidden="true">{c.flag}</span>
                      <span>
                        <span className="block font-heading font-bold text-xl">{t(`ob.${c.id}`)}</span>
                        <span className="block text-ink-soft">{t(`ob.${c.id}Desc`)}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h1 className="font-heading font-extrabold text-3xl mt-6">{t('ob.pickState')}</h1>
                <p className="mt-2 text-ink-soft">{t('ob.stateHint')}</p>
                <div className="mt-5 grid grid-cols-2 gap-2">
                  {DE_STATES.map((st) => (
                    <button key={st.id} onClick={() => choose({ state: st.id }, 4)}
                      className={cn('sheet px-3 py-2.5 text-start font-bold text-sm hover:border-pen', settings.state === st.id && 'border-pen bg-pen-soft')}>
                      {st.name}
                    </button>
                  ))}
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <h1 className="font-heading font-extrabold text-3xl mt-6">{t('ob.pickGrade')}</h1>
                <div className="mt-6 space-y-3">
                  {gradesFor(settings.curriculum).map((g) => (
                    <button
                      key={g}
                      onClick={() => choose({ grade: g }, 'done')}
                      className={cn('sheet w-full flex items-center gap-4 p-4 text-start hover:border-pen', settings.grade === g && 'border-pen')}
                    >
                      <span className="w-14 h-14 rounded-2xl bg-pen text-on-pen grid place-items-center font-heading font-extrabold text-3xl shrink-0">{g}</span>
                      <span className="flex-1">
                        <span className="block font-heading font-bold text-xl">{t('grade.n', { g })}</span>
                        <span className="block text-ink-soft">{t(`grade.${settings.curriculum}${g}`)}</span>
                      </span>
                      {settings.grade === g && <Check className="w-5 h-5 text-pen" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
