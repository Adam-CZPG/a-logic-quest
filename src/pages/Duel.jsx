import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { ArrowLeft, Swords, Send, Download, Smartphone } from 'lucide-react';
import { useSettings } from '@/lib/settings';
import { CURRICULA, subjectsFor, SUBJECTS } from '@/exam/taxonomy';
import { DUEL_SIZE } from '@/exam/engine';
import {
  AVATARS, listDuels, getDuel, saveDuel, newDuel, decodeDuel, duelLink, outcome, record, setPendingDuel, takePendingDuel, fmtTime, encodeDuel,
} from '@/lib/duel';
import { Sticker, VsBoard, SubjectChip, verdictKey } from '@/components/duel/DuelParts';
import InviteSheet, { INVITE_URL } from '@/components/InviteSheet';
import { openExternal } from '@/lib/native';
import { cn } from '@/lib/utils';

export const WEB_ONLY = import.meta.env.VITE_WEB_DUEL === '1';

// the child as a duel player (name + animal + interface language)
export function useMe() {
  const { settings, update, t } = useSettings();
  const [fallback] = useState(() => AVATARS[Math.floor(Math.random() * AVATARS.length)]);
  const avatar = settings.avatar || fallback;
  // every child gets their own random animal the first time; they can change it any time
  useEffect(() => {
    if (!settings.avatar) update({ avatar: fallback });
  }, [settings.avatar]); // eslint-disable-line react-hooks/exhaustive-deps
  return {
    me: (p, ms) => ({ n: (settings.name || t('duel.player')).slice(0, 20), v: avatar, c: settings.curriculum, l: settings.lang, p, t: ms }),
    avatar, setAvatar: (v) => update({ avatar: v }), name: settings.name || t('duel.player'),
  };
}

function Header({ title, back = '/' }) {
  return (
    <header className="flex items-center gap-2 py-3">
      <Link to={back} className="w-10 h-10 grid place-items-center rounded-xl hover:bg-pen-soft" aria-label="←"><ArrowLeft className="w-5 h-5 rtl:rotate-180" /></Link>
      <h1 className="font-heading font-extrabold text-2xl flex items-center gap-2"><Swords className="w-6 h-6 text-redpen" />{title}</h1>
    </header>
  );
}

function Page({ children }) {
  return <div className="paper min-h-screen"><div className="max-w-md mx-auto px-4 pb-10" style={{ paddingTop: 'var(--safe-top)' }}>{children}</div></div>;
}

// text the challenger sends / the answer sent back
function messages(d, t) {
  const subj = t(`subject.${d.subject}`);
  const flag = CURRICULA[d.curriculum]?.flag || '';
  if (d.role === 'a' || !d.b) return t('duel.challengeMsg', { name: d.a.n, flag, p: d.a.p, n: DUEL_SIZE, time: fmtTime(d.a.t), subject: subj });
  return t('duel.answerMsg', { name: d.b.n, flag, p: d.b.p, n: DUEL_SIZE, time: fmtTime(d.b.t), subject: subj });
}

// a duel link opened before the first-run setup: continue with it right after the setup
export function usePendingDuel() {
  const navigate = useNavigate();
  useEffect(() => {
    const code = takePendingDuel();
    if (code) navigate(`/d?d=${code}`, { replace: true });
  }, [navigate]);
}

