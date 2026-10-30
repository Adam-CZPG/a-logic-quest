import { useRef, useState } from 'react';
import AppShell from '@/components/AppShell';
import { useSettings } from '@/lib/settings';
import { LANGS } from '@/i18n';
import { GRADES, CURRICULA } from '@/exam/taxonomy';
import { resetStats } from '@/exam/stats';
import { getPacks, addPack, removePack, parsePack } from '@/exam/packs';
import { isSoundOn, toggleSound } from '@/lib/sfx';
import { syncReminder, isNative } from '@/lib/native';
import { cn } from '@/lib/utils';
import { Upload, Trash2, Sun, Moon, Monitor } from 'lucide-react';

function Row({ label, children }) {
  return (
    <div className="py-3 flex flex-wrap items-center gap-3 justify-between">
      <span className="font-bold">{label}</span>
      {children}
    </div>
  );
}

function Seg({ value, options, onChange }) {
  return (
    <div className="flex rounded-xl border-2 border-line p-0.5 bg-paper">
      {options.map((o) => (
        <button key={o.v} onClick={() => onChange(o.v)} aria-pressed={value === o.v}
          className={cn('px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1.5', value === o.v ? 'bg-pen text-on-pen' : 'text-ink-soft')}>
          {o.icon}{o.label}
        </button>
      ))}
    </div>
  );
}

export default function Settings() {
  const { settings, update, t } = useSettings();
  const [sound, setSound] = useState(isSoundOn);
  const [packs, setPacks] = useState(getPacks);
  const [msg, setMsg] = useState(null);
  const fileRef = useRef(null);

  async function onFile(e) {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    try {
      const pack = parsePack(await f.text());
      setPacks(addPack(pack));
      setMsg({ ok: true, text: t('set.imported', { n: pack.count }) });
    } catch {
      setMsg({ ok: false, text: t('set.importError') });
    }
  }

  async function setReminder(patch) {
    const reminder = { ...settings.reminder, ...patch };
    update({ reminder });
    await syncReminder(reminder, t);
  }

  return (
    <AppShell>
      <h1 className="font-heading font-extrabold text-3xl">{t('set.title')}</h1>

      <section className="sheet mt-4 px-4 divide-y-2 divide-line">
        <Row label={t('set.lang')}>
          <select value={settings.lang} onChange={(e) => update({ lang: e.target.value })} className="rounded-xl border-2 border-line bg-paper px-3 py-2 font-bold">
            {LANGS.map((l) => <option key={l.code} value={l.code}>{l.flag} {l.name}</option>)}
          </select>
        </Row>
        <Row label={t('set.country')}>
          <Seg value={settings.curriculum} onChange={(v) => update({ curriculum: v })}
            options={Object.values(CURRICULA).map((c) => ({ v: c.id, label: `${c.flag} ${t(c.id === 'cz' ? 'ob.cz' : 'ob.intl')}` }))} />
        </Row>
        <Row label={t('set.grade')}>
          <Seg value={settings.grade} onChange={(v) => update({ grade: v })} options={GRADES.map((g) => ({ v: g, label: `${g}.` }))} />
        </Row>
        <Row label="🌓">
          <Seg value={settings.theme} onChange={(v) => update({ theme: v })} options={[
            { v: 'light', icon: <Sun className="w-4 h-4" />, label: '' },
            { v: 'system', icon: <Monitor className="w-4 h-4" />, label: '' },
            { v: 'dark', icon: <Moon className="w-4 h-4" />, label: '' },
          ]} />
        </Row>
        <Row label={t('set.sound')}>
          <button role="switch" aria-checked={sound} onClick={() => setSound(toggleSound())}
            className={cn('w-14 h-8 rounded-full p-1 transition-colors', sound ? 'bg-pen' : 'bg-line')}>
            <span className={cn('block w-6 h-6 rounded-full bg-white transition-transform', sound && 'translate-x-6 rtl:-translate-x-6')} />
          </button>
        </Row>
        <Row label={t('plan.reminder')}>
          <div className="flex items-center gap-2">
            <input type="time" value={settings.reminder.time} onChange={(e) => setReminder({ time: e.target.value })}
              className="rounded-xl border-2 border-line bg-paper px-2 py-1.5 font-bold tabular" disabled={!settings.reminder.on} />
            <button role="switch" aria-checked={settings.reminder.on} onClick={() => setReminder({ on: !settings.reminder.on })}
              className={cn('w-14 h-8 rounded-full p-1 transition-colors', settings.reminder.on ? 'bg-pen' : 'bg-line')}>
              <span className={cn('block w-6 h-6 rounded-full bg-white transition-transform', settings.reminder.on && 'translate-x-6 rtl:-translate-x-6')} />
            </button>
          </div>
          {settings.reminder.on && <p className="w-full text-sm text-ink-soft -mt-1">{t('plan.reminderDesc', { time: settings.reminder.time })}{!isNative() ? ' (Android)' : ''}</p>}
        </Row>
      </section>

      <section className="sheet mt-4 p-4">
        <h2 className="font-heading font-bold">{t('set.packs')}</h2>
        <p className="text-sm text-ink-soft mt-1">{t('set.packsDesc')}</p>
        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={onFile} />
        <button onClick={() => fileRef.current?.click()} className="mt-3 rounded-xl bg-pen text-on-pen px-4 py-2.5 font-bold flex items-center gap-2">
          <Upload className="w-4 h-4" />{t('set.import')}
        </button>
        {msg && <p className={cn('mt-2 text-sm font-bold', msg.ok ? 'text-ok' : 'text-redpen')}>{msg.text}</p>}
        {packs.length > 0 && (
          <ul className="mt-3 divide-y-2 divide-line">
            {packs.map((p) => (
              <li key={p.id} className="py-2 flex items-center gap-2">
                <span className="flex-1"><b>{p.name}</b> <span className="text-ink-soft text-sm">· {p.count}</span></span>
                <button onClick={() => setPacks(removePack(p.id))} aria-label={t('set.remove')} className="w-9 h-9 rounded-xl grid place-items-center hover:bg-redpen-soft text-redpen">
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="sheet mt-4 p-4">
        <h2 className="font-heading font-bold">{t('set.about')}</h2>
        <p className="text-sm text-ink-soft mt-1">{t('set.disclaimer')}</p>
        <p className="text-sm text-ink-soft mt-2">{t('set.version')} 2.0.0</p>
        <button
          onClick={() => { if (window.confirm(t('set.resetConfirm'))) { resetStats(); setMsg({ ok: true, text: '✓' }); } }}
          className="mt-4 rounded-xl border-2 border-redpen/60 text-redpen px-4 py-2 font-bold"
        >
          {t('set.reset')}
        </button>
      </section>
    </AppShell>
  );
}
