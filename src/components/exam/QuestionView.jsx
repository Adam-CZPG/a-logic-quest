import { useEffect, useRef } from 'react';
import Figure from './Figure';
import { optionLabel, answerToString, unitSuffix } from '@/exam/checker';
import { cn } from '@/lib/utils';

const LETTERS = 'ABCDEF';

// The teacher's red pen: a hand-drawn tick or cross, "written" when the answer is checked.
export function PenMark({ correct, className }) {
  return (
    <svg viewBox="0 0 48 48" className={cn('w-10 h-10 shrink-0', className)} aria-hidden="true">
      {correct ? (
        <path className="ink-stroke" d="M8 26 C 13 30, 16 34, 19 38 C 25 26, 32 16, 42 8" fill="none" stroke="hsl(var(--ok))" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <>
          <path className="ink-stroke" d="M10 10 C 20 20, 28 28, 38 39" fill="none" stroke="hsl(var(--redpen))" strokeWidth="4.5" strokeLinecap="round" />
          <path className="ink-stroke" style={{ animationDelay: '180ms' }} d="M38 9 C 29 19, 20 29, 10 38" fill="none" stroke="hsl(var(--redpen))" strokeWidth="4.5" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

function Option({ letter, opt, selected, state, disabled, onClick }) {
  const isFigure = opt && typeof opt === 'object' && opt.figure;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'w-full text-start flex items-center gap-3 rounded-2xl border-2 px-4 py-3 transition-colors bg-sheet',
        isFigure && 'flex-col py-3',
        selected && !state && 'border-pen bg-pen-soft',
        !selected && !state && 'border-line hover:border-pen/50',
        state === 'right' && 'border-ok bg-ok-soft',
        state === 'wrong' && 'border-redpen bg-redpen-soft',
        state === 'muted' && 'border-line opacity-60',
      )}
    >
      <span className={cn('font-heading font-bold text-pen', state === 'right' && 'text-ok', state === 'wrong' && 'text-redpen')}>{letter})</span>
      {isFigure ? <Figure figure={opt.figure} /> : <span className="leading-snug">{optionLabel(opt)}</span>}
    </button>
  );
}

