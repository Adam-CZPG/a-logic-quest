import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import AppShell, { PageTitle } from '@/components/AppShell';
import { useSettings } from '@/lib/settings';
import { getStats, topicAccuracy, weeklyTrend, journey, badgeProgress, insights, levelFromXp, currentStreak } from '@/exam/stats';
import { TrendingUp, TrendingDown, CalendarDays, Repeat, Sprout, Trophy, Target, Flame, RotateCcw, ChevronRight } from 'lucide-react';
import { subjectsFor, topicsFor, TOPIC_EMOJI, SUBJECTS } from '@/exam/taxonomy';
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

// Weekly accuracy (line) over tasks tried (bars) – shows whether the child is getting better.
function TrendChart({ weeks, t, lang }) {
  const W = 340, H = 140, P = 36, B = 22;
  const maxA = Math.max(1, ...weeks.map((w) => w.a));
  const step = (W - P - 8) / weeks.length;
  const x = (i) => P + step * i + step / 2;
  const y = (v) => 8 + (H - B - 8) * (1 - v);
  const pts = weeks.map((w, i) => (w.acc === null ? null : [x(i), y(w.acc)]));
  const path = pts.filter(Boolean).map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join(' ');
  const fmtDay = (d) => d.toLocaleDateString(lang, { day: 'numeric', month: 'numeric' });
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={t('st.trend')}>
      {[0, 0.5, 1].map((v) => (
        <g key={v}>
          <line x1={P} x2={W - 8} y1={y(v)} y2={y(v)} stroke="hsl(var(--line))" strokeWidth="1" strokeDasharray={v === 0.5 ? '4 4' : undefined} />
          <text x={P - 5} y={y(v) + 4} textAnchor="end" fontSize="10" fill="hsl(var(--ink-soft))">{v * 100}%</text>
        </g>
      ))}
      {weeks.map((w, i) => (
        <g key={i}>
          <rect x={x(i) - step * 0.3} width={step * 0.6} y={H - B - ((H - B - 8) * 0.35 * w.a) / maxA} height={((H - B - 8) * 0.35 * w.a) / maxA} rx="3" fill="hsl(var(--pen) / 0.18)" />
          {(i % 2 === weeks.length % 2 || i === weeks.length - 1) && (
            <text x={x(i)} y={H - 6} textAnchor="middle" fontSize="10" fill="hsl(var(--ink-soft))">{fmtDay(w.from)}</text>
          )}
        </g>
      ))}
      <path d={path} fill="none" stroke="hsl(var(--ok))" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p, i) => p && <circle key={i} cx={p[0]} cy={p[1]} r="4" fill="hsl(var(--ok))" stroke="hsl(var(--sheet))" strokeWidth="2" />)}
    </svg>
  );
}

const topicLink = (sub, tp) => `/play/topic?subject=${sub}&topic=${tp}&mode=practice`;

function Bar({ value, className }) {
  return (
    <span className="block h-2 rounded-full bg-line overflow-hidden">
      <span className={cn('block h-full rounded-full', className)} style={{ width: `${Math.max(3, value * 100)}%` }} />
    </span>
  );
}

