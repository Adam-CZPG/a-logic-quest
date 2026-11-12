// Full version: one payment through Google Play unlocks every test and topic set forever.
// Free for everyone: tests 1 and 2 and the first set of every topic in each subject, the daily plan,
// duels, leagues and the mistakes review.
//
// Google Play is the source of truth. The result is kept on the device so the app also works
// offline; on every start (and on "restore") the app asks Play again and follows its answer.
import { useEffect, useState } from 'react';
import { isNative } from '@/lib/native';

export const PRODUCT_ID = 'full_access'; // one-time in-app product in Play Console
export const FREE_TESTS = 2; // tests 1…2 of every subject
export const FREE_VARIANTS = 1; // set 1 of every topic

const KEY = 'lq_premium_v1';

function read() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || 'null');
    return v && typeof v === 'object' ? v : null;
  } catch {
    return null;
  }
}

function write(on, extra = {}) {
  try {
    if (on) localStorage.setItem(KEY, JSON.stringify({ on: true, at: Date.now(), ...extra }));
    else localStorage.removeItem(KEY);
  } catch {}
  try {
    window.dispatchEvent(new Event('lq-premium'));
  } catch {}
}

export function isPremium() {
  return !!read()?.on;
}

// is this test / topic set open without the full version?
export function isFree(kind, { number, variant } = {}) {
  if (kind === 'mock') return !!number && number <= FREE_TESTS;
  if (kind === 'topic') return !!variant && variant <= FREE_VARIANTS;
  return true; // daily plan, duel, mistakes
}

export const canOpen = (kind, opts) => isPremium() || isFree(kind, opts);

export function usePremium() {
  const [on, setOn] = useState(isPremium);
  useEffect(() => {
    const r = () => setOn(isPremium());
    window.addEventListener('lq-premium', r);
    window.addEventListener('storage', r);
    return () => {
      window.removeEventListener('lq-premium', r);
      window.removeEventListener('storage', r);
    };
  }, []);
  return on;
}

async function plugin() {
  if (!isNative()) return null;
  try {
    const m = await import('@capgo/native-purchases');
    const { isBillingSupported } = await m.NativePurchases.isBillingSupported();
    return isBillingSupported ? m : null;
  } catch {
    return null;
  }
}

const owns = (p) => p?.productIdentifier === PRODUCT_ID && (p.purchaseState === undefined || String(p.purchaseState) === '1');

// ask Google Play what this account owns; returns true / false, or null when Play could not be asked
export async function refreshPremium() {
  const m = await plugin();
  if (!m) return null;
  try {
    const { purchases } = await m.NativePurchases.getPurchases({ productType: m.PURCHASE_TYPE.INAPP });
    const mine = (purchases || []).find(owns);
    if (mine && mine.isAcknowledged === false && mine.purchaseToken) {
      // Play refunds purchases that are not acknowledged within 3 days
      await m.NativePurchases.acknowledgePurchase({ purchaseToken: mine.purchaseToken }).catch(() => {});
    }
    write(!!mine, mine ? { order: mine.orderId || null } : {});
    return !!mine;
  } catch {
    return null;
  }
}

// price from Play (in the buyer's currency); the crossed-out price is shown as double
export async function getOffer() {
  const m = await plugin();
  if (!m) return null;
  try {
    const { products } = await m.NativePurchases.getProducts({ productIdentifiers: [PRODUCT_ID], productType: m.PURCHASE_TYPE.INAPP });
    const p = (products || []).find((x) => x.identifier === PRODUCT_ID);
    if (!p) return null;
    let was = null;
    try {
      was = new Intl.NumberFormat(undefined, { style: 'currency', currency: p.currencyCode, maximumFractionDigits: 0 }).format(Math.ceil(p.price * 2));
    } catch {}
    return { price: p.priceString, was };
  } catch {
    return null;
  }
}

// 'ok' | 'cancelled' | 'unavailable' | 'error'
export async function buyPremium() {
  const m = await plugin();
  if (!m) return 'unavailable';
  try {
    const tx = await m.NativePurchases.purchaseProduct({ productIdentifier: PRODUCT_ID, productType: m.PURCHASE_TYPE.INAPP, quantity: 1 });
    if (tx && owns(tx)) {
      write(true, { order: tx.orderId || null });
      return 'ok';
    }
    // pending payment (e.g. cash at a shop): Play finishes it later, the next start unlocks it
    const now = await refreshPremium();
    return now ? 'ok' : 'error';
  } catch (e) {
    const msg = String(e?.message || e || '').toLowerCase();
    if (msg.includes('cancel')) return 'cancelled';
    // already bought on this Google account (e.g. a new phone)
    if (msg.includes('already') || msg.includes('owned')) return (await refreshPremium()) ? 'ok' : 'error';
    return 'error';
  }
}

// 'ok' | 'none' | 'unavailable'
export async function restorePremium() {
  const m = await plugin();
  if (!m) return 'unavailable';
  try {
    await m.NativePurchases.restorePurchases();
  } catch {}
  const on = await refreshPremium();
  if (on === null) return 'unavailable';
  return on ? 'ok' : 'none';
}
