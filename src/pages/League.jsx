import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, UserPlus, X, RefreshCw, Share2 } from 'lucide-react';
import { useSettings } from '@/lib/settings';
import { LANGS } from '@/i18n';
import { CURRICULA } from '@/exam/taxonomy';
import { AVATARS } from '@/lib/duel';
import {
  LEAGUES, getMe, isJoined, join, loadLeague, loadFriends, cached, follow, unfollow, friendLink, VALID_CODE,
  setPendingFollow, takePendingFollow, updateProfile,
} from '@/lib/league';
import { useMe } from '@/pages/Duel';
import InviteSheet, { INVITE_URL } from '@/components/InviteSheet';
import { WEB_ONLY } from '@/pages/Duel';
import { openExternal } from '@/lib/native';
import { cn } from '@/lib/utils';

const langFlag = (code) => LANGS.find((l) => l.code === code)?.flag || '';

// "Liška 427" in the viewer's own language – no names typed by children anywhere
export function useNick() {
  const { t } = useSettings();
  const animals = t('animals');
  return (avatar, num) => `${Array.isArray(animals) ? animals[avatar] || '' : ''} ${num}`;
}

function Flags({ country, lang }) {
  const c = CURRICULA[country]?.flag;
  const l = langFlag(lang);
  return <span className="text-base leading-none whitespace-nowrap">{c}{l && l !== c && <span className="ms-0.5 text-xs align-middle">{l}</span>}</span>;
}

function Page({ children }) {
  return <div className="paper min-h-screen"><div className="max-w-md mx-auto px-4 pb-24" style={{ paddingTop: 'var(--safe-top)' }}>{children}</div></div>;
}

function daysLeft(weekEnd) {
  if (!weekEnd) return null;
  const end = new Date(`${weekEnd}T23:59:59`);
  return Math.max(0, Math.ceil((end - Date.now()) / 86400000));
}

// ---------------------------------------------------------------- opt-in
function JoinCard({ onJoined }) {
  const { settings, t } = useSettings();
  const { avatar } = useMe();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(false);
  const go = async () => {
    setBusy(true);
    setErr(false);
    try {
      await join({ avatar, country: settings.curriculum, lang: settings.lang });
      onJoined();
    } catch {
      setErr(true);
    }
    setBusy(false);
  };
  return (
    <section className="text-center mt-4">
      <div className="mx-auto w-28 h-28 rounded-full grid place-items-center text-6xl border-[3px] border-[#1B2340] shadow-[4px_4px_0_0_rgba(27,35,64,0.85)]" style={{ background: LEAGUES[1].soft }} aria-hidden="true">🏆</div>
      <h2 className="mt-5 font-heading font-extrabold text-3xl leading-tight">{t('league.joinTitle')}</h2>
      <p className="mt-2 text-ink-soft">{t('league.joinDesc')}</p>
      <ul className="sheet mt-5 p-4 text-start space-y-2.5 text-sm">
        <li className="flex gap-2"><span aria-hidden="true">{avatar}</span><span>{t('league.privacy1')}</span></li>
        <li className="flex gap-2"><span aria-hidden="true">🙈</span><span>{t('league.privacy2')}</span></li>
        <li className="flex gap-2"><span aria-hidden="true">🗑️</span><span>{t('league.privacy3')}</span></li>
      </ul>
      <button onClick={go} disabled={busy} className="mt-5 w-full rounded-2xl bg-pen text-on-pen py-4 font-heading font-extrabold text-xl shadow-[4px_4px_0_0_rgba(27,35,64,0.85)] disabled:opacity-60">
        {busy ? '…' : `🏆 ${t('league.join')}`}
      </button>
      {err && <p className="mt-3 text-sm text-redpen font-bold">{t('league.offline')}</p>}
    </section>
  );
}

