// store.js — profiles, progress and spaced-repetition state, saved in localStorage on this device only.
const KEY = 'cctstudy:v1';
const DAY = 86400000;
export const INTERVALS = [1, 3, 7, 14]; // days: missed → 1 d → 3 d → 1 wk → 2 wk
export const RETIRE_AFTER = 4;          // consecutive correct reviews before an item leaves the queue

const blankProfile = name => ({
  id: 'p' + Math.random().toString(36).slice(2, 9), name, created: Date.now(),
  q: {},        // questionId → {seen, correct, wrong, streak, step, due, queued, last, ms, conf, unsureRight, guessed}
  c: {},        // flashcardId → same scheduler fields
  bookmarks: [],
  exams: [],    // {date, total, correct, scored, pct, byArea:{A:[c,n]}, minutes}
  days: {},     // 'YYYY-MM-DD' → items answered that day
  rapid: [],    // best rapid-fire scores
  settings: { goal: 30, examDate: '2027-01-15', theme: 'auto', size: 'm', confidence: true },
});

let state = load();
function load() {
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.profiles) return s; } catch (e) { /* storage unavailable */ }
  const p = blankProfile('Me');
  return { active: p.id, profiles: { [p.id]: p } };
}
let saveTimer = null;
export function save(now = false) {
  const write = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { console.warn('Could not save progress', e); } };
  clearTimeout(saveTimer); if (now) write(); else saveTimer = setTimeout(write, 250);
}
window.addEventListener('pagehide', () => save(true));

export const profile = () => state.profiles[state.active];
export const profiles = () => Object.values(state.profiles);
export function addProfile(name) { const p = blankProfile(name.trim() || 'Study buddy'); state.profiles[p.id] = p; state.active = p.id; save(true); return p; }
export function switchProfile(id) { if (state.profiles[id]) { state.active = id; save(true); } }
export function renameProfile(id, name) { if (state.profiles[id] && name.trim()) { state.profiles[id].name = name.trim(); save(true); } }
export function deleteProfile(id) {
  delete state.profiles[id];
  if (!Object.keys(state.profiles).length) { const p = blankProfile('Me'); state.profiles[p.id] = p; }
  if (!state.profiles[state.active]) state.active = Object.keys(state.profiles)[0];
  save(true);
}
export const settings = () => profile().settings;
export function setSetting(k, v) { profile().settings[k] = v; save(); }

export const today = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const bump = () => { const p = profile(), t = today(); p.days[t] = (p.days[t] || 0) + 1; };

// Spaced repetition shared by questions and flashcards.
function schedule(rec, correct, conf) {
  const now = Date.now();
  if (!correct) { rec.queued = true; rec.step = 0; rec.streak = 0; rec.due = now + INTERVALS[0] * DAY; return; }
  if (conf && conf !== 'sure') { // right but unsure/guessed → extra review tomorrow, no promotion
    rec.unsureRight = (rec.unsureRight || 0) + 1; rec.queued = true; rec.streak = 0; rec.due = now + INTERVALS[0] * DAY; return;
  }
  if (!rec.queued) return;
  rec.streak = (rec.streak || 0) + 1;
  if (rec.streak >= RETIRE_AFTER) { rec.queued = false; rec.due = null; rec.retired = now; return; }
  rec.step = Math.min((rec.step || 0) + 1, INTERVALS.length - 1); rec.due = now + INTERVALS[rec.step] * DAY;
}
export function recordAnswer(q, correct, { conf = 'sure', ms = 0, scored = true } = {}) {
  const p = profile(); const r = p.q[q.id] || (p.q[q.id] = { seen: 0, correct: 0, wrong: 0 });
  r.seen++; correct ? r.correct++ : r.wrong++; r.last = Date.now(); r.lastOk = correct; r.ms = ms; r.conf = conf;
  if (conf === 'guess') r.guessed = (r.guessed || 0) + 1;
  r.hist = [...(r.hist || []).slice(-9), correct ? 1 : 0];
  if (scored) schedule(r, correct, conf);
  bump(); save();
}
export function recordCard(card, gotIt) {
  const p = profile(); const r = p.c[card.id] || (p.c[card.id] = { seen: 0, correct: 0, wrong: 0 });
  r.seen++; gotIt ? r.correct++ : r.wrong++; r.last = Date.now();
  schedule(r, gotIt, 'sure'); if (!gotIt) r.queued = true;
  bump(); save();
}
export const dueQuestions = (all, at = Date.now()) => all.filter(q => { const r = profile().q[q.id]; return r && r.queued && r.due <= endOfDay(at); });
export const dueCards = (all, at = Date.now()) => all.filter(c => { const r = profile().c[c.id]; return r && r.queued && r.due <= endOfDay(at); });
const endOfDay = t => { const d = new Date(t); d.setHours(23, 59, 59, 999); return d.getTime(); };
export const queuedCount = () => Object.values(profile().q).filter(r => r.queued).length + Object.values(profile().c).filter(r => r.queued).length;

