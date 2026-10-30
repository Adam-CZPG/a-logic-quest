import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Check } from 'lucide-react';
import { useSettings } from '@/lib/settings';
import { LANGS } from '@/i18n';
import { GRADES, CURRICULA } from '@/exam/taxonomy';
import { cn } from '@/lib/utils';

export default function Onboarding() {
  const { settings, update, t } = useSettings();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  const choose = (patch, next) => {
    update(patch);
    if (next === 'done') {
      update({ onboarded: true });
      navigate('/', { replace: true });
    } else setStep(next);
  };

  return (
    <div className="paper min-h-screen" style={{ paddingTop: 'calc(var(--safe-top) + 16px)' }}>
      <div className="max-w-md mx-auto px-5 pb-10">
        <div className="flex items-center h-10">
          {step > 0 && (
            <button onClick={() => setStep(step - 1)} aria-label={t('common.back')} className="w-10 h-10 grid place-items-center rounded-xl hover:bg-pen-soft">
              <ChevronLeft className="w-6 h-6 rtl:rotate-180" />
            </button>
          )}
          <div className="ms-auto flex gap-1.5" aria-hidden="true">
            {[0, 1, 2].map((i) => <span key={i} className={cn('h-2 rounded-full transition-all', i === step ? 'w-6 bg-pen' : 'w-2 bg-line')} />)}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>
            {step === 0 && (
              <>
                <h1 className="font-heading font-extrabold text-4xl mt-6 leading-tight">
                  Logic Quest
                </h1>
                <p className="mt-2 text-ink-soft text-lg">{t('ob.welcome')} {t('ob.pickLang')}</p>
                <div className="mt-6 grid grid-cols-2 gap-2.5">
                  {LANGS.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => choose({ lang: l.code, curriculum: l.code === 'cs' ? 'cz' : settings.curriculum }, 1)}
                      className={cn('sheet flex items-center gap-3 px-4 py-3 text-start font-bold hover:border-pen', settings.lang === l.code && 'border-pen bg-pen-soft')}
                    >
                      <span className="text-2xl" aria-hidden="true">{l.flag}</span>
                      <span className="truncate">{l.name}</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <h1 className="font-heading font-extrabold text-3xl mt-6">{t('ob.pickCountry')}</h1>
                <div className="mt-6 space-y-3">
                  {Object.values(CURRICULA).map((c) => (
                    <button
                      key={c.id}
                      onClick={() => choose({ curriculum: c.id }, 2)}
                      className={cn('sheet w-full flex items-center gap-4 p-5 text-start hover:border-pen', settings.curriculum === c.id && 'border-pen bg-pen-soft')}
                    >
                      <span className="text-4xl" aria-hidden="true">{c.flag}</span>
                      <span>
                        <span className="block font-heading font-bold text-xl">{t(c.id === 'cz' ? 'ob.cz' : 'ob.intl')}</span>
                        <span className="block text-ink-soft">{t(c.id === 'cz' ? 'ob.czDesc' : 'ob.intlDesc')}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h1 className="font-heading font-extrabold text-3xl mt-6">{t('ob.pickGrade')}</h1>
                <div className="mt-6 space-y-3">
                  {GRADES.map((g) => (
                    <button
                      key={g}
                      onClick={() => choose({ grade: g }, 'done')}
                      className={cn('sheet w-full flex items-center gap-4 p-4 text-start hover:border-pen', settings.grade === g && 'border-pen')}
                    >
                      <span className="w-14 h-14 rounded-2xl bg-pen text-on-pen grid place-items-center font-heading font-extrabold text-3xl shrink-0">{g}</span>
                      <span className="flex-1">
                        <span className="block font-heading font-bold text-xl">{t('grade.n', { g })}</span>
                        <span className="block text-ink-soft">{t(settings.curriculum === 'cz' ? `grade.cz${g}` : `grade.intl${g}`)}</span>
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
