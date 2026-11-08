import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Share2, Users, Plus, LogIn, X, Heart } from 'lucide-react';
import { useSettings } from '@/lib/settings';
import { AVATARS } from '@/lib/duel';
import {
  isJoined, getMe, MASCOTS, LETTERS, className, createClass, joinClass, leaveClass, kickFromClass,
  loadClasses, classBoard, classVs, cached, loadCheers, CHEERS, follow,
} from '@/lib/league';
import { JoinCard, Flags, Page, useNick } from '@/pages/League';
import { CURRICULA } from '@/exam/taxonomy';
import InviteSheet, { INVITE_URL } from '@/components/InviteSheet';
import CheerSheet from '@/components/CheerSheet';
import { cn } from '@/lib/utils';

const STICKER = 'border-[3px] border-[#1B2340] shadow-[4px_4px_0_0_rgba(27,35,64,0.85)]';

function Header({ title, back = '/friends', right }) {
  return (
    <header className="flex items-center gap-2 py-3">
      <Link to={back} className="w-10 h-10 grid place-items-center rounded-xl hover:bg-pen-soft" aria-label="←"><ArrowLeft className="w-5 h-5 rtl:rotate-180" /></Link>
      <h1 className="font-heading font-extrabold text-2xl flex items-center gap-2 flex-1 min-w-0 truncate">{title}</h1>
      {right}
    </header>
  );
}

function daysLeft(weekEnd) {
  if (!weekEnd) return 0;
  return Math.max(0, Math.ceil((new Date(`${weekEnd}T23:59:59`) - Date.now()) / 86400000));
}

function ClassBadge({ c, className: cls }) {
  return (
    <span className={cn('rounded-2xl bg-marker text-[#1B2340] grid place-items-center font-heading font-extrabold leading-none border-2 border-[#1B2340] shrink-0', cls)}>
      <span className="text-2xl" aria-hidden="true">{MASCOTS[c.mascot] || '⭐'}</span>
      <span className="text-sm mt-0.5">{className(c)}</span>
    </span>
  );
}

