// Weekly leagues + following friends (Supabase, schema "gbexam").
// Children never type a name or any text here: a player is an animal + a number, a country flag and a language flag.
// Joining is optional. Nothing is sent before the child taps "Join".
import { getStats } from '@/exam/stats';
import { AVATARS } from '@/lib/duel';

const URL = 'https://hzogoatfjgncaajoiybq.supabase.co/rest/v1/rpc/';
// public key (safe in the app): it can only call the gbexam_* functions, never read tables
const KEY = 'sb_publishable_PCPug8w-Ukvxc1gC1ms93A_21kNZRh8';
const STORE = 'lq_league_v1';
const CACHE = 'lq_league_cache_v1';

export const LEAGUES = [
  null,
  { id: 1, emoji: '🥉', color: '#C07A45', soft: '#F6E3D3' },
  { id: 2, emoji: '🥈', color: '#7D8A9C', soft: '#E6EAF0' },
  { id: 3, emoji: '🥇', color: '#D9A400', soft: '#FFF2C2' },
  { id: 4, emoji: '💎', color: '#1F8FD6', soft: '#D8EEFB' },
  { id: 5, emoji: '👑', color: '#8A3FD1', soft: '#EEDDFB' },
];

function read(key) {
  try {
    const v = JSON.parse(localStorage.getItem(key) || 'null');
    return v && typeof v === 'object' ? v : null;
  } catch {
    return null;
  }
}
function write(key, v) {
  try {
    if (v === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(v));
  } catch {}
}

// { id, secret, code, num, syncedXp }
export const getMe = () => read(STORE);
export const isJoined = () => !!getMe()?.id;

