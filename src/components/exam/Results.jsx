// The results screen of a test: score, first-try count, topics, fixing and the answer review.
import { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Eye, Home as HomeIcon, RotateCcw } from 'lucide-react';
import { answerToString, optionLabel, unitSuffix } from '@/exam/checker';
import { summarize, finishBonus } from '@/exam/scoring';
import { TOPIC_EMOJI } from '@/exam/taxonomy';
import { PenMark } from '@/components/exam/QuestionView';
import { haptic } from '@/lib/native';
import { cn } from '@/lib/utils';

function responseToString(q, resp, lang, t) {
  if (resp === null || resp === undefined || resp === '') return t('res.empty');
  if (q.type === 'choice') return `${'ABCDEF'[resp]}) ${optionLabel(q.options[resp])}`;
  if (q.type === 'tf') return resp.map((v) => (v === true ? t('p.yes') : v === false ? t('p.no') : '–')).join(' · ');
  if (q.type === 'match') return resp.map((v) => (v == null ? '–' : 'ABCDEF'[v])).join(' · ');
  if (q.type === 'number') return `${resp}${unitSuffix(q.unit)}`;
  return String(resp);
}

function truthToString(q, lang, t) {
  if (q.type === 'tf') return q.answer.map((v) => (v ? t('p.yes') : t('p.no'))).join(' · ');
  if (q.type === 'match') return q.answer.map((v) => 'ABCDEF'[v]).join(' · ');
  return answerToString(q, lang);
}

