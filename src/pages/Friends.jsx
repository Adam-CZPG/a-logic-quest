import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import AppShell, { PageTitle } from '@/components/AppShell';
import { useSettings } from '@/lib/settings';
import InviteSheet from '@/components/InviteSheet';
import { isJoined, cached as leagueCached, LEAGUES, leave as leaveLeague, MASCOTS, className, refreshUnseen, unseenCheers } from '@/lib/league';
import { record as duelRecord, listDuels } from '@/lib/duel';

// how many duels wait for the child's answer (also shown as a dot on the bottom tab)
function duelTurns() {
  try {
    return listDuels().filter((d) => d.role === 'b' && !d.b).length;
  } catch {
    return 0;
  }
}

// Everything played with other kids lives here: duels, the weekly league, inviting friends.
export default function Friends() {
  const { t } = useSettings();
  const [invite, setInvite] = useState(false);
  const [joined, setJoined] = useState(isJoined);
  const [msg, setMsg] = useState(null);
  const myRow = (leagueCached().league?.rows || []).find((r) => r.me);
  const duels = duelRecord();
  const turns = duelTurns();
  const classes = leagueCached().classes?.rows || [];
  const [unseen, setUnseen] = useState(unseenCheers);
  useEffect(() => {
    if (joined) refreshUnseen().then(setUnseen).catch(() => {});
  }, [joined]);

  return (
    <AppShell header={<PageTitle>{t('fr.title')}</PageTitle>}>
      <p className="text-sm text-ink-soft mb-3">{t('fr.desc')}</p>

      {/* duel – the playful one: a sticker card in marker yellow */}
      <Link to="/duel" className="flex items-center gap-3 rounded-2xl border-[3px] border-[#1B2340] bg-marker text-[#1B2340] p-3.5 shadow-[4px_4px_0_0_rgba(27,35,64,0.85)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-transform" style={{ transform: 'rotate(-0.8deg)' }}>
        <span className="text-4xl" aria-hidden="true">⚔️</span>
        <span className="flex-1 min-w-0">
          <span className="block font-heading font-extrabold text-xl leading-tight">{t('duel.title')}</span>
          <span className="block text-xs font-bold opacity-80">{turns ? t('duel.turns', { n: turns }) : t('duel.homeHint')}</span>
        </span>
        <span className="font-heading font-extrabold text-xl tabular">{duels.win}:{duels.loss}</span>
      </Link>

      {/* my class: ranking, shared goal, class vs class */}
      <Link to={classes.length === 1 ? `/class/${classes[0].code}` : '/classes'} className="mt-3.5 flex items-center gap-3 rounded-2xl border-2 border-ok/50 bg-ok-soft p-3.5 hover:border-ok transition-colors">
        <span className="w-12 h-12 rounded-xl bg-sheet grid place-items-center text-2xl" aria-hidden="true">{classes[0] ? MASCOTS[classes[0].mascot] : '🏫'}</span>
        <span className="flex-1 min-w-0">
          <span className="block font-heading font-bold text-lg leading-tight">{classes[0] ? t('cl.name', { name: classes.map(className).join(', ') }) : t('cl.title')}</span>
          <span className="block text-xs text-ink-soft">{classes[0] ? t('cl.goalShort', { a: classes[0].week_xp, b: classes[0].goal }) : t('cl.homeHint')}</span>
        </span>
        <ChevronRight className="w-5 h-5 text-ink-soft rtl:rotate-180" />
      </Link>

      <Link to="/league" className="sheet mt-2.5 flex items-center gap-3 p-3.5 hover:border-pen transition-colors">
        <span className="w-12 h-12 rounded-xl grid place-items-center text-2xl" style={{ background: LEAGUES[myRow?.league || 1].soft }} aria-hidden="true">{myRow ? LEAGUES[myRow.league].emoji : '🏆'}</span>
        <span className="flex-1 min-w-0">
          <span className="block font-heading font-bold text-lg leading-tight">{t('league.title')}</span>
          <span className="block text-xs text-ink-soft">{joined && myRow ? t('league.homeRank', { r: myRow.rank, xp: myRow.xp }) : t('league.homeHint')}</span>
        </span>
        <ChevronRight className="w-5 h-5 text-ink-soft rtl:rotate-180" />
      </Link>

      <Link to="/league?tab=friends" className="sheet mt-2.5 flex items-center gap-3 p-3.5 hover:border-pen transition-colors">
        <span className="w-12 h-12 rounded-xl bg-pen-soft grid place-items-center text-2xl" aria-hidden="true">👀</span>
        <span className="flex-1 min-w-0">
          <span className="block font-heading font-bold text-lg leading-tight">{t('fr.follow')}</span>
          <span className="block text-xs text-ink-soft">{t('fr.followDesc')}</span>
        </span>
        <ChevronRight className="w-5 h-5 text-ink-soft rtl:rotate-180" />
      </Link>

      <Link to="/cheers" className="sheet mt-2.5 flex items-center gap-3 p-3.5 hover:border-pen transition-colors">
        <span className="relative w-12 h-12 rounded-xl bg-marker/30 grid place-items-center text-2xl" aria-hidden="true">👏
          {unseen > 0 && <span className="absolute -top-1 -end-1 min-w-5 h-5 px-1 rounded-full bg-redpen text-white text-[11px] font-bold grid place-items-center">{unseen}</span>}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block font-heading font-bold text-lg leading-tight">{t('ch.title')}</span>
          <span className="block text-xs text-ink-soft">{unseen > 0 ? t('fr.cheersNew', { n: unseen }) : t('ch.desc')}</span>
        </span>
        <ChevronRight className="w-5 h-5 text-ink-soft rtl:rotate-180" />
      </Link>

      <button onClick={() => setInvite(true)} className="mt-2.5 w-full flex items-center gap-3 rounded-2xl border-2 border-dashed border-pen/50 bg-pen-soft p-3.5 text-start">
        <span className="w-12 h-12 rounded-xl bg-sheet grid place-items-center text-2xl" aria-hidden="true">🤝</span>
        <span className="flex-1 min-w-0">
          <span className="block font-heading font-bold text-lg leading-tight text-pen">{t('invite.title')}</span>
          <span className="block text-xs text-ink-soft">{t('invite.desc')}</span>
        </span>
        <ChevronRight className="w-5 h-5 text-pen rtl:rotate-180" />
      </button>
      <InviteSheet open={invite} onClose={() => setInvite(false)} />

      {joined && (
        <button className="mt-8 mx-auto block text-xs font-bold text-ink-soft underline underline-offset-2" onClick={async () => {
          if (!window.confirm(t('league.leaveConfirm'))) return;
          try {
            await leaveLeague();
            setJoined(false);
            setMsg({ ok: true, text: t('league.left') });
          } catch {
            setMsg({ ok: false, text: t('league.offline') });
          }
        }}>{t('league.leave')}</button>
      )}
      {msg && <p className={`mt-2 text-center text-sm font-bold ${msg.ok ? 'text-ok' : 'text-redpen'}`}>{msg.text}</p>}
    </AppShell>
  );
}
