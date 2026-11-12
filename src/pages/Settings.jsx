import { useState } from 'react';
import AppShell, { PageTitle } from '@/components/AppShell';
import { Avatar } from '@/pages/Home';
import { useSettings } from '@/lib/settings';
import { LANGS } from '@/i18n';
import { CURRICULA, DE_STATES, gradesFor, fitGrade } from '@/exam/taxonomy';
import { resetStats } from '@/exam/stats';
import { isSoundOn, toggleSound } from '@/lib/sfx';
import { syncReminder, isNative } from '@/lib/native';
import { cn } from '@/lib/utils';
import { usePremium, restorePremium } from '@/lib/premium';
import PaywallSheet from '@/components/PaywallSheet';
import ContentSummary from '@/components/ContentSummary';
import {
  Sun, Moon, Monitor, Pencil, Check, GraduationCap, Globe2, Languages, Palette,
  Volume2, Bell, RotateCcw, Info, BookOpen, Crown, RefreshCw,
} from 'lucide-react';

function Group({ title, children }) {
  return (
    <section className="mt-5">
      <h2 className="px-1 mb-1.5 text-xs font-bold uppercase tracking-wide text-ink-soft">{title}</h2>
      <div className="sheet divide-y divide-line overflow-hidden">{children}</div>
    </section>
  );
}

function Row({ icon: Icon, label, hint, children, onClick, danger }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag onClick={onClick} className={cn('w-full flex items-center gap-3 px-3.5 py-2.5 text-start', onClick && 'hover:bg-pen-soft/50')}>
      <span className={cn('w-8 h-8 rounded-lg grid place-items-center shrink-0', danger ? 'bg-redpen-soft text-redpen' : 'bg-pen-soft text-pen')}>
        <Icon className="w-4 h-4" />
      </span>
      <span className="flex-1 min-w-0">
        <span className={cn('block font-bold leading-tight', danger && 'text-redpen')}>{label}</span>
        {hint && <span className="block text-xs text-ink-soft leading-snug mt-0.5">{hint}</span>}
      </span>
      {children}
    </Tag>
  );
}

function Seg({ value, options, onChange }) {
  return (
    <div className="flex rounded-xl border border-line p-0.5 bg-paper shrink-0">
      {options.map((o) => (
        <button key={o.v} onClick={() => onChange(o.v)} aria-pressed={value === o.v} aria-label={o.aria}
          className={cn('min-w-[2.25rem] px-2 py-1 rounded-lg text-sm font-bold flex items-center justify-center gap-1', value === o.v ? 'bg-pen text-on-pen' : 'text-ink-soft')}>
          {o.icon}{o.label}
        </button>
      ))}
    </div>
  );
}

function Switch({ on, onClick, label }) {
  return (
    <button role="switch" aria-checked={on} aria-label={label} onClick={onClick}
      className={cn('w-12 h-7 rounded-full p-1 transition-colors shrink-0', on ? 'bg-pen' : 'bg-line')}>
      <span className={cn('block w-5 h-5 rounded-full bg-white transition-transform', on && 'translate-x-5')} />
    </button>
  );
}