// ---------------------------------------------------------------- league table
function LeagueTab() {
  const { t } = useSettings();
  const nick = useNick();
  const [data, setData] = useState(() => cached().league || null);
  const [err, setErr] = useState(false);
  const [busy, setBusy] = useState(false);
  const refresh = useCallback(async () => {
    setBusy(true);
    try {
      setData(await loadLeague());
      setErr(false);
    } catch {
      setErr(true);
    }
    setBusy(false);
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const rows = data?.rows || [];
  const lg = LEAGUES[rows[0]?.league || 1];
  const n = rows.length;
  const left = daysLeft(rows[0]?.week_end);

  return (
    <>
      <section className="rounded-[1.4rem] border-[3px] border-[#1B2340] p-4 flex items-center gap-4 shadow-[4px_4px_0_0_rgba(27,35,64,0.85)]" style={{ background: lg.soft, color: '#1B2340' }}>
        <span className="text-5xl" aria-hidden="true">{lg.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="font-heading font-extrabold text-2xl leading-tight">{t(`league.l${lg.id}`)}</p>
          <p className="text-sm font-bold opacity-80">{left === null ? t('league.week') : t('league.endsIn', { n: left })}</p>
        </div>
        <button onClick={refresh} aria-label={t('league.refresh')} className="w-10 h-10 rounded-xl grid place-items-center hover:bg-white/50">
          <RefreshCw className={cn('w-5 h-5', busy && 'animate-spin')} />
        </button>
      </section>
      <p className="text-xs text-ink-soft mt-2 px-1">{t('league.rules')}</p>
      {err && <p className="mt-3 text-sm text-redpen font-bold">{t('league.offline')}</p>}

      <ol className="mt-3 space-y-1.5">
        {rows.map((r, i) => {
          const up = i < 7 && lg.id < 5 && r.xp > 0;
          const down = n >= 10 && i >= n - 5 && lg.id > 1;
          return (
            <li key={`${r.rank}-${r.num}-${r.avatar}`}>
              {i === 7 && lg.id < 5 && <p className="text-[11px] font-extrabold text-ok text-center py-1">▲ {t('league.upZone')}</p>}
              {n >= 10 && i === n - 5 && lg.id > 1 && <p className="text-[11px] font-extrabold text-redpen text-center py-1">▼ {t('league.downZone')}</p>}
              <motion.div initial={false} className={cn('flex items-center gap-3 rounded-2xl border-2 px-3 py-2 bg-sheet', r.me ? 'border-pen bg-pen-soft shadow-[3px_3px_0_0_hsl(var(--pen))]' : 'border-line', up && !r.me && 'border-ok/50', down && !r.me && 'border-redpen/40')}>
                <span className={cn('w-7 text-center font-heading font-extrabold tabular', i < 3 ? 'text-xl' : 'text-ink-soft')}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : r.rank}
                </span>
                <span className="text-2xl" aria-hidden="true">{AVATARS[r.avatar]}</span>
                <span className="flex-1 min-w-0 font-bold truncate">{nick(r.avatar, r.num)}{r.me && <span className="ms-1 text-pen text-xs">({t('league.you')})</span>}</span>
                <Flags country={r.country} lang={r.lang} />
                <span className="w-14 text-end font-heading font-extrabold tabular">{r.xp}<span className="text-[10px] text-ink-soft ms-0.5">XP</span></span>
              </motion.div>
            </li>
          );
        })}
      </ol>
      {n === 1 && <p className="sheet mt-3 p-3 text-sm text-ink-soft">{t('league.alone')}</p>}
    </>
  );
}

// ---------------------------------------------------------------- friends
function FriendsTab() {
  const { t } = useSettings();
  const nick = useNick();
  const me = getMe();
  const { avatar } = useMe();
  const [data, setData] = useState(() => cached().friends || null);
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState(null);
  const [share, setShare] = useState(false);
  const refresh = useCallback(async () => {
    try {
      setData(await loadFriends());
    } catch {
      setMsg({ ok: false, text: t('league.offline') });
    }
  }, [t]);
  useEffect(() => { refresh(); }, [refresh]);

  const add = async (e) => {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    if (!VALID_CODE.test(c)) return setMsg({ ok: false, text: t('league.badCode') });
    if (c === me.code) return setMsg({ ok: false, text: t('league.ownCode') });
    try {
      const ok = await follow(c);
      setMsg(ok ? { ok: true, text: t('league.followed') } : { ok: false, text: t('league.noSuchCode') });
      if (ok) { setCode(''); refresh(); }
    } catch {
      setMsg({ ok: false, text: t('league.offline') });
    }
  };
  const rows = data?.rows || [];
  const followers = rows[0]?.followers ?? null;

  return (
    <>
      {/* my card with my friend code */}
      <section className="rounded-[1.4rem] border-[3px] border-pen bg-sheet p-4 shadow-[4px_4px_0_0_rgba(27,35,64,0.85)]">
        <div className="flex items-center gap-3">
          <span className="w-14 h-14 rounded-full bg-pen-soft grid place-items-center text-3xl" aria-hidden="true">{avatar}</span>
          <div className="flex-1 min-w-0">
            <p className="font-heading font-extrabold text-xl truncate">{nick(AVATARS.indexOf(avatar), me.num)}</p>
            {followers !== null && <p className="text-xs text-ink-soft">{t('league.followers', { n: followers })}</p>}
          </div>
        </div>
        <p className="mt-3 text-sm text-ink-soft">{t('league.myCode')}</p>
        <div className="mt-1 flex items-center gap-2">
          <span className="flex-1 rounded-xl bg-marker text-[#1B2340] text-center font-heading font-extrabold text-3xl tracking-[0.2em] py-2 border-2 border-[#1B2340]">{me.code}</span>
          <button onClick={() => setShare(true)} className="h-14 px-4 rounded-xl bg-pen text-on-pen font-bold flex items-center gap-2"><Share2 className="w-4 h-4" />{t('league.share')}</button>
        </div>
      </section>

      <form onSubmit={add} className="mt-4 flex gap-2">
        <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))} placeholder={t('league.codePh')} aria-label={t('league.codePh')}
          autoCapitalize="characters" autoComplete="off" spellCheck={false}
          className="flex-1 rounded-xl border-2 border-line bg-sheet px-3 py-3 font-heading font-extrabold tracking-[0.2em] uppercase" />
        <button className="rounded-xl bg-ok text-white px-4 font-bold flex items-center gap-1.5"><UserPlus className="w-4 h-4" />{t('league.follow')}</button>
      </form>
      {msg && <p className={cn('mt-2 text-sm font-bold', msg.ok ? 'text-ok' : 'text-redpen')}>{msg.text}</p>}

      <h3 className="mt-6 mb-2 font-heading font-extrabold text-lg">{t('league.following')}</h3>
      {rows.length === 0 ? (
        <p className="sheet p-4 text-sm text-ink-soft">{t('league.noFriends')}</p>
      ) : (
        <ul className="space-y-1.5">
          {rows.map((r) => (
            <li key={r.code} className="flex items-center gap-3 rounded-2xl border-2 border-line bg-sheet px-3 py-2">
              <span className="text-2xl" aria-hidden="true">{AVATARS[r.avatar]}</span>
              <span className="flex-1 min-w-0">
                <span className="block font-bold truncate">{nick(r.avatar, r.num)}</span>
                <span className="block text-xs text-ink-soft">{LEAGUES[r.league]?.emoji} {t(`league.l${r.league}`)} · {r.xp} XP</span>
              </span>
              <Flags country={r.country} lang={r.lang} />
              <button onClick={async () => { await unfollow(r.code).catch(() => {}); refresh(); }} aria-label={t('league.unfollow')} className="w-8 h-8 rounded-lg grid place-items-center text-ink-soft hover:text-redpen hover:bg-redpen-soft">
                <X className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <InviteSheet open={share} onClose={() => setShare(false)} title={t('league.share')} desc={t('league.shareDesc')}
        text={t('league.shareMsg', { code: me.code })} url={friendLink(me.code)} />
    </>
  );
}

// ---------------------------------------------------------------- page: /league
export default function League() {
  const { settings, t } = useSettings();
  const { avatar } = useMe();
  const [params, setParams] = useSearchParams();
  const [joined, setJoined] = useState(isJoined);
  const [note, setNote] = useState(null);
  const tab = params.get('tab') === 'friends' ? 'friends' : 'league';

  // keep animal, country and language up to date on the server
  useEffect(() => {
    if (joined) updateProfile({ avatar, country: settings.curriculum, lang: settings.lang }).catch(() => {});
  }, [joined, avatar, settings.curriculum, settings.lang]);

  // a friend link opened before joining: follow right after joining
  useEffect(() => {
    if (!joined) return;
    const c = takePendingFollow();
    if (c) follow(c).then((ok) => ok && setNote(t('league.followed'))).catch(() => {});
  }, [joined, t]);

  return (
    <Page>
      <header className="flex items-center gap-2 py-3">
        <Link to="/friends" className="w-10 h-10 grid place-items-center rounded-xl hover:bg-pen-soft" aria-label="←"><ArrowLeft className="w-5 h-5 rtl:rotate-180" /></Link>
        <h1 className="font-heading font-extrabold text-2xl flex items-center gap-2"><Trophy className="w-6 h-6 text-[#D9A400]" />{t('league.title')}</h1>
      </header>
      {!joined ? (
        <JoinCard onJoined={() => setJoined(true)} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-line/60 mb-4" role="tablist">
            {[['league', t('league.tabLeague')], ['friends', t('league.tabFriends')]].map(([id, label]) => (
              <button key={id} role="tab" aria-selected={tab === id} onClick={() => setParams({ tab: id }, { replace: true })}
                className={cn('rounded-xl py-2 font-bold', tab === id ? 'bg-sheet shadow-sm' : 'text-ink-soft')}>{label}</button>
            ))}
          </div>
          {note && <p className="mb-3 rounded-xl bg-ok-soft text-ok font-bold px-3 py-2 text-sm">{note}</p>}
          {tab === 'league' ? <LeagueTab /> : <FriendsTab />}
        </>
      )}
    </Page>
  );
}

// a friend's link: /f?c=CODE
export function FollowOpen() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const c = String(params.get('c') || '').toUpperCase();
  useEffect(() => {
    if (WEB_ONLY) return;
    if (VALID_CODE.test(c)) setPendingFollow(c);
    navigate(settings.onboarded ? '/league?tab=friends' : '/welcome', { replace: true });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  if (!WEB_ONLY) return null;
  // the public web page has no leagues: open the app (or get it) to follow this friend
  return <FollowWeb code={c} />;
}

function FollowWeb({ code }) {
  const { t } = useSettings();
  const android = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);
  return (
    <Page>
      <section className="text-center mt-10">
        <div className="mx-auto w-24 h-24 rounded-full grid place-items-center text-5xl bg-pen-soft" aria-hidden="true">🤝</div>
        <h1 className="mt-5 font-heading font-extrabold text-3xl">{t('league.friendInvite')}</h1>
        <p className="mt-2 text-ink-soft">{t('league.friendInviteHint')}</p>
        <p className="mt-4 inline-block rounded-xl bg-marker text-[#1B2340] font-heading font-extrabold text-3xl tracking-[0.2em] px-4 py-2 border-2 border-[#1B2340]">{code}</p>
        {android && (
          <button onClick={() => { window.location.href = `intent://f?c=${code}#Intent;scheme=gbexam;package=com.adamczpg.logicquest;end`; }}
            className="mt-6 w-full rounded-2xl bg-pen text-on-pen py-4 font-heading font-extrabold text-lg">{t('duel.openInApp')}</button>
        )}
        <button onClick={() => openExternal(INVITE_URL)} className="mt-3 w-full rounded-2xl bg-ok text-white py-4 font-heading font-extrabold text-lg">{t('duel.install')}</button>
      </section>
    </Page>
  );
}
