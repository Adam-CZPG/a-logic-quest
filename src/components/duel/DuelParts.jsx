import { motion, useReducedMotion } from 'framer-motion';
import { LANGS } from '@/i18n';
import { CURRICULA, SUBJECTS } from '@/exam/taxonomy';
import { fmtTime } from '@/lib/duel';
import { cn } from '@/lib/utils';

const langFlag = (code) => LANGS.find((l) => l.code === code)?.flag || '🏳️';

// One player as a sticker: animal, name, country flag + language flag, points and time.
// The child is always blue (pen), the opponent red (red pen) – like correcting in a notebook.
export function Sticker({ player, curriculum, side = 'me', total, winner = false, dim = false, waitingLabel, tilt = 0, small = false }) {
  const ink = side === 'me' ? 'border-pen' : 'border-redpen';
  const ring = side === 'me' ? 'bg-pen-soft' : 'bg-redpen-soft';
  return (
    <div className={cn('relative', small ? 'w-[8.5rem]' : 'w-[9.75rem]')} style={{ transform: `rotate(${tilt}deg)` }}>
      {winner && (
        <motion.span className="absolute -top-7 inset-x-0 text-center text-4xl z-10 drop-shadow" aria-hidden="true"
          initial={{ y: -14, opacity: 0, scale: 0.6 }} animate={{ y: 0, opacity: 1, scale: 1 }} transition={{ delay: 0.9, type: 'spring', stiffness: 260, damping: 12 }}>
          👑
        </motion.span>
      )}
      <div className={cn('rounded-[1.4rem] border-[3px] bg-sheet px-3 pt-3 pb-2.5 text-center shadow-[4px_4px_0_0_hsl(var(--ink)/0.85)]', ink, dim && 'opacity-60 grayscale-[35%]')}>
        <div className={cn('mx-auto rounded-full grid place-items-center leading-none', ring, small ? 'w-16 h-16 text-[2.4rem]' : 'w-20 h-20 text-5xl')} aria-hidden="true">
          {player ? player.v : '❔'}
        </div>
        <p className="mt-2 font-heading font-extrabold text-[17px] leading-tight truncate">{player ? player.n : waitingLabel}</p>
        {player && (() => {
          // the player's own country, plus the interface language when it is a different flag
          const country = CURRICULA[player.c || curriculum]?.flag;
          const lang = player.l ? langFlag(player.l) : null;
          return (
            <p className="mt-0.5 text-lg leading-none" aria-label={`${country || ''} ${player.l || ''}`}>
              <span>{country}</span>
              {lang && lang !== country && <span className="ms-1 text-sm align-middle opacity-90">{lang}</span>}
            </p>
          );
        })()}
        <div className={cn('mt-2 rounded-xl py-1.5 font-heading font-extrabold tabular', side === 'me' ? 'bg-pen text-on-pen' : 'bg-redpen text-white')}>
          {player && player.p !== undefined && player.t ? (
            <>
              <span className="text-2xl">{player.p}</span><span className="text-sm opacity-80">/{total}</span>
              <span className="block text-xs font-bold opacity-90">⏱ {fmtTime(player.t)}</span>
            </>
          ) : (
            <span className="text-2xl">…</span>
          )}
        </div>
      </div>
    </div>
  );
}

// The star-burst "VS" stamp in marker yellow.
export function VsStamp({ size = 74 }) {
  const pts = [];
  for (let i = 0; i < 16; i++) {
    const r = i % 2 ? 0.36 : 0.5;
    const a = (Math.PI * 2 * i) / 16 - Math.PI / 2;
    pts.push(`${50 + r * 100 * Math.cos(a)},${50 + r * 100 * Math.sin(a)}`);
  }
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true" className="drop-shadow-[3px_3px_0_rgba(27,35,64,0.85)]">
      <polygon points={pts.join(' ')} fill="hsl(var(--marker))" stroke="#1B2340" strokeWidth="3" strokeLinejoin="round" />
      <text x="50" y="59" textAnchor="middle" fontSize="27" fontWeight="900" fill="#1B2340" style={{ fontFamily: 'inherit', letterSpacing: '-1px' }}>VS</text>
    </svg>
  );
}

// Two stickers slam in from both sides, the stamp lands in the middle. The only big animation.
export function VsBoard({ me, them, curriculum, total, result, waitingLabel, animate = true }) {
  const reduce = useReducedMotion();
  const go = animate && !reduce;
  return (
    <div className="relative flex items-center justify-center gap-1 pt-8 pb-2">
      <motion.div initial={go ? { x: -120, opacity: 0, rotate: -14 } : false} animate={{ x: 0, opacity: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 220, damping: 18 }}>
        <Sticker player={me} curriculum={curriculum} side="me" total={total} tilt={-4} winner={result === 'me'} dim={result === 'them'} small />
      </motion.div>
      <motion.div className="z-10 -mx-3" initial={go ? { scale: 2.6, opacity: 0, rotate: -30 } : false} animate={{ scale: 1, opacity: 1, rotate: -8 }} transition={{ delay: go ? 0.45 : 0, type: 'spring', stiffness: 320, damping: 14 }}>
        <VsStamp size={68} />
      </motion.div>
      <motion.div initial={go ? { x: 120, opacity: 0, rotate: 14 } : false} animate={{ x: 0, opacity: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 220, damping: 18 }}>
        <Sticker player={them} curriculum={curriculum} side="them" total={total} tilt={4} winner={result === 'them'} dim={result === 'me'} waitingLabel={waitingLabel} small />
      </motion.div>
    </div>
  );
}

export function SubjectChip({ subject, t, grade }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink/80 bg-sheet px-3 py-1 text-sm font-bold">
      <span aria-hidden="true">{SUBJECTS[subject]?.emoji}</span>{t(`subject.${subject}`)}<span className="text-ink-soft font-semibold">· {t('grade.n', { g: grade })}</span>
    </span>
  );
}

// headline for the result
export function verdictKey(result) {
  return result === 'me' ? 'duel.youWon' : result === 'them' ? 'duel.youLost' : result === 'draw' ? 'duel.draw' : 'duel.waiting';
}