export default function Results({ set, qs, labels, answers, checks, result, maxPoints, t, lang, onRestart }) {
  const [review, setReview] = useState(false);
  const pct = result.score / maxPoints;
  // everything is counted from first tries, so the counters agree with the big number
  const sum = summarize(qs, checks);
  const correct = sum.firstTry;
  const fixedLater = sum.fixedLater;
  // wrong and skipped tasks of this attempt; a test / set reopens itself in fixing mode
  const wrong = sum.wrong;
  const loc = useLocation();
  const fixHref = (() => {
    if (!['mock', 'topic', 'daily'].includes(set.kind)) return '/play/mistakes?mode=practice';
    const p = new URLSearchParams(loc.search);
    p.set('fix', '1');
    p.set('mode', 'practice');
    p.set('r', String(Date.now() % 100000)); // a fresh link, so a second round of fixing also reopens
    return `${loc.pathname}?${p.toString()}`;
  })();
  const mins = Math.round(result.ms / 60000);
  const verdict = pct >= 0.8 ? t('res.great') : pct >= 0.5 ? t('res.good') : t('res.keep');
  const xp = result.fix ? 0 : sum.xp + (result.counted ? finishBonus(set.kind) : 0);
  const byTopic = sum.byTopic;

  useEffect(() => { haptic(pct >= 0.5 ? 'success' : 'light'); }, []); // eslint-disable-line

  return (
    <div className="paper min-h-screen" style={{ paddingTop: 'var(--safe-top)' }}>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        <section className="sheet p-6 text-center relative overflow-hidden">
          <p className="text-ink-soft font-bold">{t('res.title')}</p>
          <div className="mt-2 flex items-end justify-center gap-2">
            <span className="font-heading font-extrabold text-7xl tabular text-pen leading-none">{result.score}</span>
            <span className="font-heading font-bold text-2xl text-ink-soft mb-1">/ {maxPoints}</span>
          </div>
          <h2 className="font-heading font-bold text-2xl mt-3"><span className="marker px-1">{verdict}</span></h2>
          <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
            <div><p className="text-ink-soft">{t('res.firstTry')}</p><p className="font-bold text-lg tabular">{correct}/{qs.length}</p></div>
            <div><p className="text-ink-soft">{t('res.time')}</p><p className="font-bold text-lg tabular">{mins} min</p></div>
            <div><p className="text-ink-soft">XP</p><p className="font-bold text-lg tabular text-ok">{t('res.xp', { xp })}</p></div>
          </div>
          {fixedLater > 0 && !result.fix && <p className="mt-4 text-sm font-bold text-ink-soft">🛠️ {t('res.fixedNote', { n: fixedLater })}</p>}
          {set.kind === 'mock' && <p className="mt-4 text-sm text-ink-soft">{t('res.pass')}</p>}
        </section>

        {result.roundFinished && (
          <section className="sheet p-4 flex items-center gap-3 border-ok bg-ok-soft">
            <span className="text-3xl" aria-hidden="true">🎉</span>
            <div>
              <p className="font-bold">{t('round.finishedTitle')}</p>
              <p className="text-ink-soft text-sm">{t('round.finishedDesc')}</p>
            </div>
          </section>
        )}
        {!result.counted && (set.kind === 'mock' || set.kind === 'topic') && (
          <p className="text-sm text-ink-soft text-center px-2">{t('round.notCounted')}</p>
        )}

        {result.badges?.length > 0 && (
          <section className="sheet p-4 flex items-center gap-3 border-marker">
            <span className="text-3xl">{result.badges[0].emoji}</span>
            <div>
              <p className="font-bold">{t('res.newBadge')}</p>
              <p className="text-ink-soft">{result.badges.map((b) => t(`b.${b.id}`)).join(', ')}</p>
            </div>
          </section>
        )}

        {Object.keys(byTopic).length > 1 && (
          <section className="sheet p-4 space-y-2.5">
            {Object.entries(byTopic).map(([topic, v]) => (
              <div key={topic}>
                <div className="flex justify-between text-sm gap-3">
                  <span className="min-w-0 break-words">{TOPIC_EMOJI[topic] || '•'} {t(`topic.${topic}`)}</span>
                  <span className="tabular font-bold shrink-0">{v.got}/{v.max}</span>
                </div>
                <div className="h-2 rounded-full bg-line mt-1 overflow-hidden">
                  <div className={cn('h-full rounded-full', v.got / v.max >= 0.7 ? 'bg-ok' : v.got / v.max >= 0.4 ? 'bg-marker' : 'bg-redpen')} style={{ width: `${(v.got / v.max) * 100}%` }} />
                </div>
              </div>
            ))}
          </section>
        )}

        {/* every wrong task goes to the mistakes folder – fix them right away */}
        {wrong > 0 && !set.duelId && (
          <Link to={fixHref}
            className="w-full h-12 rounded-2xl border-[3px] border-[#1B2340] bg-redpen text-white font-heading font-extrabold flex items-center justify-center gap-2 shadow-[3px_3px_0_0_rgba(27,35,64,0.85)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">
            <RotateCcw className="w-5 h-5" />{t('p.fixMistakes', { n: wrong })}
          </Link>
        )}

        <div className="grid grid-cols-3 gap-2">
          <button onClick={() => setReview((r) => !r)} className="rounded-2xl border-2 border-line bg-sheet py-3 font-bold flex flex-col items-center gap-1 text-sm"><Eye className="w-5 h-5" />{t('res.review')}</button>
          <button onClick={onRestart} className="rounded-2xl border-2 border-line bg-sheet py-3 font-bold flex flex-col items-center gap-1 text-sm"><RotateCcw className="w-5 h-5" />{t('res.again')}</button>
          <Link to="/" className="rounded-2xl bg-pen text-on-pen py-3 font-bold flex flex-col items-center gap-1 text-sm"><HomeIcon className="w-5 h-5" />{t('res.home')}</Link>
        </div>

        {review && (
          <section className="space-y-3">
            {qs.map((q, i) => {
              const c = checks[i];
              return (
                <div key={q.id + i} className={cn('sheet p-4 border-s-[6px]', c?.correct ? 'border-s-ok' : c && !c.empty ? 'border-s-redpen' : 'border-s-line')}>
                  <div className="flex items-start gap-2">
                    <span className="font-heading font-extrabold text-pen">{labels[i]}</span>
                    <p className="flex-1 font-bold leading-snug">{q.text}{q.expr ? ` ${q.expr}` : ''}</p>
                    <PenMark correct={!!c?.correct} className="w-8 h-8" />
                  </div>
                  <p className="mt-2 text-sm"><span className="text-ink-soft">{t('res.yourAnswer')}: </span><span className={c?.correct ? 'text-ok font-bold' : 'text-redpen font-bold'}>{responseToString(q, answers[i], lang, t)}</span></p>
                  {!c?.correct && <p className="text-sm"><span className="text-ink-soft">{t('p.correctAnswer', { a: '' })}</span><span className="font-bold text-ok">{truthToString(q, lang, t)}</span></p>}
                  {q.explain && <p className="mt-1 text-sm text-ink-soft tabular" dir="auto">{q.explain}</p>}
                </div>
              );
            })}
          </section>
        )}
      </div>
    </div>
  );
}
