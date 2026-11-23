// Builds data/lessons.json, data/flashcards.json, data/glossary.json, data/medications.json
import fs from 'fs';
import path from 'path';
import lessons from './content/lessons.mjs';
import cards from './content/flashcards.mjs';
import { glossary } from './content/glossary.mjs';
import meds from './content/medications.mjs';
import { anatomyLessons, anatomyCards } from './content/anatomy.mjs';
import { communicationLessons, communicationCards } from './content/communication.mjs';
import TRAPS from './content/traps-list.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const strips = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/strips.json'), 'utf8')).images;
const AREAS = { A: 'Conducting Pre-Procedural Activities', B: 'Performing Resting ECG', C: 'Analyzing 12-Lead ECG', D: 'Performing Stress Tests', E: 'Performing Ambulatory Monitoring', F: 'Performing Rhythm Analysis' };
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '');

// Lead-group lesson for the 12-lead library (in addition to subtopic lessons)
const extraLessons = [
  { id: 'C-reading-lead-groups', area: 'C', title: 'How to read each lead group', body: [
    'Read a 12-lead in the same order every time: rate → rhythm → intervals (PR, QRS, QT) → axis → hypertrophy → then look at each lead group for Q waves, ST changes and T waves.',
    'INFERIOR (II, III, aVF): look up from the diaphragm at the inferior LV wall — RCA in most people. ST elevation here: check aVL/I for reciprocal depression and record V4R for RV involvement. Watch for bradycardia/AV block.',
    'SEPTAL (V1, V2): the septum — LAD. Normal: small r, deep S. ST depression with tall R here may be the mirror of a posterior MI.',
    'ANTERIOR (V3, V4): anterior LV wall — LAD. R waves should be growing; the R/S transition is usually here.',
    'LATERAL (I, aVL high lateral; V5, V6 low lateral): lateral LV wall — circumflex (or diagonal branches of the LAD). Small septal q waves are normal here.',
    'aVR: looks at the heart from the right shoulder; normally everything is negative. An upright aVR with inverted lead I suggests arm-lead reversal.',
    'POSTERIOR: no standard lead — look for ST depression with tall R waves in V1–V3 and confirm with V7–V9.'],
    keyPoints: ['Inferior II/III/aVF → RCA', 'Septal V1–V2, anterior V3–V4 → LAD', 'Lateral I/aVL/V5–V6 → LCx', 'Posterior → V1–V3 mirror, confirm V7–V9', 'Right ventricle → V4R'],
    mnemonics: [{ name: 'I SAW LA', text: 'Inferior II/III/aVF, Septal V1–V2, Anterior V3–V4, Lateral I/aVL/V5–V6.' }] },
  { id: 'F-rhythm-method', area: 'F', title: 'A 5-step method for any rhythm strip', body: [
    '1. Rate: regular → 1500 ÷ small boxes (or 300 ÷ large boxes); irregular → QRS in 6 s × 10. Check atrial rate too.',
    '2. Regularity: march out R–R intervals with calipers or paper; regular, regularly irregular (grouped), or irregularly irregular?',
    '3. P waves: present? upright in II? one before every QRS? more P waves than QRS complexes? flutter or fibrillatory waves?',
    '4. PR interval: 0.12–0.20 s? constant, lengthening, or variable (dissociated)?',
    '5. QRS: narrow (< 0.12 s, supraventricular) or wide (ventricular, BBB, paced)? Then name the rhythm and look for ectopy, pauses and pacing spikes.'],
    keyPoints: ['Rate → Rhythm → P → PR → QRS', 'Irregularly irregular + no P = AF', 'More P than QRS = AV block'], mnemonics: [{ name: 'Rate, Rhythm, P, PR, QRS', text: '"Real Rhythm Pros Prefer QRS."' }] },
];
const allLessons = [...lessons, ...extraLessons, ...anatomyLessons, ...communicationLessons].map(l => ({ ...l, areaName: AREAS[l.area] }));
fs.writeFileSync(path.join(ROOT, 'data/lessons.json'), JSON.stringify({ lessons: allLessons }, null, 0));