// ---------------------------------------------------------------- /classes: my classes, create, join
export function ClassesHome() {
  const { settings, t } = useSettings();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [joined, setJoined] = useState(isJoined);
  const [rows, setRows] = useState(() => cached().classes?.rows || []);
  const [mode, setMode] = useState(params.get('join') ? 'join' : null); // null | 'create' | 'join'
  const [code, setCode] = useState((params.get('join') || '').toUpperCase());
  const [grade, setGrade] = useState(settings.grade);
  const [letter, setLetter] = useState('A');
  const [mascot, setMascot] = useState(0);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setRows(await loadClasses());
    } catch {
      setMsg({ ok: false, text: t('league.offline') });
    }
  }, [t]);
  useEffect(() => { if (joined) refresh(); }, [joined, refresh]);

  const maxGrade = settings.curriculum === 'de' ? 13 : 9;
  const grades = Array.from({ length: maxGrade }, (_, i) => i + 1);

  const create = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const c = await createClass({ grade, letter, mascot });
      await refresh();
      navigate(`/class/${c}?new=1`);
    } catch (e) {
      setMsg({ ok: false, text: String(e.message).includes('400') ? t('cl.limit') : t('league.offline') });
    }
    setBusy(false);
  };
  const join = async (e) => {
    e?.preventDefault();
    const c = code.trim().toUpperCase();
    if (c.length !== 6) return setMsg({ ok: false, text: t('league.badCode') });
    setBusy(true);
    setMsg(null);
    try {
      const r = await joinClass(c);
      if (r === 'ok') {
        await refresh();
        navigate(`/class/${c}`);
      } else if (r === 'notfound') {
        // the same box takes a friend code too
        const ok = await follow(c).catch(() => false);
        setMsg(ok ? { ok: true, text: t('league.followed') } : { ok: false, text: t('cl.notfound') });
      } else setMsg({ ok: false, text: t(r === 'full' ? 'cl.full' : 'cl.limit') });
    } catch {
      setMsg({ ok: false, text: t('league.offline') });
    }
    setBusy(false);
  };

  return (
    <Page>
      <Header title={<><Users className="w-6 h-6 text-pen" />{t('cl.title')}</>} />
      {!joined ? <JoinCard onJoined={() => setJoined(true)} /> : (
        <>
          <p className="text-sm text-ink-soft">{t('cl.desc')}</p>

          {rows.length > 0 && (
            <ul className="mt-4 space-y-2.5">
              {rows.map((c) => (
                <li key={c.code}>
                  <Link to={`/class/${c.code}`} className="sheet flex items-center gap-3 p-3 hover:border-pen">
                    <ClassBadge c={c} className="w-14 h-14" />
                    <span className="flex-1 min-w-0">
                      <span className="block font-heading font-bold text-lg leading-tight">{t('cl.name', { name: className(c) })} {CURRICULA[c.country]?.flag}</span>
                      <span className="block text-xs text-ink-soft">{t('cl.members', { n: c.members })}{c.vs_rank ? ` · 🏁 ${t('cl.vsRank', { r: c.vs_rank, n: c.vs_total })}` : ''}</span>
                      <span className="mt-1.5 block h-2 rounded-full bg-line overflow-hidden">
                        <span className="block h-full bg-ok rounded-full" style={{ width: `${Math.min(100, (c.week_xp / Math.max(1, c.goal)) * 100)}%` }} />
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {rows.length === 0 && !mode && <p className="sheet mt-4 p-4 text-sm text-ink-soft">{t('cl.none')}</p>}

          {rows.length < 3 && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button onClick={() => { setMode('join'); setMsg(null); }} className={cn('rounded-2xl py-3 font-bold flex items-center justify-center gap-2 border-2', mode === 'join' ? 'border-pen bg-pen-soft text-pen' : 'border-line bg-sheet')}>
                <LogIn className="w-4 h-4" />{t('cl.join')}
              </button>
              <button onClick={() => { setMode('create'); setMsg(null); }} className={cn('rounded-2xl py-3 font-bold flex items-center justify-center gap-2 border-2', mode === 'create' ? 'border-pen bg-pen-soft text-pen' : 'border-line bg-sheet')}>
                <Plus className="w-4 h-4" />{t('cl.create')}
              </button>
            </div>
          )}

          {mode === 'join' && (
            <form onSubmit={join} className="mt-3 flex gap-2">
              <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))} placeholder={t('cl.codePh')} aria-label={t('cl.codePh')}
                autoCapitalize="characters" autoComplete="off" spellCheck={false} autoFocus
                className="flex-1 min-w-0 rounded-xl border-2 border-line bg-sheet px-3 py-3 font-heading font-extrabold tracking-[0.2em] uppercase" />
              <button disabled={busy} className="rounded-xl bg-ok text-white px-4 font-bold disabled:opacity-60">{t('cl.joinBtn')}</button>
            </form>
          )}

          {mode === 'create' && (
            <section className="sheet mt-3 p-3.5">
              <p className="text-sm font-bold">{t('set.grade')}</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {grades.map((g) => (
                  <button key={g} onClick={() => setGrade(g)} aria-pressed={grade === g} className={cn('w-10 h-10 rounded-xl border-2 font-heading font-extrabold', grade === g ? 'border-pen bg-pen text-on-pen' : 'border-line')}>{g}</button>
                ))}
              </div>
              <p className="mt-3 text-sm font-bold">{t('cl.letter')}</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {LETTERS.map((l) => (
                  <button key={l} onClick={() => setLetter(l)} aria-pressed={letter === l} className={cn('w-10 h-10 rounded-xl border-2 font-heading font-extrabold', letter === l ? 'border-pen bg-pen text-on-pen' : 'border-line')}>{l}</button>
                ))}
              </div>
              <p className="mt-3 text-sm font-bold">{t('cl.mascot')}</p>
              <div className="mt-1.5 grid grid-cols-8 gap-1.5">
                {MASCOTS.map((m, i) => (
                  <button key={m} onClick={() => setMascot(i)} aria-pressed={mascot === i} className={cn('aspect-square rounded-xl border-2 text-xl', mascot === i ? 'border-pen bg-pen-soft' : 'border-line')}>{m}</button>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-3">
                <ClassBadge c={{ grade, letter, mascot }} className="w-14 h-14" />
                <button onClick={create} disabled={busy} className={cn('flex-1 rounded-2xl bg-pen text-on-pen py-3.5 font-heading font-extrabold text-lg disabled:opacity-60', STICKER)}>
                  {busy ? '…' : t('cl.createBtn')}
                </button>
              </div>
            </section>
          )}
          {msg && <p className={cn('mt-3 text-sm font-bold', msg.ok ? 'text-ok' : 'text-redpen')}>{msg.text}</p>}
        </>
      )}
    </Page>
  );
}

// ---------------------------------------------------------------- /class/:code
export function ClassView() {
  const { code } = useParams();
  const { t } = useSettings();
  const nick = useNick();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = ['board', 'goal', 'vs'].includes(params.get('tab')) ? params.get('tab') : 'board';
  const [info, setInfo] = useState(() => (cached().classes?.rows || []).find((c) => c.code === code) || null);
  const [board, setBoard] = useState([]);
  const [vs, setVs] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(false);
  const [share, setShare] = useState(params.get('new') === '1');
  const [cheerTo, setCheerTo] = useState(null);

  const refresh = useCallback(async () => {
    setBusy(true);
    try {
      const [mine, b, v] = await Promise.all([loadClasses(), classBoard(code), classVs(code)]);
      const me = mine.find((c) => c.code === code);
      if (!me) return navigate('/classes', { replace: true });
      setInfo(me);
      setBoard(b);
      setVs(v);
      setErr(false);
    } catch {
      setErr(true);
    }
    setBusy(false);
  }, [code, navigate]);
  useEffect(() => { if (isJoined()) refresh(); else navigate('/classes', { replace: true }); }, [refresh, navigate]);

  if (!info) return <Page><Header title="…" back="/classes" /></Page>;

  const left = daysLeft(info.week_end);
  const goalPct = Math.min(1, info.week_xp / Math.max(1, info.goal));
  // most improved: biggest gain on last week (only when someone actually improved)
  const improved = board.filter((r) => r.xp > r.last_xp).sort((a, b) => (b.xp - b.last_xp) - (a.xp - a.last_xp))[0];
  const name = (r) => nick(r.avatar, r.num);
  const cheer = (r) => setCheerTo({ code: r.friend_code, name: name(r), avatar: AVATARS[r.avatar] });

  const leave = async () => {
    if (!window.confirm(t('cl.leaveConfirm'))) return;
    try {
      await leaveClass(code);
      await loadClasses().catch(() => {});
      navigate('/classes', { replace: true });
    } catch {
      setErr(true);
    }
  };
  const kick = async (r) => {
    if (!window.confirm(t('cl.kickConfirm', { name: name(r) }))) return;
    await kickFromClass(code, r.friend_code).catch(() => {});
    refresh();
  };

  return (
    <Page>
      <Header back="/classes" title={<>{MASCOTS[info.mascot]} {t('cl.name', { name: className(info) })}</>}
        right={<button onClick={refresh} aria-label={t('league.refresh')} className="w-10 h-10 rounded-xl grid place-items-center hover:bg-pen-soft"><RefreshCw className={cn('w-5 h-5', busy && 'animate-spin')} /></button>} />

      {/* class code to share with classmates / the teacher */}
      <section className={cn('rounded-[1.4rem] bg-sheet p-3.5 flex items-center gap-3', STICKER)}>
        <ClassBadge c={info} className="w-16 h-16" />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-ink-soft font-bold">{t('cl.codeLbl')} · {t('cl.members', { n: info.members })}</p>
          <p className="font-heading font-extrabold text-2xl tracking-[0.2em]">{info.code}</p>
        </div>
        <button onClick={() => setShare(true)} className="h-11 px-3 rounded-xl bg-pen text-on-pen font-bold flex items-center gap-1.5 text-sm"><Share2 className="w-4 h-4" />{t('league.share')}</button>
      </section>
      {err && <p className="mt-3 text-sm text-redpen font-bold">{t('league.offline')}</p>}

      <div className="mt-4 grid grid-cols-3 gap-1 p-1 rounded-2xl bg-line/60" role="tablist">
        {[['board', `🏅 ${t('cl.tabBoard')}`], ['goal', `🎯 ${t('cl.tabGoal')}`], ['vs', `🏁 ${t('cl.tabVs')}`]].map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => setParams({ tab: id }, { replace: true })}
            className={cn('rounded-xl py-2 text-sm font-bold', tab === id ? 'bg-sheet shadow-sm' : 'text-ink-soft')}>{label}</button>
        ))}
      </div>

      {tab === 'board' && (
        <>
          {improved && (
            <div className="mt-3 rounded-2xl bg-ok-soft border-2 border-ok/40 p-3 flex items-center gap-3">
              <span className="text-3xl" aria-hidden="true">{AVATARS[improved.avatar]}</span>
              <span className="flex-1 min-w-0">
                <span className="block text-[11px] font-extrabold uppercase tracking-wide text-ok">📈 {t('cl.improved')}</span>
                <span className="block font-bold truncate">{name(improved)}{improved.me && <span className="ms-1 text-pen text-xs">({t('league.you')})</span>}</span>
                <span className="block text-xs text-ink-soft">{t('cl.improvedBy', { n: improved.xp - improved.last_xp })}</span>
              </span>
            </div>
          )}
          <p className="text-xs text-ink-soft mt-3 px-1">{t('cl.boardDesc', { d: left })}</p>
          <ol className="mt-2 space-y-1.5">
            {board.map((r, i) => (
              <li key={r.friend_code} className={cn('flex items-center gap-2.5 rounded-2xl border-2 px-3 py-2 bg-sheet', r.me ? 'border-pen bg-pen-soft' : 'border-line')}>
                <span className={cn('w-7 text-center font-heading font-extrabold tabular', i < 3 ? 'text-xl' : 'text-ink-soft')}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</span>
                <span className="text-2xl" aria-hidden="true">{AVATARS[r.avatar]}</span>
                <span className="flex-1 min-w-0">
                  <span className="block font-bold truncate">{name(r)}{r.me && <span className="ms-1 text-pen text-xs">({t('league.you')})</span>}</span>
                  <span className="block text-[11px] text-ink-soft truncate">
                    {r.owner && <>👑 {t('cl.founder')} · </>}
                    {r.i_follow && r.follows_me ? <>🤝 {t('fr.mutual')}</> : <Flags country={r.country} lang={r.lang} />}
                  </span>
                </span>
                <span className="font-heading font-extrabold tabular">{r.xp}<span className="text-[10px] text-ink-soft ms-0.5">XP</span></span>
                {!r.me && (
                  <button onClick={() => cheer(r)} aria-label={t('ch.send')} className="w-9 h-9 rounded-xl grid place-items-center bg-marker/40 hover:bg-marker text-lg">👏</button>
                )}
                {!r.me && info.owner && (
                  <button onClick={() => kick(r)} aria-label={t('cl.kick')} className="w-7 h-9 rounded-lg grid place-items-center text-ink-soft hover:text-redpen"><X className="w-4 h-4" /></button>
                )}
              </li>
            ))}
          </ol>
          {board.length === 1 && <p className="sheet mt-3 p-3 text-sm text-ink-soft">{t('cl.alone')}</p>}
        </>
      )}

      {tab === 'goal' && (
        <section className="mt-3">
          <div className={cn('rounded-[1.4rem] p-4 text-[#1B2340]', STICKER, goalPct >= 1 ? 'bg-[#BDF0CF]' : 'bg-marker')}>
            <p className="font-heading font-extrabold text-xl">{t('cl.goalTitle')}</p>
            <p className="text-sm font-bold opacity-80">{t('cl.goalDesc')}</p>
            <div className="mt-3 h-5 rounded-full bg-white/70 border-2 border-[#1B2340] overflow-hidden">
              <div className="h-full bg-[#1FAA59] transition-all" style={{ width: `${Math.max(3, goalPct * 100)}%` }} />
            </div>
            <p className="mt-2 font-heading font-extrabold text-2xl tabular">{info.week_xp} / {info.goal} XP</p>
            <p className="text-sm font-bold">{goalPct >= 1 ? t('cl.goalDone') : t('cl.goalLeft', { n: info.goal - info.week_xp, d: left })}</p>
          </div>
          <h3 className="mt-4 mb-2 font-heading font-bold">{t('cl.contrib')}</h3>
          <ul className="space-y-1.5">
            {board.map((r) => (
              <li key={r.friend_code} className="flex items-center gap-2.5 rounded-xl border border-line bg-sheet px-3 py-2">
                <span className="text-xl" aria-hidden="true">{AVATARS[r.avatar]}</span>
                <span className="w-28 truncate text-sm font-bold">{name(r)}</span>
                <span className="flex-1 h-2.5 rounded-full bg-line overflow-hidden">
                  <span className={cn('block h-full rounded-full', r.me ? 'bg-pen' : 'bg-ok')} style={{ width: `${Math.min(100, (r.xp / 300) * 100)}%` }} />
                </span>
                <span className="w-12 text-end text-xs tabular font-bold">{r.xp}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-ink-soft px-1">{t('cl.goalRule')}</p>
        </section>
      )}

      {tab === 'vs' && (
        <section className="mt-3">
          <p className="text-xs text-ink-soft px-1">{t('cl.vsDesc', { g: info.grade })}</p>
          {info.members < 3 && <p className="sheet mt-2 p-3 text-sm font-bold text-redpen">{t('cl.vsSmall')}</p>}
          <ol className="mt-2 space-y-1.5">
            {vs.map((r) => (
              <li key={`${r.rank}-${r.letter}-${r.mascot}`} className={cn('flex items-center gap-3 rounded-2xl border-2 px-3 py-2 bg-sheet', r.mine ? 'border-pen bg-pen-soft shadow-[3px_3px_0_0_hsl(var(--pen))]' : 'border-line')}>
                <span className={cn('w-7 text-center font-heading font-extrabold tabular', r.rank <= 3 ? 'text-xl' : 'text-ink-soft')}>{r.rank === 1 ? '🥇' : r.rank === 2 ? '🥈' : r.rank === 3 ? '🥉' : r.rank}</span>
                <span className="text-2xl" aria-hidden="true">{MASCOTS[r.mascot]}</span>
                <span className="flex-1 min-w-0">
                  <span className="block font-bold">{className(r)}{r.mine && <span className="ms-1 text-pen text-xs">({t('cl.ours')})</span>}</span>
                  <span className="block text-[11px] text-ink-soft">{t('cl.members', { n: r.members })}</span>
                </span>
                <span className="font-heading font-extrabold tabular text-end leading-tight">{r.avg_xp}<span className="block text-[10px] text-ink-soft font-bold">{t('cl.avg')}</span></span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <button onClick={leave} className="mt-8 mx-auto block text-xs font-bold text-ink-soft underline underline-offset-2">{t('cl.leave')}</button>

      <InviteSheet open={share} onClose={() => { setShare(false); if (params.get('new')) setParams({ tab }, { replace: true }); }}
        title={t('cl.shareTitle')} desc={t('cl.shareDesc')} text={t('cl.shareMsg', { name: className(info), code: info.code })} url={INVITE_URL} />
      <CheerSheet to={cheerTo} onClose={() => setCheerTo(null)} />
    </Page>
  );
}

// ---------------------------------------------------------------- /cheers: received cheers
export function CheersInbox() {
  const { settings, t } = useSettings();
  const nick = useNick();
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState(false);
  const [cheerTo, setCheerTo] = useState(null);
  useEffect(() => {
    if (!isJoined()) return setRows([]);
    loadCheers().then(setRows).catch(() => { setErr(true); setRows([]); });
  }, []);
  const when = (at) => new Date(at).toLocaleDateString(settings.lang, { day: 'numeric', month: 'numeric' });

  return (
    <Page>
      <Header title={<><Heart className="w-6 h-6 text-redpen" />{t('ch.title')}</>} />
      <p className="text-sm text-ink-soft">{t('ch.desc')}</p>
      {err && <p className="mt-3 text-sm text-redpen font-bold">{t('league.offline')}</p>}
      {rows && rows.length === 0 && !err && <p className="sheet mt-4 p-4 text-sm text-ink-soft">{t('ch.empty')}</p>}
      <ul className="mt-4 space-y-2">
        {(rows || []).map((r, i) => (
          <li key={i} className={cn('flex items-center gap-3 rounded-2xl border-2 bg-sheet px-3 py-2.5', r.seen ? 'border-line' : 'border-marker bg-marker/15')}>
            <span className="text-3xl" aria-hidden="true">{AVATARS[r.avatar]}</span>
            <span className="flex-1 min-w-0">
              <span className="block text-xs text-ink-soft font-bold">{nick(r.avatar, r.num)} · {when(r.at)}</span>
              <span className="block font-heading font-bold text-lg leading-tight">{CHEERS[r.phrase]} {t(`ch.p${r.phrase}`)}</span>
            </span>
            <button onClick={() => setCheerTo({ code: r.code, name: nick(r.avatar, r.num), avatar: AVATARS[r.avatar] })} aria-label={t('ch.send')}
              className="w-10 h-10 rounded-xl grid place-items-center bg-marker/40 hover:bg-marker text-lg">↩︎</button>
          </li>
        ))}
      </ul>
      <CheerSheet to={cheerTo} onClose={() => setCheerTo(null)} />
    </Page>
  );
}

export const myCode = () => getMe()?.code;
