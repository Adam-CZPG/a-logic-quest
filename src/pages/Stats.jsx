import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '@/components/AppShell';
import { useSettings } from '@/lib/settings';
import { getStats, topicAccuracy, BADGES } from '@/exam/stats';
import { CURRICULA, topicsFor, TOPIC_EMOJI } from '@/exam/taxonomy';
import { cn } from '@/lib/utils';

function ScoreChart({ points }) {
  // full-test scores over time, 0–50, with the usual 25-point line dashed
  const W = 340, H = 150, P = 26;
  const x = (i) => P + (points.length === 1 ? (W - 2 * P) / 2 : (i * (W - 2 * P)) / (points.length - 1));
  const y = (v) => 10 + (H - 30) * (1 - v / 50);
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.score)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={points.map((p) => p.score).join(', ')}>
      {[0, 25, 50].map((v) => (
        <g key={v}>
          <line x1={P} x2={W - 8} y1={y(v)} y2={y(v)} stroke="hsl(var(--line))" strokeDasharray={v === 25 ? '5 5' : undefined} strokeWidth="1.5" />
          <text x={P - 6} y={y(v) + 4} textAnchor="end" fontSize="11" fill="hsl(var(--ink-soft))">{v}</text>
        </g>
      ))}
      <path d={path} fill="none" stroke="hsl(var(--pen))" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => (
        <circle key={i} cx={x(i)} cy={y(p.score)} r="4.5" fill={p.subject === 'czech' ? 'hsl(var(--redpen))' : 'hsl(var(--pen))'} stroke="hsl(var(--sheet))" strokeWidth="2" />
      ))}
    </svg>
  );
}

export default function Stats() {
  const { settings, t } = useSettings();
  const s = getStats();
  const { grade, curriculum } = settings;
  const mocks = s.history.filter((h) => h.kind === 'mock' && h.grade === grade).slice(0, 20).reverse();
  const avg = mocks.length ? Math.round(mocks.reduce((a, h) => a + h.score, 0) / mocks.length) : null;
  const best = mocks.length ? Math.max(...mocks.map((h) => h.score)) : null;
  const subjects = CURRICULA[curriculum]?.subjects || ['math'];

  const topicRows = useMemo(() => subjects.flatMap((sub) => topicsFor(sub, grade).map((tp) => ({ sub, tp, acc: topicAccuracy(s, sub, grade, tp) }))), [s, grade, subjects.join()]);
  const weak = topicRows.filter((r) => r.acc !== null).sort((a, b) => a.acc - b.acc).slice(0, 3);

  return (
    <AppShell>
      <h1 className="font-heading font-extrabold text-3xl">{t('st.title')}</h1>

      <div className="mt-4 grid grid-cols-4 gap-2 text-center">
        {[[t('st.tests'), mocks.length], [t('st.avg'), avg ?? '–'], [t('st.best'), best ?? '–'], [t('home.solved'), s.solved]].map(([label, v]) => (
          <div key={label} className="sheet px-1 py-3">
            <p className="font-heading font-bold text-2xl tabular">{v}</p>
            <p className="text-xs text-ink-soft leading-tight">{label}</p>
          </div>
        ))}
      </div>

      <section className="sheet mt-4 p-4">
        <h2 className="font-heading font-bold mb-2">{t('st.history')}</h2>
        {mocks.length ? <ScoreChart points={mocks} /> : <p className="text-ink-soft">{t('st.empty')}</p>}
      </section>

      {weak.length > 0 && (
        <section className="mt-4">
          <h2 className="font-heading font-bold mb-2">{t('st.weak')}</h2>
          <div className="space-y-2">
            {weak.map(({ sub, tp, acc }) => (
              <Link key={sub + tp} to={`/play/topic?subject=${sub}&topic=${tp}&mode=practice`} className="sheet flex items-center gap-3 p-3 hover:border-pen">
                <span className="text-2xl">{TOPIC_EMOJI[tp]}</span>
                <span className="flex-1 font-bold leading-snug">{t(`topic.${tp}`)}</span>
                <span className="text-redpen font-bold tabular">{Math.round(acc * 100)}%</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="sheet mt-4 p-4">
        <h2 className="font-heading font-bold mb-3">{t('st.topics')}</h2>
        {subjects.map((sub) => (
          <div key={sub} className="mb-4 last:mb-0">
            <h3 className="text-sm font-bold text-ink-soft mb-1.5">{t(`subject.${sub}`)}</h3>
            <div className="space-y-2">
              {topicRows.filter((r) => r.sub === sub).map(({ tp, acc }) => (
                <div key={tp} className="flex items-center gap-2 text-sm">
                  <span className="w-6 text-center">{TOPIC_EMOJI[tp]}</span>
                  <span className="flex-1 truncate">{t(`topic.${tp}`)}</span>
                  <span className="w-20 h-2 rounded-full bg-line overflow-hidden">
                    <span className={cn('block h-full', acc === null ? '' : acc >= 0.7 ? 'bg-ok' : acc >= 0.4 ? 'bg-marker' : 'bg-redpen')} style={{ width: `${(acc ?? 0) * 100}%` }} />
                  </span>
                  <span className="w-10 text-end tabular text-ink-soft">{acc === null ? '–' : `${Math.round(acc * 100)}%`}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="mt-4">
        <h2 className="font-heading font-bold mb-2">{t('st.badges')}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {BADGES.map((b) => {
            const got = !!s.badges[b.id];
            return (
              <div key={b.id} className={cn('sheet p-3 flex items-center gap-3', !got && 'opacity-55')}>
                <span className={cn('text-3xl', !got && 'grayscale')}>{b.emoji}</span>
                <div className="min-w-0">
                  <p className="font-bold leading-tight">{t(`b.${b.id}`)}</p>
                  <p className="text-xs text-ink-soft leading-tight">{t(`b.${b.id}_d`)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}