export default function Settings() {
  const { settings, update, t } = useSettings();
  const [sound, setSound] = useState(isSoundOn);
  const [msg, setMsg] = useState(null);
  const premium = usePremium();
  const [paywall, setPaywall] = useState(false);
  const [payMsg, setPayMsg] = useState(null);
  const [editing, setEditing] = useState(!settings.name);
  const [draftName, setDraftName] = useState(settings.name || '');

  const since = settings.startedAt ? new Date(settings.startedAt).toLocaleDateString(settings.lang) : null;

  function saveName(e) {
    e?.preventDefault();
    update({ name: draftName.trim().slice(0, 30) });
    setEditing(false);
  }

  async function setReminder(patch) {
    const reminder = { ...settings.reminder, ...patch };
    update({ reminder });
    await syncReminder(reminder, t);
  }

  return (
    <AppShell header={<PageTitle>{t('set.title')}</PageTitle>}>
      {/* profile */}
      <section className="sheet p-3.5 flex items-center gap-3">
        <Avatar name={settings.name} className="w-14 h-14 text-2xl" />
        {editing ? (
          <form onSubmit={saveName} className="flex-1 flex gap-2 min-w-0">
            <input autoFocus value={draftName} onChange={(e) => setDraftName(e.target.value)} maxLength={30} placeholder={t('ob.namePh')} aria-label={t('set.name')}
              className="flex-1 min-w-0 rounded-xl border-2 border-line focus:border-pen outline-none bg-paper px-3 py-2 font-bold" />
            <button type="submit" aria-label={t('set.save')} className="w-10 h-10 rounded-xl bg-pen text-on-pen grid place-items-center shrink-0"><Check className="w-5 h-5" /></button>
          </form>
        ) : (
          <>
            <div className="flex-1 min-w-0">
              <p className="font-heading font-extrabold text-xl leading-tight truncate">{settings.name}</p>
              <p className="text-sm text-ink-soft">{t('grade.n', { g: settings.grade })}{since && <> · {t('set.since', { date: since })}</>}</p>
            </div>
            <button onClick={() => { setDraftName(settings.name); setEditing(true); }} aria-label={t('set.edit')} className="w-10 h-10 rounded-xl border border-line grid place-items-center shrink-0"><Pencil className="w-4 h-4" /></button>
          </>
        )}
      </section>

      <Group title={t('set.learning')}>
        {/* country picks the exam standard (tests, subjects, grades) */}
        <div className="px-3.5 py-2.5">
          <div className="flex items-center gap-3 mb-2">
            <span className="w-8 h-8 rounded-lg grid place-items-center bg-pen-soft text-pen shrink-0"><Globe2 className="w-4 h-4" /></span>
            <span className="min-w-0">
              <span className="block font-bold leading-tight">{t('set.country')}</span>
              <span className="block text-xs text-ink-soft leading-snug mt-0.5">{t('set.countryHint')}</span>
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1.5" role="radiogroup" aria-label={t('set.country')}>
            {Object.values(CURRICULA).map((c) => (
              <button key={c.id} role="radio" aria-checked={settings.curriculum === c.id}
                onClick={() => update({ curriculum: c.id, grade: fitGrade(c.id, settings.grade) })}
                className={cn('flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-sm font-bold text-start', settings.curriculum === c.id ? 'border-pen bg-pen-soft' : 'border-line')}>
                <span className="text-lg" aria-hidden="true">{c.flag}</span>{t(`ob.${c.id}`)}
              </button>
            ))}
          </div>
        </div>
        {CURRICULA[settings.curriculum]?.states && (
          <Row icon={Globe2} label={t('set.state')}>
            <select value={settings.state || ''} onChange={(e) => update({ state: e.target.value || null })} aria-label={t('set.state')}
              className="rounded-xl border-2 border-line bg-paper px-2 py-1.5 text-sm font-bold max-w-[11rem]">
              <option value="">—</option>
              {DE_STATES.map((st) => <option key={st.id} value={st.id}>{st.name}</option>)}
            </select>
          </Row>
        )}
        <Row icon={GraduationCap} label={t('set.grade')}>
          <Seg value={settings.grade} onChange={(v) => update({ grade: v })} options={gradesFor(settings.curriculum).map((g) => ({ v: g, label: `${g}.` }))} />
        </Row>
        {CURRICULA[settings.curriculum]?.optional?.includes('english') && (
          <Row icon={BookOpen} label={`🇬🇧 ${t('set.english')}`} hint={t('set.englishHint')}>
            <Switch on={!!settings.english} label={t('set.english')} onClick={() => update({ english: !settings.english })} />
          </Row>
        )}
      </Group>

      <Group title={t('set.app')}>
        <div className="px-3.5 py-2.5">
          <div className="flex items-center gap-3 mb-2">
            <span className="w-8 h-8 rounded-lg grid place-items-center bg-pen-soft text-pen"><Languages className="w-4 h-4" /></span>
            <span className="font-bold">{t('set.lang')}</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {LANGS.map((l) => (
              <button key={l.code} onClick={() => update({ lang: l.code })} aria-pressed={settings.lang === l.code}
                className={cn('flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-sm font-bold text-start', settings.lang === l.code ? 'border-pen bg-pen-soft' : 'border-line')}>
                <span className="text-lg" aria-hidden="true">{l.flag}</span>{l.name}
              </button>
            ))}
          </div>
        </div>
        <Row icon={Palette} label={t('set.theme')}>
          <Seg value={settings.theme} onChange={(v) => update({ theme: v })} options={[
            { v: 'light', icon: <Sun className="w-4 h-4" />, aria: t('set.themeLight') },
            { v: 'system', icon: <Monitor className="w-4 h-4" />, aria: t('set.themeSystem') },
            { v: 'dark', icon: <Moon className="w-4 h-4" />, aria: t('set.themeDark') },
          ]} />
        </Row>
        <Row icon={Volume2} label={t('set.sound')}>
          <Switch on={sound} onClick={() => setSound(toggleSound())} label={t('set.sound')} />
        </Row>
        <Row icon={Bell} label={t('plan.reminder')} hint={settings.reminder.on ? `${t('plan.reminderDesc', { time: settings.reminder.time })}${!isNative() ? ' (Android)' : ''}` : null}>
          {settings.reminder.on && (
            <input type="time" value={settings.reminder.time} onChange={(e) => setReminder({ time: e.target.value })} aria-label={t('plan.reminder')}
              className="rounded-lg border border-line bg-paper px-1.5 py-1 text-sm font-bold tabular w-[5.5rem]" />
          )}
          <Switch on={settings.reminder.on} onClick={() => setReminder({ on: !settings.reminder.on })} label={t('plan.reminder')} />
        </Row>
      </Group>

      <Group title={t('pay.full')}>
        {premium ? (
          <Row icon={Crown} label={t('pay.active')} hint={t('pay.activeHint')} />
        ) : (
          <Row icon={Crown} label={t('pay.unlock')} hint={t('pay.barHint')} onClick={() => setPaywall(true)} />
        )}
        {!premium && (
          <Row icon={RefreshCw} label={t('pay.restore')} onClick={async () => {
            const r = await restorePremium();
            setPayMsg(r === 'ok' ? { ok: true, text: t('pay.thanks') } : { ok: false, text: t(r === 'none' ? 'pay.noneFound' : 'pay.unavailable') });
          }} />
        )}
        <div className="px-3.5 py-2.5"><ContentSummary /></div>
      </Group>
      {payMsg && <p role="status" className={cn('mt-2 px-1 text-sm font-bold', payMsg.ok ? 'text-ok' : 'text-redpen')}>{payMsg.text}</p>}
      <PaywallSheet open={paywall} onClose={() => setPaywall(false)} />

      <Group title={t('set.data')}>
        <Row icon={RotateCcw} label={t('set.reset')} danger onClick={() => { if (window.confirm(t('set.resetConfirm'))) { resetStats(); setMsg({ ok: true, text: '✓' }); } }} />
      </Group>
      {msg && <p className={cn('mt-2 px-1 text-sm font-bold', msg.ok ? 'text-ok' : 'text-redpen')}>{msg.text}</p>}


      <Group title={t('set.about')}>
        <Row icon={Info} label={`${t('app.name')} ${t('set.version')} ${import.meta.env.APP_VERSION} · © GBLine Technology`} hint={settings.curriculum === 'cz' ? `${t('set.disclaimer')} ${t('cz.standard')}` : t('set.disclaimer')} />
      </Group>
    </AppShell>
  );
}