// Flashcards
const TRAP_CARD_AREAS = ['B', 'C', 'D', 'E', 'F'];
const parse = (txt, tags) => txt.trim().split('\n').map(l => l.split('|')).map(([area, topic, front, back]) => ({ area, topic, front, back, tags }));
const allCards = [...cards.map(([area, topic, front, back]) => ({ area, topic, front, back, tags: topic === 'Medications' ? ['medication'] : undefined })),
  ...parse(communicationCards, ['communication']),
  ...Object.entries(TRAPS).filter(([a]) => TRAP_CARD_AREAS.includes(a)).flatMap(([area, list]) => list.map(([trap, fix]) => ({ area, topic: 'Exam traps', front: `Trap: ${trap}`, back: fix, tags: ['trap'] }))), ...parse(anatomyCards, ['anatomy', 'anatomy-bonus'])];
const out = allCards.map((c, i) => ({ id: `FC${String(i + 1).padStart(4, '0')}`, area: c.area, topic: c.topic, front: c.front, back: c.back, ...(c.tags ? { tags: c.tags } : {}) }));
let n = out.length;
const RN = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/questions.json'), 'utf8')); // for nothing but sanity
const byR = {}; strips.filter(s => s.kind === 'strip').forEach(s => (byR[s.rhythm] = byR[s.rhythm] || []).push(s));
const third = new Set(['mobitz1', 'mobitz2', 'avb21', 'avb3', 'afib', 'aflutter', 'mat', 'wap', 'junctional', 'accjunct', 'idio', 'aivr', 'failsense', 'failcapture', 'torsades', 'vfibfine']);
for (const [rid, list] of Object.entries(byR)) for (const s of [list[list.length - 1], list[list.length - 3], ...(third.has(rid) ? [list[list.length - 5]] : [])]) {
  out.push({ id: `FC${String(++n).padStart(4, '0')}`, area: 'F', topic: rid.startsWith('art_') ? 'Artifact' : 'Rhythm ID', front: 'Name this rhythm.', image: s.id, back: s.name, tags: ['image'] });
}
// Extra rhythm-ID cards (a different strip of each rhythm) so domain F keeps its 40% share of the deck
for (const [rid, list] of Object.entries(byR).filter(([r]) => !r.startsWith('art_')).slice(0, 21)) out.push({ id: `FC${String(++n).padStart(4, '0')}`, area: 'F', topic: 'Rhythm ID', front: 'Name this rhythm.', image: list[1].id, back: list[1].name, tags: ['image'] });
const twelve = strips.filter(s => s.kind === '12lead');
const pickC = ['inferior', 'anterior', 'lateral', 'septal', 'lbbb', 'rbbb', 'lvh', 'lad', 'rad', 'posterior', 'hyperk', 'ischemia', 'anterolateral', 'normal', 'inferior', 'anterior', 'lbbb', 'rbbb'];
const usedC = new Set();
for (const c of pickC) { const s = twelve.filter(x => x.condition === c && !usedC.has(x.id)).pop(); if (s) usedC.add(s.id); if (s) out.push({ id: `FC${String(++n).padStart(4, '0')}`, area: 'C', topic: '12-lead ID', front: 'What does this 12-lead show?', image: s.id, back: s.name, tags: ['image'] }); }
fs.writeFileSync(path.join(ROOT, 'data/flashcards.json'), JSON.stringify({ disclaimer: 'Study aid only. Not an official CCI product.', cards: out }));

// Exam traps list
fs.writeFileSync(path.join(ROOT, 'data/traps.json'), JSON.stringify({ areas: Object.fromEntries(Object.entries(TRAPS).map(([a, list]) => [a, list.map(([trap, fix]) => ({ trap, fix }))])) }));

// Glossary & medication reference
fs.writeFileSync(path.join(ROOT, 'data/glossary.json'), JSON.stringify({ terms: glossary.map(g => ({ ...g, areaName: AREAS[g.area] })) }));
fs.writeFileSync(path.join(ROOT, 'data/medications.json'), JSON.stringify({ note: 'General study reference only — not prescribing information. Always follow current drug labeling and your facility protocols.', classes: meds }));

const cnt = {}; out.forEach(c => (cnt[c.area] = (cnt[c.area] || 0) + 1));
console.log('lessons', allLessons.length, 'flashcards', out.length, Object.fromEntries(Object.entries(cnt).map(([k, v]) => [k, `${v} (${(100 * v / out.length).toFixed(1)}%)`])), 'med cards', out.filter(c => c.tags?.includes('medication')).length, 'glossary', glossary.length, 'meds ref', meds.length, `(${(100 * meds.length / (meds.length + glossary.length)).toFixed(1)}% of quick-reference)`);