export function toggleBookmark(id) { const b = profile().bookmarks; const i = b.indexOf(id); i >= 0 ? b.splice(i, 1) : b.push(id); save(); return i < 0; }
export const isBookmarked = id => profile().bookmarks.includes(id);

export function addExam(result) { profile().exams.push(result); save(true); }
export function addRapid(score) { const p = profile(); p.rapid = [...p.rapid, { date: Date.now(), score }].sort((a, b) => b.score - a.score).slice(0, 10); save(); }

// Stats
export function areaStats(questions) {
  const p = profile(); const out = {};
  for (const q of questions) {
    const a = out[q.area] || (out[q.area] = { total: 0, seen: 0, attempts: 0, correct: 0, recent: [] });
    a.total++; const r = p.q[q.id]; if (!r) continue;
    a.seen++; a.attempts += r.seen; a.correct += r.correct; a.recent.push(...(r.hist || []));
  }
  for (const a of Object.values(out)) { a.acc = a.attempts ? a.correct / a.attempts : null; a.recentAcc = a.recent.length ? a.recent.reduce((s, x) => s + x, 0) / a.recent.length : null; }
  return out;
}
export function subtopicStats(questions) {
  const p = profile(); const out = {};
  for (const q of questions) {
    const k = q.area + '|' + q.subtopic; const s = out[k] || (out[k] = { area: q.area, subtopic: q.subtopic, total: 0, attempts: 0, correct: 0 });
    s.total++; const r = p.q[q.id]; if (r) { s.attempts += r.seen; s.correct += r.correct; }
  }
  return Object.values(out).map(s => ({ ...s, acc: s.attempts ? s.correct / s.attempts : null }));
}
export function streak() {
  const p = profile(), goal = p.settings.goal || 1; let n = 0; const d = new Date();
  if ((p.days[today(d)] || 0) < goal) d.setDate(d.getDate() - 1); // today not finished yet doesn't break streak
  while ((p.days[today(d)] || 0) >= goal) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
// Readiness: weighted per-area recent accuracy (shrunk toward 50% when few attempts), blended with practice exams.
export const WEIGHTS = { A: 0.10, B: 0.14, C: 0.22, D: 0.10, E: 0.04, F: 0.40 };
export const PASS_PCT = 0.70;
export function readiness(questions) {
  const st = areaStats(questions); let est = 0, evidence = 0;
  for (const [a, w] of Object.entries(WEIGHTS)) {
    const s = st[a]; const n = s ? s.recent.length : 0; const acc = n ? s.recentAcc : 0.5;
    const k = n / (n + 15); est += w * (k * acc + (1 - k) * 0.5); evidence += w * Math.min(1, n / 30);
  }
  const ex = profile().exams.slice(-3);
  if (ex.length) { const examAvg = ex.reduce((s, e) => s + e.pct, 0) / ex.length; est = 0.5 * est + 0.5 * examAvg; evidence = Math.min(1, evidence + 0.3 * ex.length); }
  const prob = 1 / (1 + Math.exp(-(est - PASS_PCT) / 0.045));
  return { est, prob, evidence };
}
export function exportData(all = false) { return JSON.stringify(all ? { app: 'cct-study', version: 1, exported: new Date().toISOString(), state } : { app: 'cct-study', version: 1, exported: new Date().toISOString(), profile: profile() }, null, 1); }
export function importData(text) {
  const d = JSON.parse(text); if (d.app !== 'cct-study') throw new Error('Not a CCT Study export file');
  if (d.state?.profiles) { for (const p of Object.values(d.state.profiles)) state.profiles[p.id] = p; }
  else if (d.profile) { state.profiles[d.profile.id] = d.profile; state.active = d.profile.id; }
  save(true);
}
export function resetProgress() { const p = profile(); Object.assign(p, { q: {}, c: {}, bookmarks: [], exams: [], days: {}, rapid: [] }); save(true); }
