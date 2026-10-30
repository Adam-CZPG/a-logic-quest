// Thin wrappers around Capacitor plugins. Everything degrades gracefully in the browser.
import { Capacitor } from '@capacitor/core';
import { isSoundOn, vibrate } from '@/lib/sfx';

export const isNative = () => Capacitor.isNativePlatform();

export async function haptic(kind = 'light') {
  if (!isSoundOn()) return;
  if (!isNative()) {
    vibrate(kind === 'error' ? [30, 40, 30] : kind === 'success' ? [20, 30, 40] : 10);
    return;
  }
  try {
    const { Haptics, ImpactStyle, NotificationType } = await import('@capacitor/haptics');
    if (kind === 'success') await Haptics.notification({ type: NotificationType.Success });
    else if (kind === 'error') await Haptics.notification({ type: NotificationType.Error });
    else await Haptics.impact({ style: kind === 'medium' ? ImpactStyle.Medium : ImpactStyle.Light });
  } catch {}
}

const REMINDER_ID = 4201;

// Daily "practise now" notification at the chosen time (Android/iOS only).
export async function syncReminder({ on, time }, t) {
  if (!isNative()) return { ok: false, reason: 'web' };
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.cancel({ notifications: [{ id: REMINDER_ID }] });
    if (!on) return { ok: true };
    const perm = await LocalNotifications.requestPermissions();
    if (perm.display !== 'granted') return { ok: false, reason: 'denied' };
    const [hour, minute] = time.split(':').map(Number);
    await LocalNotifications.schedule({
      notifications: [{
        id: REMINDER_ID,
        title: t('plan.notifTitle'),
        body: t('plan.notifBody'),
        schedule: { on: { hour, minute }, repeats: true, allowWhileIdle: true },
        smallIcon: 'ic_stat_icon',
      }],
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: String(e) };
  }
}

export async function setupNativeChrome(dark) {
  if (!isNative()) return;
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light });
    await StatusBar.setBackgroundColor({ color: dark ? '#121a2e' : '#f7f8fc' });
  } catch {}
  try {
    const { SplashScreen } = await import('@capacitor/splash-screen');
    await SplashScreen.hide();
  } catch {}
}

// Android hardware back button: go back in history, or exit on the home screen.
export async function onHardwareBack(handler) {
  if (!isNative()) return () => {};
  try {
    const { App } = await import('@capacitor/app');
    const sub = await App.addListener('backButton', handler);
    return () => sub.remove();
  } catch {
    return () => {};
  }
}

export async function exitApp() {
  try {
    const { App } = await import('@capacitor/app');
    await App.exitApp();
  } catch {}
}

export function openExternal(url) {
  window.open(url, '_blank', 'noopener');
}