function TfRow({ text, value, onChange, disabled, state, t }) {
  return (
    <div className={cn('flex items-center gap-3 rounded-2xl border-2 px-3 py-2.5 bg-sheet', state === 'right' ? 'border-ok/60' : state === 'wrong' ? 'border-redpen/70' : 'border-line')}>
      <p className="flex-1 leading-snug">{text}</p>
      <div className="flex gap-1.5 shrink-0" role="radiogroup">
        {[true, false].map((v) => (
          <button
            key={String(v)}
            type="button"
            role="radio"
            aria-checked={value === v}
            disabled={disabled}
            onClick={() => onChange(v)}
            className={cn(
              'min-w-[3.5rem] rounded-xl border-2 px-2 py-1.5 font-bold text-sm transition-colors',
              value === v ? 'border-pen bg-pen text-on-pen' : 'border-line text-ink-soft hover:border-pen/50',
            )}
          >
            {v ? t('p.yes') : t('p.no')}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function QuestionView({ q, label, value, onChange, locked, feedback, reveal, lang, t, onSubmit }) {
  const inputRef = useRef(null);
  useEffect(() => {
    if ((q.type === 'number' || q.type === 'text') && !locked && window.matchMedia?.('(pointer: fine)').matches) {
      inputRef.current?.focus();
    }
  }, [q.id, locked, q.type]);

  const showTruth = !!(feedback && (feedback.correct || reveal));

  return (
    <article className="space-y-4">
      {q.context && (
        <section className="sheet p-4">
          <h3 className="text-sm font-bold text-ink-soft mb-2">{t('p.context')}</h3>
          <p className="whitespace-pre-line leading-relaxed text-[15.5px]">{q.context}</p>
          {q.source && <p className="text-xs text-ink-soft mt-2 text-end italic">{q.source}</p>}
        </section>
      )}

      <div className="flex items-start gap-3">
        <span className="font-heading font-extrabold text-pen text-lg leading-7 shrink-0">{label}</span>
        <h2 className="flex-1 font-body font-bold text-[17px] leading-7">{q.text}</h2>
        {feedback && <PenMark key={`${q.id}-${feedback.correct}-${feedback.n}`} correct={feedback.correct} />}
      </div>

      {q.expr && (
        <div dir="ltr" className="sheet px-5 py-4 text-center font-heading font-bold text-2xl sm:text-3xl tabular tracking-wide break-words">
          {q.expr}
        </div>
      )}

      {q.figure && (
        <div className="sheet p-4 flex justify-center">
          <Figure figure={q.figure} />
        </div>
      )}

      {q.type === 'choice' && (
        <div className={cn('grid gap-2.5', q.options.some((o) => o && typeof o === 'object') ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-1')}>
          {q.options.map((opt, i) => {
            let state = null;
            if (showTruth) state = i === q.answer ? 'right' : value === i ? 'wrong' : 'muted';
            else if (feedback && !feedback.correct && value === i) state = 'wrong';
            return (
              <Option key={i} letter={LETTERS[i]} opt={opt} selected={value === i} state={state}
                disabled={locked} onClick={() => onChange(i)} />
            );
          })}
        </div>
      )}

      {q.type === 'tf' && (
        <div className="space-y-2">
          {q.statements.map((s, i) => {
            const v = Array.isArray(value) ? value[i] : undefined;
            let state = null;
            if (feedback) state = v === q.answer[i] ? 'right' : (showTruth ? 'wrong' : null);
            return (
              <TfRow key={i} text={`${i + 1}. ${s}`} value={v} disabled={locked} state={state} t={t}
                onChange={(b) => {
                  const next = Array.isArray(value) ? [...value] : Array(q.statements.length).fill(null);
                  next[i] = b;
                  onChange(next);
                }} />
            );
          })}
        </div>
      )}

      {q.type === 'match' && (
        <div className="space-y-2">
          {q.left.map((l, i) => (
            <label key={i} className="flex items-center gap-3 rounded-2xl border-2 border-line bg-sheet px-3 py-2.5">
              <span className="flex-1">{l}</span>
              <select
                disabled={locked}
                value={Array.isArray(value) && value[i] != null ? value[i] : ''}
                onChange={(e) => {
                  const next = Array.isArray(value) ? [...value] : Array(q.left.length).fill(null);
                  next[i] = e.target.value === '' ? null : Number(e.target.value);
                  onChange(next);
                }}
                className="rounded-xl border-2 border-line bg-paper px-2 py-1.5 max-w-[55%]"
              >
                <option value="">{t('p.choose')}</option>
                {q.right.map((r, j) => <option key={j} value={j}>{LETTERS[j]}) {r}</option>)}
              </select>
            </label>
          ))}
        </div>
      )}

      {(q.type === 'number' || q.type === 'text') && (
        <form
          onSubmit={(e) => { e.preventDefault(); onSubmit?.(); }}
          className="flex items-center gap-2.5 flex-wrap"
        >
          {q.prefix && <span className="font-bold">{q.prefix}</span>}
          <input
            ref={inputRef}
            dir="ltr"
            value={value ?? ''}
            disabled={locked}
            onChange={(e) => onChange(e.target.value)}
            inputMode={q.type === 'number' ? 'decimal' : 'text'}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            placeholder={q.placeholder || t('p.answer')}
            aria-label={t('p.answer')}
            className={cn(
              'flex-1 min-w-[9rem] max-w-xs rounded-2xl border-2 bg-sheet px-4 py-3 text-xl font-bold tabular outline-none transition-colors',
              feedback ? (feedback.correct ? 'border-ok' : 'border-redpen') : 'border-line focus:border-pen',
            )}
          />
          {q.unit && <span className="font-bold text-lg">{unitSuffix(q.unit).trim()}</span>}
          <p className="w-full text-xs text-ink-soft">{q.type === 'number' ? t('p.numHint') : t('p.textHint')}</p>
        </form>
      )}

      {feedback && !feedback.correct && reveal && (q.type === 'number' || q.type === 'text' || q.type === 'choice') && (
        <p className="font-bold text-ok">{t('p.correctAnswer', { a: answerToString(q, lang) })}</p>
      )}

      {reveal && q.explain && (
        <aside className="rounded-2xl bg-marker/25 border-2 border-marker/60 px-4 py-3">
          <h4 className="font-heading font-bold mb-1">{t('p.solution')}</h4>
          <p dir="auto" className="tabular">{q.explain}</p>
        </aside>
      )}
    </article>
  );
}
