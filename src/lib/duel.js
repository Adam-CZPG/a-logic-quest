// Duels without a server: the whole duel travels inside the link a child sends through a messenger.
// A link carries: which tasks (subject, grade, country, seed) and the results of the players so far.
import { randomSeed } from '@/exam/rng';
import { CURRICULA } from '@/exam/taxonomy';

const KEY = 'lq_duels_v1';
const PENDING = 'lq_duel_pending';

// where a duel link opens: the web page of the app (works for everyone, even without the app installed)
export const WEB_BASE = 'https://adam-czpg.github.io/a-logic-quest/';
export const APP_SCHEME = 'gbexam://';

export const AVATARS = ['🦊', '🐼', '🐯', '🦁', '🐸', '🐵', '🦄', '🐙', '🐧', '🐨', '🐰', '🐻', '🐶', '🐱', '🦉', '🐲'];

// ---------------------------------------------------------------- link payload
// short keys keep links short: i id, s subject, g grade, c country, e seed, a challenger, b responder
// player: n name, v avatar, c country, l language, p points, t time (ms)
function b64url(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function unb64url(s) {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

const clean = (p) => p && ({
  n: String(p.n || '').slice(0, 20), v: AVATARS.includes(p.v) ? p.v : AVATARS[0], c: CURRICULA[p.c] ? p.c : undefined, l: String(p.l || '').slice(0, 5),
  p: Math.max(0, Math.min(99, Number(p.p) || 0)), t: Math.max(0, Math.min(36e5, Number(p.t) || 0)),
});

export function encodeDuel(d) {
  return b64url(JSON.stringify({ i: d.id, s: d.subject, g: d.grade, c: d.curriculum, e: d.seed, a: d.a, b: d.b || undefined }));
}

// returns null for anything that is not a valid duel (links can be edited by hand)
export function decodeDuel(code) {
  try {
    const o = JSON.parse(unb64url(String(code)));
    if (!o || typeof o !== 'object' || !o.i || !o.s || !o.a || !CURRICULA[o.c]) return null;
    if (!CURRICULA[o.c].subjects.includes(o.s) || !CURRICULA[o.c].grades.includes(Number(o.g))) return null;
    return { id: String(o.i).slice(0, 24), subject: o.s, grade: Number(o.g), curriculum: o.c, seed: String(o.e).slice(0, 24), a: clean(o.a), b: clean(o.b) || null };
  } catch {
    return null;
  }
}

export function duelLink(d) {
  return `${WEB_BASE}#/d?d=${encodeDuel(d)}`;
}

// ---------------------------------------------------------------- local history
// { [id]: { id, role: 'a' | 'b', subject, grade, curriculum, seed, a, b, at } }
function readAll() {
  try {
    const o = JSON.parse(localStorage.getItem(KEY) || '{}');
    return o && typeof o === 'object' && !Array.isArray(o) ? o : {};
  } catch {
    return {};
  }
}
function writeAll(all) {
  const keep = Object.values(all).sort((x, y) => y.at - x.at).slice(0, 60);
  try {
    localStorage.setItem(KEY, JSON.stringify(Object.fromEntries(keep.map((d) => [d.id, d]))));
  } catch {}
}

export function listDuels() {
  return Object.values(readAll()).sort((x, y) => y.at - x.at);
}
export function getDuel(id) {
  return readAll()[id] || null;
}
export function saveDuel(d) {
  const all = readAll();
  all[d.id] = { ...all[d.id], ...d, at: Date.now() };
  writeAll(all);
  return all[d.id];
}

export function newDuel({ subject, grade, curriculum }) {
  return { id: randomSeed().toString(36) + Date.now().toString(36).slice(-4), role: 'a', subject, grade, curriculum, seed: randomSeed().toString(36), a: null, b: null };
}

// who won: 'me' | 'them' | 'draw' | null (still waiting). More points wins; same points → faster wins.
export function outcome(d) {
  if (!d?.a || !d?.b) return null;
  const me = d.role === 'a' ? d.a : d.b;
  const them = d.role === 'a' ? d.b : d.a;
  if (me.p !== them.p) return me.p > them.p ? 'me' : 'them';
  // the same shown time (whole seconds) is a draw too
  if (Math.round(me.t / 1000) === Math.round(them.t / 1000)) return 'draw';
  return me.t < them.t ? 'me' : 'them';
}

export function record() {
  const r = { win: 0, loss: 0, draw: 0 };
  listDuels().forEach((d) => {
    const o = outcome(d);
    if (o === 'me') r.win++;
    else if (o === 'them') r.loss++;
    else if (o === 'draw') r.draw++;
  });
  return r;
}

// a duel link opened before the child finished the first-run setup waits here
export function setPendingDuel(code) {
  try { localStorage.setItem(PENDING, code); } catch {}
}
export function takePendingDuel() {
  try {
    const c = localStorage.getItem(PENDING);
    localStorage.removeItem(PENDING);
    return c;
  } catch {
    return null;
  }
}

export function fmtTime(ms) {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
