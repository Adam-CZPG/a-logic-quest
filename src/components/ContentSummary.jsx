import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useSettings } from '@/lib/settings';
import { contentSummary, SUBJECTS } from '@/exam/taxonomy';
import { cn } from '@/lib/utils';

// What the app holds, grade by grade and subject by subject: full tests, topic sets, tasks.
// Parents see exactly what they pay for. The child's own grade comes first.
export function ContentTable() {
  const { t, settings } = useSettings();
  const nf = (n) => {
    try {
      return new Intl.NumberFormat(settings.lang).format(n);
    } catch {
      return String(n);
    }
  };
  const all = contentSummary(settings.curriculum);
  const grades = [...all.filter((g) => g.grade === settings.grade), ...all.filter((g) => g.grade !== settings.grade)];
  return (
    <div className="space-y-2.5">
      {grades.map(({ grade, subjects }) => (
        <section key={grade} className={cn('rounded-xl border-2 overflow-hidden', grade === settings.grade ? 'border-pen' : 'border-line')} aria-label={t('grade.n', { g: grade })}>
          <h3 className={cn('px-3 py-1.5 font-heading font-bold text-sm', grade === settings.grade ? 'bg-pen text-on-pen' : 'bg-pen-soft')}>{t('grade.n', { g: grade })}</h3>
          <table className="w-full text-sm tabular">
            <thead>
              <tr className="text-[11px] text-ink-soft">
                <th className="text-start font-bold px-3 pt-1.5 pb-1"><span className="sr-only">{t('cat.subject')}</span></th>
                <th className="text-end font-bold px-1.5 pt-1.5 pb-1">{t('subj.tests')}</th>
                <th className="text-end font-bold px-1.5 pt-1.5 pb-1">{t('subj.sets')}</th>
                <th className="text-end font-bold ps-1.5 pe-3 pt-1.5 pb-1">{t('cat.tasks')}</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((s) => (
                <tr key={s.subject} className="border-t border-line">
                  <th scope="row" className="text-start font-bold px-3 py-1.5 leading-tight">
                    <span aria-hidden="true">{SUBJECTS[s.subject]?.emoji} </span>{t(`subject.${s.subject}`)}
                    {s.optional && <span className="block text-[11px] font-normal text-ink-soft">{t('cat.optional')}</span>}
                  </th>
                  <td className="text-end px-1.5 py-1.5 font-bold">{s.tests}</td>
                  <td className="text-end px-1.5 py-1.5 font-bold">{s.sets}</td>
                  <td className="text-end ps-1.5 pe-3 py-1.5 font-extrabold text-pen">{nf(s.tasks)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
      <p className="text-xs text-ink-soft leading-snug">{t('cat.free')} {t('subj.fresh')}</p>
    </div>
  );
}

// a "What exactly is inside?" toggle that opens the table in place
export default function ContentSummary({ className }) {
  const { t } = useSettings();
  const [open, setOpen] = useState(false);
  return (
    <div className={className}>
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="w-full flex items-center gap-2 rounded-xl border-2 border-line px-3 py-2 text-start font-bold text-sm hover:border-pen">
        <span className="flex-1">{t('cat.show')}</span>
        <ChevronDown className={cn('w-4 h-4 transition-transform', open && 'rotate-180')} />
      </button>
      {open && <div className="mt-2"><ContentTable /></div>}
    </div>
  );
}
