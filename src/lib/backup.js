// Backup of everything the app remembers (name, settings, results, game progress).
// The fixed signing key already keeps data across APK updates; this file is the
// safety net for a new phone or a reinstall.
import { isNative } from '@/lib/native';

const PREFIXES = ['lq_', 'mathpuzzle_'];

function collect() {
  const data = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && PREFIXES.some((p) => k.startsWith(p))) data[k] = localStorage.getItem(k);
  }
  return data;
}

export function backupFileName(name) {
  const d = new Date();
  const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const who = (name || '').normalize('NFD').replace(/[^\w]+/g, '').slice(0, 20);
  return `LogicQuest-${who ? `${who}-` : ''}${day}.json`;
}

export async function exportBackup(name) {
  const json = JSON.stringify({ app: 'logic-quest', v: 1, at: Date.now(), data: collect() });
  const file = backupFileName(name);
  if (isNative()) {
    const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
    const { Share } = await import('@capacitor/share');
    const res = await Filesystem.writeFile({ path: file, data: json, directory: Directory.Cache, encoding: Encoding.UTF8 });
    await Share.share({ title: file, files: [res.uri] });
    return;
  }
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = file;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

// Throws on a file that is not a Logic Quest backup.
export function importBackup(text) {
  const obj = JSON.parse(text);
  if (!obj || obj.app !== 'logic-quest' || !obj.data || typeof obj.data !== 'object') throw new Error('not a backup');
  Object.entries(obj.data).forEach(([k, v]) => {
    if (typeof v === 'string' && PREFIXES.some((p) => k.startsWith(p))) localStorage.setItem(k, v);
  });
}
