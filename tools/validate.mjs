// Validates all data files and runs the automated part of the question-bank self-review.
// Exit code 1 on any error. Usage: node tools/validate.mjs
import fs from 'fs';
import path from 'path';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const J = f => JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'));
const errors = [], warns = [];
const err = m => errors.push(m), warn = m => warns.push(m);

const files = ['data/questions.json', 'data/flashcards.json', 'data/lessons.json', 'data/glossary.json', 'data/medications.json', 'data/strips.json', 'manifest.webmanifest'];
const data = {};
for (const f of files) { try { if (fs.existsSync(path.join(ROOT, f))) data[f] = J(f); else warn(`missing ${f}`); } catch (e) { err(`${f}: invalid JSON (${e.message})`); } }
const Q = data['data/questions.json'].questions, S = data['data/strips.json'].images, LS = data['data/lessons.json'].lessons;
const stripIds = new Set(S.map(s => s.id)), lessonIds = new Set(LS.map(l => l.id));
for (const s of S) if (!fs.existsSync(path.join(ROOT, s.file))) err(`image file missing: ${s.file}`);

// ---- per-question structure ----
const ids = new Set();
for (const q of Q) {
  const tag = `${q.id}`;
  if (ids.has(q.id)) err(`${tag}: duplicate id`); ids.add(q.id);
  for (const k of ['area', 'subtopic', 'difficulty', 'type', 'stem', 'explanation', 'source']) if (q[k] == null || q[k] === '') err(`${tag}: missing ${k}`);
  if (![1, 2, 3].includes(q.difficulty)) err(`${tag}: bad difficulty`);
  if (!lessonIds.has(q.lesson)) err(`${tag}: lesson ${q.lesson} not found`);
  if (q.image && !stripIds.has(q.image)) err(`${tag}: image ${q.image} not found`);
  const sentences = q.explanation.split(/(?<=[.!?])\s+(?=[A-Z0-9"(])/).length;
  if (sentences < 2 && q.explanation.length < 90) warn(`${tag}: short explanation`);
  if (q.type === 'mcq') {
    if (!Array.isArray(q.options) || q.options.length !== 4) err(`${tag}: MCQ must have exactly 4 options`);
    if (!(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < 4)) err(`${tag}: MCQ must have exactly one valid answer index`);
    if (new Set(q.options.map(o => o.trim().toLowerCase())).size !== q.options.length) err(`${tag}: duplicate options`);
    if (q.options.some(o => /all of the above|none of the above/i.test(o))) warn(`${tag}: uses all/none of the above`);
  } else if (q.type === 'multi') {
    if (q.options.length < 4 || q.options.length > 6) err(`${tag}: multi needs 4–6 options`);
    if (!(q.answers.length >= 2 && q.answers.length <= 3)) err(`${tag}: multi needs 2–3 answers`);
    const want = (q.stem.match(/Select (two|three)/i) || [])[1]; if (!want) err(`${tag}: multi stem must say how many to select`);
    else if ({ two: 2, three: 3 }[want.toLowerCase()] !== q.answers.length) err(`${tag}: stem count ≠ answers`);
    if (new Set(q.options).size !== q.options.length) err(`${tag}: duplicate options`);
  } else if (q.type === 'order') {
    if (!(q.items.length >= 3)) err(`${tag}: order needs ≥3 items`);
  } else if (q.type === 'hotspot') {
    if (!q.image) err(`${tag}: hotspot needs image`);
    if (!q.answers.length || q.answers.some(a => a < 0 || a >= q.regions.length)) err(`${tag}: hotspot answers invalid`);
  } else err(`${tag}: unknown type ${q.type}`);
}

// ---- proportions ----
const TARGET = { A: 10, B: 14, C: 22, D: 10, E: 4, F: 40 };
const pct = (arr, key = 'area') => { const c = {}; arr.forEach(x => (c[x[key]] = (c[x[key]] || 0) + 1)); return Object.fromEntries(Object.keys(TARGET).map(k => [k, (100 * (c[k] || 0)) / arr.length])); };
const isBonus = x => x.tags?.includes('anatomy-bonus');
const Qcore = Q.filter(q => !isBonus(q));
const qp = pct(Qcore); for (const k in TARGET) if (Math.abs(qp[k] - TARGET[k]) > 1) err(`questions: area ${k} is ${qp[k].toFixed(1)}% (target ${TARGET[k]}%)`);
const FC = data['data/flashcards.json'].cards; const FCcore = FC.filter(c => !isBonus(c)); const fp = pct(FCcore); for (const k in TARGET) if (Math.abs(fp[k] - TARGET[k]) > 1) err(`flashcards: area ${k} is ${fp[k].toFixed(1)}% (target ${TARGET[k]}%)`);
const MED_CAP = 40 / 11; // CCI lists meds as 1 of 11 tasks in the 40% domain
const medQ = Q.filter(q => q.tags?.includes('medication')).length, medF = FC.filter(c => c.tags?.includes('medication')).length;
const G = data['data/glossary.json'].terms, MR = data['data/medications.json'].classes;
if ((100 * medQ) / Qcore.length > MED_CAP) err(`medication questions ${((100 * medQ) / Qcore.length).toFixed(1)}% > ${MED_CAP.toFixed(1)}%`);
if ((100 * medF) / FCcore.length > MED_CAP) err(`medication flashcards ${((100 * medF) / FC.length).toFixed(1)}% > cap`);
if ((100 * MR.length) / (MR.length + G.length) > MED_CAP) err(`medication quick-reference ${((100 * MR.length) / (MR.length + G.length)).toFixed(1)}% > cap`);
if (Q.length < 1000) err(`only ${Q.length} questions (target ≥ 1000)`);
if (FC.length < 500) err(`only ${FC.length} flashcards (target ≥ 500)`);
for (const c of FC) { if (!c.front || !c.back || !c.area) err(`${c.id}: incomplete card`); if (c.image && !stripIds.has(c.image)) err(`${c.id}: image missing`); }

// ---- every rhythm/interval/artifact question has an image ----
for (const q of Q) if (['Sinus rhythms', 'Atrial rhythms', 'Junctional rhythms', 'Ventricular rhythms', 'Heart blocks', 'Artifact'].includes(q.subtopic) && !q.image && q.area === 'F') warn(`${q.id}: rhythm-recognition item without strip: ${q.stem.slice(0, 60)}`);

// ---- self-review: duplicates & ambiguity heuristics ----
const norm = s => s.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
const seen = new Map();
for (const q of Q) {
  const key = norm(q.stem) + '|' + (q.image || '') + '|' + (q.options ? norm(q.options[q.answer ?? q.answers[0]]) : q.items?.join());
  if (seen.has(key)) err(`${q.id}: duplicate of ${seen.get(key)}`); else seen.set(key, q.id);
}
const textOnly = Q.filter(q => !q.image);
const stemMap = new Map();
for (const q of textOnly) { const k = norm(q.stem); if (stemMap.has(k)) warn(`${q.id}: same stem as ${stemMap.get(k)} — check they are distinct`); else stemMap.set(k, q.id); }
for (const q of Q.filter(q => q.type === 'mcq')) {
  const ans = norm(q.options[q.answer]);
  for (const [i, o] of q.options.entries()) if (i !== q.answer && norm(o) && ans.includes(norm(o)) && norm(o).length > 6) warn(`${q.id}: distractor "${o}" is contained in the answer — possible double-correct`);
  const longest = Math.max(...q.options.map(o => o.length)); if (!q.generated && q.options[q.answer].length === longest && longest > 2.2 * Math.min(...q.options.map(o => o.length)) && longest > 60) warn(`${q.id}: correct answer is much longer than distractors (cueing)`);
}
// answer-key position balance
const pos = [0, 0, 0, 0]; Q.filter(q => q.type === 'mcq').forEach(q => pos[q.answer]++);
const exp = pos.reduce((a, b) => a + b) / 4; if (pos.some(p => Math.abs(p - exp) > exp * 0.15)) warn(`answer position imbalance ${pos}`);

const anatQ = Q.filter(q => q.tags?.includes('anatomy') || q.subtopic === 'Anatomy & physiology').length, anatF = FC.filter(c => c.tags?.includes('anatomy')).length;
console.log(`anatomy/physiology/blood flow: ${anatQ} questions (${(100 * anatQ / Q.length).toFixed(1)}% of all; ${Q.filter(isBonus).length} are bonus items outside the CCI proportions), ${anatF} flashcards`);
console.log(`traps: ${Q.filter(q => q.tags?.includes('trap')).length} questions; communication: ${Q.filter(q => q.tags?.includes('communication')).length} questions`);
console.log(`core questions ${Qcore.length} of ${Q.length} | ${Object.entries(qp).map(([k, v]) => `${k} ${v.toFixed(1)}%`).join(' ')} | meds ${medQ} (${((100 * medQ) / Q.length).toFixed(1)}%)`);
console.log(`flashcards ${FC.length} | ${Object.entries(fp).map(([k, v]) => `${k} ${v.toFixed(1)}%`).join(' ')} | meds ${medF}`);
console.log(`types`, Q.reduce((a, q) => ((a[q.type] = (a[q.type] || 0) + 1), a), {}), 'answer positions', pos, `images ${S.length}`);
if (warns.length) console.log(`\n${warns.length} warnings:\n  ` + warns.filter(w => !process.env.ONLY || w.includes(process.env.ONLY)).filter(w=>!process.env.SKIP || !w.includes(process.env.SKIP)).join('\n  ') + "");
if (errors.length) { console.log(`\n${errors.length} ERRORS:\n  ` + errors.slice(0, 80).join('\n  ')); process.exit(1); }
console.log('\nAll checks passed.');
