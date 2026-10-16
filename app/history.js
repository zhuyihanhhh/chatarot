// 占卜记录：localStorage，最多 200 条，新的在前
const KEY = "tarot.history", MAX = 200;

export function list() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
}

function write(arr) {
  for (;;) {
    try { localStorage.setItem(KEY, JSON.stringify(arr.slice(0, MAX))); return; }
    catch (e) { if (arr.length <= 1) throw e; arr = arr.slice(0, Math.floor(arr.length * .8)); }
  }
}

export function save(entry) {
  const arr = list().filter(e => e.id !== entry.id);
  arr.unshift({ ...entry, updated: Date.now() });
  write(arr);
}

export const get = id => list().find(e => e.id === id);
export const remove = id => write(list().filter(e => e.id !== id));