// ---------------------------------------------------------------- hub: /duel
export function DuelHub() {
  const { settings, t } = useSettings();
  const navigate = useNavigate();
  const { avatar, setAvatar, name } = useMe();
  const [picking, setPicking] = useState(false);
  const duels = listDuels();
  const rec = record();
  const subjects = subjectsFor(settings.curriculum, settings.english);

  const start = (subject) => {
    const d = newDuel({ subject, grade: settings.grade, curriculum: settings.curriculum });
    saveDuel(d);
    navigate(`/play/duel?id=${d.id}&mode=sim`);
  };

  return (
    <Page>
      <Header title={t('duel.title')} back={WEB_ONLY ? '/' : '/friends'} />

      {/* me: sticker + avatar picker */}
      <section className="flex items-center gap-4 mt-1">
        <button onClick={() => setPicking((v) => !v)} className="shrink-0" aria-label={t('duel.pickAvatar')}>
          <Sticker player={{ n: name, v: avatar, c: settings.curriculum, l: settings.lang }} curriculum={settings.curriculum} side="me" total={DUEL_SIZE} tilt={-3} small />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-ink-soft">{t('duel.record')}</p>
          <p className="font-heading font-extrabold text-5xl tabular leading-none mt-1">
            <span className="text-ok">{rec.win}</span><span className="text-ink-soft mx-1">:</span><span className="text-redpen">{rec.loss}</span>
          </p>
          <p className="text-xs text-ink-soft mt-1">{t('duel.recordHint', { w: rec.win, l: rec.loss, d: rec.draw })}</p>
          <button onClick={() => setPicking((v) => !v)} className="mt-2 text-sm font-bold text-pen underline underline-offset-4">{t('duel.pickAvatar')}</button>
        </div>
      </section>

      {picking && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="sheet mt-4 p-3 grid grid-cols-8 gap-1.5">
          {AVATARS.map((a) => (
            <button key={a} onClick={() => { setAvatar(a); setPicking(false); }} aria-label={a}
              className={cn('aspect-square rounded-xl text-2xl grid place-items-center', a === avatar ? 'bg-pen-soft ring-2 ring-pen' : 'hover:bg-pen-soft')}>
              {a}
            </button>
          ))}
        </motion.div>
      )}

      {/* new duel */}
      <h2 className="mt-7 mb-1 font-heading font-extrabold text-xl">{t('duel.new')}</h2>
      <p className="text-sm text-ink-soft mb-3">{t('duel.newHint', { n: DUEL_SIZE })}</p>
      <div className="grid grid-cols-2 gap-3">
        {subjects.map((sub, i) => (
          <button key={sub} onClick={() => start(sub)}
            className={cn('rounded-2xl border-[3px] border-ink/85 p-3 text-start text-white shadow-[4px_4px_0_0_rgba(27,35,64,0.85)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-transform bg-gradient-to-br', SUBJECTS[sub].gradient)}
            style={{ transform: `rotate(${i % 2 ? 1.2 : -1.2}deg)` }}>
            <span className="text-3xl block" aria-hidden="true">{SUBJECTS[sub].emoji}</span>
            <span className="block font-heading font-extrabold text-lg leading-tight mt-1">{t(`subject.${sub}`)}</span>
            <span className="block text-xs font-bold opacity-90 mt-0.5">⚔️ {t('duel.challenge')}</span>
          </button>
        ))}
      </div>

      {/* history */}
      <h2 className="mt-8 mb-3 font-heading font-extrabold text-xl">{t('duel.history')}</h2>
      {duels.length === 0 ? (
        <p className="sheet p-4 text-sm text-ink-soft">{t('duel.empty')}</p>
      ) : (
        <ul className="space-y-2.5">
          {duels.map((d) => {
            const o = outcome(d);
            const mine = d.role === 'a' ? d.a : d.b;
            const theirs = d.role === 'a' ? d.b : d.a;
            if (!mine && d.role === 'a') return null;
            return (
              <li key={d.id}>
                <Link to={`/duel/${d.id}`} className="sheet flex items-center gap-3 p-3 hover:border-pen">
                  <span className="text-2xl" aria-hidden="true">{mine?.v || '❔'}</span>
                  <span className="text-xs font-extrabold text-ink-soft">VS</span>
                  <span className="text-2xl" aria-hidden="true">{theirs?.v || '❔'}</span>
                  <span className="flex-1 min-w-0">
                    <span className="block font-bold truncate">{theirs?.n || t('duel.waiting')}</span>
                    <span className="block text-xs text-ink-soft">{SUBJECTS[d.subject]?.emoji} {t(`subject.${d.subject}`)} · {mine ? `${mine.p}/${DUEL_SIZE}` : '–'}{theirs ? ` : ${theirs.p}/${DUEL_SIZE}` : ''}</span>
                  </span>
                  <span className={cn('rounded-full px-2.5 py-1 text-xs font-extrabold', o === 'me' ? 'bg-ok text-white' : o === 'them' ? 'bg-redpen text-white' : o === 'draw' ? 'bg-marker text-[#1B2340]' : 'bg-line text-ink-soft')}>
                    {o === 'me' ? '👑' : ''} {t(o ? verdictKey(o) : mine ? 'duel.waiting' : 'duel.yourTurn')}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Page>
  );
}

// ---------------------------------------------------------------- one duel: /duel/:id
export function DuelView() {
  const { id } = useParams();
  const { t } = useSettings();
  const navigate = useNavigate();
  const [share, setShare] = useState(false);
  const d = getDuel(id);
  const o = outcome(d);

  useEffect(() => {
    if (o === 'me') confetti({ particleCount: 140, spread: 90, origin: { y: 0.35 }, colors: ['#1f3fbf', '#ffd84d', '#1f9d6b', '#e0313b'], disableForReducedMotion: true });
  }, [o]);

  if (!d) return <Navigate to={WEB_ONLY ? '/' : '/duel'} replace />;
  const me = d.role === 'a' ? d.a : d.b;
  const them = d.role === 'a' ? d.b : d.a;
  const myTurn = !me;
  const canSend = !!me && (d.role === 'a' ? !d.b : true);

  return (
    <Page>
      <Header title={t('duel.title')} back={WEB_ONLY ? '/' : '/duel'} />
      <div className="text-center"><SubjectChip subject={d.subject} grade={d.grade} t={t} /></div>
      <VsBoard me={me} them={them} curriculum={d.curriculum} total={DUEL_SIZE} result={o} waitingLabel={t('duel.waiting')} />

      <h2 className={cn('mt-4 text-center font-heading font-extrabold text-3xl', o === 'me' ? 'text-ok' : o === 'them' ? 'text-redpen' : '')}>
        {t(o ? verdictKey(o) : myTurn ? 'duel.yourTurn' : 'duel.waiting')}
      </h2>
      <p className="text-center text-ink-soft mt-1 text-sm px-4">
        {o === 'them' ? t('duel.lostHint') : o ? t('duel.rematchHint') : myTurn ? t('duel.yourTurnHint') : t('duel.waitingHint')}
      </p>

      <div className="mt-6 space-y-2.5">
        {myTurn && (
          <button onClick={() => navigate(`/play/duel?id=${d.id}&mode=sim`)} className="w-full rounded-2xl bg-pen text-on-pen py-4 font-heading font-extrabold text-lg shadow-[4px_4px_0_0_rgba(27,35,64,0.85)]">
            ⚔️ {t('duel.accept')}
          </button>
        )}
        {canSend && (
          <button onClick={() => setShare(true)} className="w-full rounded-2xl bg-marker text-[#1B2340] py-4 font-heading font-extrabold text-lg flex items-center justify-center gap-2 border-[3px] border-[#1B2340] shadow-[4px_4px_0_0_rgba(27,35,64,0.85)]">
            <Send className="w-5 h-5" />{d.role === 'a' ? t('duel.send') : t('duel.sendBack')}
          </button>
        )}
        {o && !WEB_ONLY && (
          <Link to="/duel" className="block w-full text-center rounded-2xl border-2 border-line bg-sheet py-3 font-bold">{t('duel.again')}</Link>
        )}
        {WEB_ONLY && <InstallCard t={t} />}
      </div>

      {me && (
        <InviteSheet open={share} onClose={() => setShare(false)} title={d.role === 'a' ? t('duel.send') : t('duel.sendBack')} desc={t('duel.sendDesc')}
          text={messages(d, t)} url={duelLink(d)} />
      )}
    </Page>
  );
}

// ---------------------------------------------------------------- a link was opened: /d?d=…
export function DuelOpen() {
  const [params] = useSearchParams();
  const { settings, t } = useSettings();
  const navigate = useNavigate();
  const code = params.get('d') || '';
  const incoming = useMemo(() => decodeDuel(code), [code]);
  const local = incoming ? getDuel(incoming.id) : null;

  useEffect(() => {
    if (!incoming) return;
    if (!settings.onboarded) {
      // first the child sets up the app, then the duel opens by itself
      setPendingDuel(code);
      navigate('/welcome', { replace: true });
      return;
    }
    if (local) {
      // my own challenge came back with the friend's result
      if (local.role === 'a' && incoming.b && !local.b) saveDuel({ ...local, b: incoming.b });
      navigate(`/duel/${incoming.id}`, { replace: true });
    }
  }, [incoming, local, settings.onboarded]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!incoming) {
    return (
      <Page>
        <Header title={t('duel.title')} />
        <p className="sheet p-4">{t('duel.badLink')}</p>
      </Page>
    );
  }
  if (local || !settings.onboarded) return null;

  // someone else's finished duel (forwarded link): just show it
  if (incoming.b) {
    return (
      <Page>
        <Header title={t('duel.title')} />
        <div className="text-center"><SubjectChip subject={incoming.subject} grade={incoming.grade} t={t} /></div>
        <VsBoard me={incoming.a} them={incoming.b} curriculum={incoming.curriculum} total={DUEL_SIZE} result={outcome({ ...incoming, role: 'a' })} />
      </Page>
    );
  }

  const accept = () => {
    saveDuel({ ...incoming, role: 'b', b: null });
    navigate(`/play/duel?id=${incoming.id}&mode=sim`);
  };
  const intent = `intent://d?d=${encodeDuel(incoming)}#Intent;scheme=gbexam;package=com.gbline.gbexam;end`;
  const android = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);

  return (
    <Page>
      <Header title={t('duel.title')} />
      <section className="text-center mt-2">
        <div className="flex justify-center"><Sticker player={incoming.a} curriculum={incoming.curriculum} side="them" total={DUEL_SIZE} tilt={3} /></div>
        <h2 className="mt-5 font-heading font-extrabold text-3xl leading-tight">{t('duel.invited', { name: incoming.a.n })}</h2>
        <div className="mt-3"><SubjectChip subject={incoming.subject} grade={incoming.grade} t={t} /></div>
        <p className="mt-3 text-ink-soft px-2">{t('duel.invitedHint', { n: DUEL_SIZE, p: incoming.a.p, time: fmtTime(incoming.a.t) })}</p>
      </section>
      <button onClick={accept} className="mt-6 w-full rounded-2xl bg-pen text-on-pen py-4 font-heading font-extrabold text-xl shadow-[4px_4px_0_0_rgba(27,35,64,0.85)]">
        ⚔️ {t('duel.accept')}
      </button>
      {WEB_ONLY && android && (
        <button onClick={() => { window.location.href = intent; }} className="mt-2.5 w-full rounded-2xl border-2 border-line bg-sheet py-3 font-bold flex items-center justify-center gap-2">
          <Smartphone className="w-4 h-4" />{t('duel.openInApp')}
        </button>
      )}
    </Page>
  );
}

function InstallCard({ t }) {
  return (
    <div className="sheet p-4 text-center">
      <p className="font-heading font-extrabold text-lg">{t('duel.installTitle')}</p>
      <p className="text-sm text-ink-soft mt-1">{t('duel.installHint')}</p>
      <button onClick={() => openExternal(INVITE_URL)} className="mt-3 w-full rounded-xl bg-ok text-white py-3 font-bold flex items-center justify-center gap-2">
        <Download className="w-4 h-4" />{t('duel.install')}
      </button>
    </div>
  );
}

// the web page (duel links) has only duels: its start screen
export function WebHome() {
  const { t } = useSettings();
  usePendingDuel();
  const duels = listDuels();
  return (
    <Page>
      <Header title={t('duel.title')} />
      <div className="mt-2"><InstallCard t={t} /></div>
      {duels.length > 0 && (
        <ul className="space-y-2 mt-6">
          {duels.map((d) => (
            <li key={d.id}><Link to={`/duel/${d.id}`} className="sheet block p-3 font-bold">{SUBJECTS[d.subject]?.emoji} {t(`subject.${d.subject}`)} – {d.a?.n} vs {d.b?.n || '…'}</Link></li>
          ))}
        </ul>
      )}
    </Page>
  );
}