async function rpc(fn, body) {
  const res = await fetch(URL + fn, {
    method: 'POST',
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${fn}: ${res.status}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}
const auth = () => {
  const me = getMe();
  if (!me) throw new Error('not joined');
  return { p_id: me.id, p_secret: me.secret };
};

const avatarIndex = (emoji) => Math.max(0, AVATARS.indexOf(emoji));

export async function join({ avatar, country, lang }) {
  const rows = await rpc('gbexam_register', { p_avatar: avatarIndex(avatar), p_country: country, p_lang: lang });
  const r = Array.isArray(rows) ? rows[0] : rows;
  // XP earned before joining does not count – everyone starts the week fairly
  write(STORE, { id: r.id, secret: r.secret, code: r.friend_code, num: r.num, syncedXp: getStats().xp || 0 });
  return getMe();
}

export async function updateProfile({ avatar, country, lang }) {
  if (!isJoined()) return;
  await rpc('gbexam_update', { ...auth(), p_avatar: avatarIndex(avatar), p_country: country, p_lang: lang });
}

// send XP earned since the last sync (the server caps it per call and per day)
export async function syncXp() {
  const me = getMe();
  if (!me) return;
  const now = getStats().xp || 0;
  let left = Math.max(0, now - (me.syncedXp || 0));
  while (left > 0) {
    const part = Math.min(left, 600);
    await rpc('gbexam_add_xp', { ...auth(), p_xp: part });
    left -= part;
    write(STORE, { ...getMe(), syncedXp: now - left });
  }
}

export async function loadLeague() {
  await syncXp().catch(() => {});
  const rows = await rpc('gbexam_league', auth());
  const out = { rows: rows || [], at: Date.now() };
  write(CACHE, { ...(read(CACHE) || {}), league: out });
  return out;
}

export async function loadFriends() {
  const rows = await rpc('gbexam_friends', auth());
  const out = { rows: rows || [], at: Date.now() };
  write(CACHE, { ...(read(CACHE) || {}), friends: out });
  return out;
}

export const cached = () => read(CACHE) || {};

export async function follow(code) {
  return !!(await rpc('gbexam_follow', { ...auth(), p_code: String(code).trim().toUpperCase() }));
}
export async function unfollow(code) {
  await rpc('gbexam_unfollow', { ...auth(), p_code: code });
}

// "delete me": removes the player and everything about them on the server, and forgets the key here
export async function leave() {
  if (isJoined()) await rpc('gbexam_delete', auth());
  write(STORE, null);
  write(CACHE, null);
}

// a friend link waiting for the child to join first
const PENDING = 'lq_follow_pending';
export const setPendingFollow = (c) => { try { localStorage.setItem(PENDING, c); } catch {} };
export const hasPendingFollow = () => { try { return !!localStorage.getItem(PENDING); } catch { return false; } };
export const takePendingFollow = () => {
  try {
    const c = localStorage.getItem(PENDING);
    localStorage.removeItem(PENDING);
    return c;
  } catch {
    return null;
  }
};

export const friendLink = (code) => `https://adam-czpg.github.io/a-logic-quest/#/f?c=${code}`;
export const VALID_CODE = /^[A-HJ-NP-Z2-9]{6}$/;

// ---------------------------------------------------------------- classes
// A class is "grade.letter" + a mascot – children never type a school or class name.
export const MASCOTS = ['🚀', '⭐', '🌈', '⚡', '🔥', '🌍', '🎯', '🧩', '🎨', '⚽', '🎵', '🌻', '🐝', '🦋', '🐬', '🦖'];
export const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
export const className = (c) => `${c.grade}.${c.letter}`;

export async function createClass({ grade, letter, mascot }) {
  return rpc('gbexam_class_create', { ...auth(), p_grade: grade, p_letter: letter, p_mascot: mascot });
}
// → 'ok' | 'notfound' | 'full' | 'limit'
export async function joinClass(code) {
  return rpc('gbexam_class_join', { ...auth(), p_code: String(code).trim().toUpperCase() });
}
export async function leaveClass(code) {
  await rpc('gbexam_class_leave', { ...auth(), p_code: code });
}
export async function kickFromClass(code, member) {
  return !!(await rpc('gbexam_class_kick', { ...auth(), p_code: code, p_member: member }));
}
export async function loadClasses() {
  await syncXp().catch(() => {});
  const rows = (await rpc('gbexam_my_classes', auth())) || [];
  write(CACHE, { ...(read(CACHE) || {}), classes: { rows, at: Date.now() } });
  return rows;
}
export async function classBoard(code) {
  await syncXp().catch(() => {});
  return (await rpc('gbexam_class_board', { ...auth(), p_code: code })) || [];
}
export async function classVs(code) {
  return (await rpc('gbexam_class_vs', { ...auth(), p_code: code })) || [];
}

// ---------------------------------------------------------------- follows back + cheers
export async function loadFollowers() {
  return (await rpc('gbexam_followers', auth())) || [];
}

// cheers are preset phrases (numbers the app translates) – no free text between children
export const CHEERS = ['👏', '💪', '🔥', '⚔️', '🎉', '🤝', '🚀', '🧠', '😄', '🏆', '📚', '👋'];
// → 'ok' | 'limit' | 'notfriends' | 'bad'
export async function sendCheer(toCode, phrase) {
  return rpc('gbexam_cheer_send', { ...auth(), p_to: toCode, p_phrase: phrase });
}
export async function loadCheers() {
  const rows = (await rpc('gbexam_cheers', auth())) || [];
  write(CACHE, { ...(read(CACHE) || {}), unseen: 0 });
  try { window.dispatchEvent(new Event('lq-cheers')); } catch {}
  return rows;
}
export async function refreshUnseen() {
  if (!isJoined()) return 0;
  const n = Number(await rpc('gbexam_cheer_unseen', auth())) || 0;
  write(CACHE, { ...(read(CACHE) || {}), unseen: n });
  try { window.dispatchEvent(new Event('lq-cheers')); } catch {}
  return n;
}
export const unseenCheers = () => (read(CACHE) || {}).unseen || 0;
