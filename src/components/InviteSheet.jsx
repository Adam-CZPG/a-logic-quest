import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Copy, Check, Share2, MessageSquare, Send, MessageCircle, Phone } from 'lucide-react';
import { useSettings } from '@/lib/settings';
import { openExternal, shareNative, canShareNative } from '@/lib/native';

// Where an invited friend gets the app. The Play Store page works as soon as the app is published.
export const INVITE_URL = 'https://play.google.com/store/apps/details?id=com.adamczpg.logicquest';

// Invite a friend: WhatsApp, Telegram, Viber, SMS, the phone's own share menu, or copy the link.
// Also used to send a duel challenge: pass title/desc/text/url.
export default function InviteSheet({ open, onClose, title, desc, text: customText, url: customUrl }) {
  const { t } = useSettings();
  const [copied, setCopied] = useState(false);
  const text = customText || t('invite.message', { app: t('app.name') });
  const link = customUrl || INVITE_URL;
  const full = `${text} ${link}`;
  const enc = encodeURIComponent;

  const targets = [
    { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: 'bg-[#25D366]', url: `https://wa.me/?text=${enc(full)}` },
    { id: 'telegram', label: 'Telegram', icon: Send, color: 'bg-[#229ED9]', url: `https://t.me/share/url?url=${enc(link)}&text=${enc(text)}` },
    { id: 'viber', label: 'Viber', icon: Phone, color: 'bg-[#7360F2]', url: `viber://forward?text=${enc(full)}` },
    { id: 'sms', label: 'SMS', icon: MessageSquare, color: 'bg-ink-soft', url: `sms:?&body=${enc(full)}` },
  ];

  async function copy() {
    try {
      await navigator.clipboard.writeText(full);
    } catch {
      // older WebViews: fall back to a hidden text field
      const ta = document.createElement('textarea');
      ta.value = full;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch {}
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-40 bg-ink/40 grid place-items-end sm:place-items-center p-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div role="dialog" aria-modal="true" aria-label={title || t('invite.title')} className="sheet w-full max-w-md p-4"
            initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }} onClick={(e) => e.stopPropagation()} style={{ marginBottom: 'var(--safe-bottom)' }}>
            <h2 className="font-heading font-bold text-xl">{title || t('invite.title')}</h2>
            <p className="text-sm text-ink-soft mt-1">{desc || t('invite.desc')}</p>
            <p className="mt-3 rounded-xl bg-paper border border-line px-3 py-2 text-sm">{text}</p>

            <div className="grid grid-cols-4 gap-2 mt-4">
              {targets.map((x) => (
                <button key={x.id} onClick={() => openExternal(x.url)} className="flex flex-col items-center gap-1.5 rounded-2xl p-2 hover:bg-pen-soft">
                  <span className={`w-12 h-12 rounded-full grid place-items-center text-white ${x.color}`}><x.icon className="w-6 h-6" /></span>
                  <span className="text-xs font-bold">{x.label}</span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3">
              {canShareNative() && (
                <button onClick={() => shareNative({ title: title || t('app.name'), text, url: link })} className="rounded-xl border-2 border-line bg-sheet py-2.5 font-bold flex items-center justify-center gap-2 hover:border-pen">
                  <Share2 className="w-4 h-4" />{t('invite.more')}
                </button>
              )}
              <button onClick={copy} className={`rounded-xl border-2 py-2.5 font-bold flex items-center justify-center gap-2 ${copied ? 'border-ok text-ok' : 'border-line bg-sheet hover:border-pen'} ${canShareNative() ? '' : 'col-span-2'}`}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}{copied ? t('invite.copied') : t('invite.copy')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