// What the child has already achieved – always on top, so every visit starts with a win.
function Wins({ s, badges, info, t }) {
  const lvl = levelFromXp(s.xp);
  const streak = currentStreak(s);
  const got = badges.filter((b) => b.got).sort((a, b) => b.gotAt - a.gotAt);
  const next = badges.filter((b) => !b.got).sort((a, b) => b.value / b.goal - a.value / a.goal)[0];
  const strong = info.flatMap((x) => x.strong);
  const best = s.history.filter((h) => h.kind === 'mock').reduce((m, h) => Math.max(m, h.score), null);
  const tiles = [
    [<span key="l" className="text-lg leading-none">⭐</span>, lvl.level, t('st.levelLbl')],
    [<Flame key="f" className={cn('w-4 h-4', streak && 'text-redpen')} />, streak, t('st.streak')],
    [<span key="b" className="text-lg leading-none">🏅</span>, `${got.length}/${badges.length}`, t('st.badges')],
    [<span key="m" className="text-lg leading-none">✅</span>, strong.length, t('st.mastered')],
  ];
  return (
    <section className="rounded-2xl border-2 border-ok/40 bg-ok-soft p-3.5">
      <div className="flex items-center gap-2">
        <Trophy className="w-5 h-5 text-[#D9A400]" />
        <h2 className="font-heading font-extrabold text-lg flex-1">{t('st.wins')}</h2>
        {best !== null && <span className="text-xs font-bold text-ink-soft">{t('st.bestTest', { n: best })}</span>}
      </div>
      <div className="mt-2.5 grid grid-cols-4 gap-1.5 text-center">
        {tiles.map(([icon, v, label]) => (
          <div key={label} className="rounded-xl bg-sheet border border-line py-2 px-0.5">
            <span className="flex justify-center h-4 items-center">{icon}</span>
            <p className="font-heading font-bold text-lg tabular leading-tight mt-0.5">{v}</p>
            <p className="text-[10.5px] text-ink-soft leading-tight">{label}</p>
          </div>
        ))}
      </div>

      <h3 className="mt-3 text-sm font-bold">{t('st.strong')}</h3>
      {strong.length ? (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {strong.slice(0, 10).map((r) => (
            <span key={r.sub + r.tp} className="inline-flex items-center gap-1 rounded-full bg-sheet border border-ok/40 px-2.5 py-1 text-xs font-bold">
              <span aria-hidden="true">{TOPIC_EMOJI[r.tp]}</span>{t(`topic.${r.tp}`)}<span className="text-ok tabular">{Math.round(r.acc * 100)}%</span>
            </span>
          ))}
        </div>
      ) : <p className="mt-1 text-xs text-ink-soft">{t('st.strongEmpty')}</p>}

      {(got[0] || next) && (
        <div className="mt-3 grid grid-cols-1 gap-1.5">
          {got[0] && (
            <div className="flex items-center gap-2.5 rounded-xl bg-sheet border border-line px-2.5 py-2">
              <span className="text-2xl" aria-hidden="true">{got[0].emoji}</span>
              <span className="flex-1 min-w-0">
                <span className="block text-[11px] font-bold text-ink-soft">{t('st.lastBadge')}</span>
                <span className="block font-bold text-sm leading-tight">{t(`b.${got[0].id}`)}</span>
              </span>
            </div>
          )}
          {next && (
            <div className="flex items-center gap-2.5 rounded-xl bg-sheet border border-dashed border-line px-2.5 py-2">
              <span className="text-2xl grayscale opacity-70" aria-hidden="true">{next.emoji}</span>
              <span className="flex-1 min-w-0">
                <span className="block text-[11px] font-bold text-ink-soft">{t('st.nextBadge')} · {t(`b.${next.id}`)}</span>
                <span className="block text-xs leading-tight">{t(`b.${next.id}_d`)}</span>
                <span className="mt-1 flex items-center gap-2"><span className="flex-1"><Bar value={next.value / next.goal} className="bg-marker" /></span><span className="text-[11px] tabular text-ink-soft">{next.value}/{next.goal}</span></span>
              </span>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

// What to learn next: weakest task groups first, then the ones never tried.
function Learn({ info, mistakes, t }) {
  const weakAll = info.flatMap((x) => x.weak).sort((a, b) => a.acc - b.acc);
  const focus = weakAll[0];
  const anyData = info.some((x) => x.rows.some((r) => r.a));
  return (
    <section className="sheet mt-3 p-3.5">
      <div className="flex items-center gap-2">
        <Target className="w-5 h-5 text-redpen" />
        <h2 className="font-heading font-extrabold text-lg flex-1">{t('st.learn')}</h2>
      </div>
      <p className="text-xs text-ink-soft mt-0.5">{t('st.learnDesc')}</p>

      {focus && (
        <Link to={topicLink(focus.sub, focus.tp)} className="mt-2.5 flex items-center gap-3 rounded-xl bg-redpen-soft border border-redpen/30 p-3">
          <span className="text-2xl" aria-hidden="true">{TOPIC_EMOJI[focus.tp]}</span>
          <span className="flex-1 min-w-0">
            <span className="block text-[11px] font-bold text-redpen uppercase tracking-wide">{t('st.focus')}</span>
            <span className="block font-bold leading-tight">{t(`topic.${focus.tp}`)}</span>
            <span className="block text-xs text-ink-soft">{t(`subject.${focus.sub}`)} · {Math.round(focus.acc * 100)}% · {t('st.answers', { n: focus.a })}</span>
          </span>
          <span className="rounded-lg bg-redpen text-white text-xs font-bold px-2.5 py-1.5 shrink-0">{t('st.practise')}</span>
        </Link>
      )}
      {!anyData && <p className="mt-2.5 text-sm text-ink-soft">{t('st.needMore')}</p>}

      {anyData && info.map(({ sub, strong, weak, untried, total }) => (
        <div key={sub} className="mt-3.5">
          <div className="flex items-center gap-1.5">
            <span aria-hidden="true">{SUBJECTS[sub].emoji}</span>
            <h3 className="font-bold text-sm flex-1">{t(`subject.${sub}`)}</h3>
          </div>
          {/* one bar: known / to practise / not tried */}
          <div className="mt-1.5 flex h-2.5 rounded-full overflow-hidden bg-line">
            <span className="bg-ok" style={{ width: `${(strong.length / total) * 100}%` }} />
            <span className="bg-redpen" style={{ width: `${(weak.length / total) * 100}%` }} />
          </div>
          <p className="mt-1 text-[11px] text-ink-soft">{t('st.sumLine', { s: strong.length, w: weak.length, u: untried.length })}</p>

          {weak.length === 0 && untried.length === 0 && <p className="mt-1.5 text-xs font-bold text-ok">{t('st.allGood')}</p>}
          <div className="mt-1.5 space-y-1.5">
            {weak.slice(0, 4).map((r) => (
              <Link key={r.tp} to={topicLink(sub, r.tp)} className="flex items-center gap-2.5 rounded-xl border border-line px-2.5 py-2 hover:border-pen">
                <span className="w-6 text-center" aria-hidden="true">{TOPIC_EMOJI[r.tp]}</span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-bold leading-tight truncate">{t(`topic.${r.tp}`)}</span>
                  <span className="mt-1 flex items-center gap-2">
                    <span className="flex-1"><Bar value={r.acc} className={r.acc >= 0.4 ? 'bg-marker' : 'bg-redpen'} /></span>
                    <span className="text-[11px] tabular font-bold text-redpen">{Math.round(r.acc * 100)}%</span>
                  </span>
                  {r.miss > 0 && <span className="block text-[11px] text-ink-soft">{t('st.mistakesN', { n: r.miss })}</span>}
                </span>
                <ChevronRight className="w-4 h-4 text-ink-soft rtl:rotate-180" />
              </Link>
            ))}
            {untried.length > 0 && (
              <div className="pt-0.5">
                <p className="text-[11px] font-bold text-ink-soft mb-1">{t('st.untried')}</p>
                <div className="flex flex-wrap gap-1.5">
                  {untried.slice(0, 6).map((r) => (
                    <Link key={r.tp} to={topicLink(sub, r.tp)} className="inline-flex items-center gap-1 rounded-full border border-dashed border-pen/50 px-2.5 py-1 text-xs font-bold text-pen">
                      <span aria-hidden="true">{TOPIC_EMOJI[r.tp]}</span>{t(`topic.${r.tp}`)}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}

      {mistakes > 0 && (
        <Link to="/play/mistakes?mode=practice" className="mt-3.5 flex items-center gap-2.5 rounded-xl bg-paper border border-line px-3 py-2.5 hover:border-redpen">
          <RotateCcw className="w-4 h-4 text-redpen" />
          <span className="flex-1 text-sm font-bold">{t('home.mistakes')}</span>
          <span className="text-xs text-ink-soft">{t('home.mistakesDesc', { n: mistakes })}</span>
        </Link>
      )}
    </section>
  );
}

export default function Stats() {
  const { settings, t } = useSettings();
  const s = getStats();
  const { grade, curriculum } = settings;
  const mocks = s.history.filter((h) => h.kind === 'mock' && h.grade === grade).slice(0, 20).reverse();
  const avg = mocks.length ? Math.round(mocks.reduce((a, h) => a + h.score, 0) / mocks.length) : null;
  const best = mocks.length ? Math.max(...mocks.map((h) => h.score)) : null;
  const subjects = subjectsFor(curriculum, settings.english);
  const weeks = weeklyTrend(s, 8);
  const j = journey(s);
  const since = settings.startedAt || j.firstAt;

  const topicRows = useMemo(() => subjects.flatMap((sub) => topicsFor(sub, grade).map((tp) => ({ sub, tp, acc: topicAccuracy(s, sub, grade, tp) }))), [s, grade, subjects.join()]);
  const badges = badgeProgress(s, grade, curriculum);
  const info = insights(s, grade, curriculum);

  return (
    <AppShell header={<PageTitle>{t('st.title')}</PageTitle>}>
      <Wins s={s} badges={badges} info={info} t={t} />
      <Learn info={info} mistakes={s.mistakes.length} t={t} />

      {/* the child's journey since the first day */}
      <section className="sheet mt-3 p-3.5">
        <div className="flex items-center gap-2">
          <Sprout className="w-5 h-5 text-ok" />
          <h2 className="font-heading font-bold flex-1">{t('st.journey')}</h2>
          {since && <span className="text-xs text-ink-soft">{t('st.since', { date: new Date(since).toLocaleDateString(settings.lang) })}</span>}
        </div>
        {settings.startGrade && <p className="text-sm text-ink-soft mt-0.5">{t('st.startedIn', { g: settings.startGrade })}{settings.startGrade !== grade ? ` → ${t('grade.n', { g: grade })}` : ''}</p>}
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-paper border border-line py-2"><CalendarDays className="w-4 h-4 mx-auto text-pen" /><p className="font-heading font-bold text-lg tabular leading-tight">{j.daysActive}</p><p className="text-[11px] text-ink-soft leading-tight">{t('st.daysActive')}</p></div>
          <div className="rounded-xl bg-paper border border-line py-2"><p className="text-pen font-bold leading-4">∑</p><p className="font-heading font-bold text-lg tabular leading-tight">{s.solved}</p><p className="text-[11px] text-ink-soft leading-tight">{t('home.solved')}</p></div>
          <div className="rounded-xl bg-paper border border-line py-2"><Repeat className="w-4 h-4 mx-auto text-pen" /><p className="font-heading font-bold text-lg tabular leading-tight">{j.attempts}</p><p className="text-[11px] text-ink-soft leading-tight">{t('st.attempts')}</p></div>
        </div>
        <div className={cn('mt-3 rounded-xl px-3 py-2 text-sm font-bold flex items-center gap-2', j.gain === null ? 'bg-paper text-ink-soft' : j.gain >= 0 ? 'bg-ok-soft text-ok' : 'bg-marker/25 text-ink')}>
          {j.gain === null ? <TrendingUp className="w-4 h-4" /> : j.gain >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          {j.gain === null ? t('st.gainSoon')
            : j.gain >= 0 ? t('st.gain', { p: Math.round(j.gain * 100), a: Math.round(j.firstAcc * 100), b: Math.round(j.lastAcc * 100) })
              : t('st.loss', { a: Math.round(j.firstAcc * 100), b: Math.round(j.lastAcc * 100) })}
        </div>
        <h3 className="mt-3 text-sm font-bold text-ink-soft">{t('st.trend')}</h3>
        <TrendChart weeks={weeks} t={t} lang={settings.lang} />
      </section>

      <div className="mt-3 grid grid-cols-4 gap-2 text-center">
        {[[t('st.tests'), mocks.length], [t('st.avg'), avg ?? '–'], [t('st.best'), best ?? '–'], [t('home.solved'), s.solved]].map(([label, v]) => (
          <div key={label} className="sheet px-1 py-3">
            <p className="font-heading font-bold text-2xl tabular">{v}</p>
            <p className="text-xs text-ink-soft leading-tight">{label}</p>
          </div>
        ))}
      </div>

      <section className="sheet mt-3 p-3.5">
        <h2 className="font-heading font-bold mb-2">{t('st.history')}</h2>
        {mocks.length ? <ScoreChart points={mocks} /> : <p className="text-ink-soft">{t('st.empty')}</p>}
      </section>

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
          {[...badges].sort((a, b) => b.got - a.got).map((b) => {
            const got = b.got;
            return (
              <div key={b.id} className={cn('sheet p-2.5 flex items-center gap-2.5 min-w-0', !got && 'opacity-70')}>
                <span className={cn('text-2xl shrink-0', !got && 'grayscale')}>{b.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm leading-tight break-words hyphens-auto">{t(`b.${b.id}`)}</p>
                  <p className="text-xs text-ink-soft leading-tight">{t(`b.${b.id}_d`)}</p>
                  {!got && <span className="mt-1 block w-full"><Bar value={b.value / b.goal} className="bg-marker" /></span>}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}
