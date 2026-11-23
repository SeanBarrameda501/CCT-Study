// Assembles data/questions.json from hand-written content (tools/content/*.mjs) plus
// items generated from validated ECG images (data/strips.json). Run after build-strips.
import fs from 'fs';
import path from 'path';
import { mulberry32 } from '../js/ecg.js';
import { SRC } from './content/helpers.mjs';
import A from './content/a-preprocedural.mjs';
import B from './content/b-resting.mjs';
import C from './content/c-12lead.mjs';
import D from './content/d-stress.mjs';
import E from './content/e-ambulatory.mjs';
import F from './content/f-rhythm.mjs';
import EXTRA from './content/extra.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const strips = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/strips.json'), 'utf8')).images;
const AREAS = {
  A: 'Conducting Pre-Procedural Activities', B: 'Performing Resting ECG', C: 'Analyzing 12-Lead ECG',
  D: 'Performing Stress Tests', E: 'Performing Ambulatory Monitoring', F: 'Performing Rhythm Analysis',
};
const r = mulberry32(20270115);
const pick = a => a[Math.floor(r() * a.length)];
const shuffle = a => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const gen = [];
const G = (o) => gen.push({ ...o, generated: true });

// ---------------- Rhythm knowledge for generated items ----------------
const FAMILY = {
  nsr: 'Sinus rhythms', sbrady: 'Sinus rhythms', stach: 'Sinus rhythms', sinarr: 'Sinus rhythms', sarrest: 'Sinus rhythms',
  pac: 'Atrial rhythms', afib: 'Atrial rhythms', aflutter: 'Atrial rhythms', svt: 'Atrial rhythms', mat: 'Atrial rhythms', wap: 'Atrial rhythms',
  junctional: 'Junctional rhythms', accjunct: 'Junctional rhythms', jtach: 'Junctional rhythms', pjc: 'Junctional rhythms',
  pvc: 'Ventricular rhythms', bigeminy: 'Ventricular rhythms', trigeminy: 'Ventricular rhythms', couplet: 'Ventricular rhythms', multifocal: 'Ventricular rhythms',
  vtach: 'Ventricular rhythms', torsades: 'Ventricular rhythms', vfib: 'Ventricular rhythms', vfibfine: 'Ventricular rhythms', asystole: 'Ventricular rhythms', idio: 'Ventricular rhythms', aivr: 'Ventricular rhythms',
  avb1: 'Heart blocks', mobitz1: 'Heart blocks', mobitz2: 'Heart blocks', avb21: 'Heart blocks', avb3: 'Heart blocks',
  rbbb: 'Bundle branch block', lbbb: 'Bundle branch block',
  apace: 'Pacemakers', vpace: 'Pacemakers', avpace: 'Pacemakers', failcapture: 'Pacemakers', failsense: 'Pacemakers',
  art_tremor: 'Artifact', art_wander: 'Artifact', art_60hz: 'Artifact', art_loose: 'Artifact',
};
const CRIT = {
  nsr: 'Normal sinus rhythm: regular, rate 60–100, an upright P before every QRS, PR 0.12–0.20 s, QRS < 0.12 s.',
  sbrady: 'Sinus bradycardia meets every sinus criterion but the rate is below 60 bpm.',
  stach: 'Sinus tachycardia meets every sinus criterion but the rate is above 100 bpm (usually ≤ 150–160 at rest).',
  sinarr: 'Sinus arrhythmia has normal sinus P–QRS–T complexes but the R–R interval varies (commonly ≥ 0.16 s), usually speeding with inspiration and slowing with expiration.',
  sarrest: 'Sinus arrest/pause: the SA node fails to fire, so a complete P–QRS–T is missing and the pause is not an exact multiple of the P–P interval.',
  pac: 'A PAC is an early beat with a P wave that looks different from the sinus P, a normal QRS, and usually a non-compensatory pause.',
  afib: 'Atrial fibrillation: no identifiable P waves (chaotic fibrillatory baseline) and an irregularly irregular ventricular response.',
  aflutter: 'Atrial flutter: regular sawtooth F waves at about 250–350 per minute (classically ~300), best seen in II, III, aVF; the ventricles respond in a ratio such as 2:1, 3:1 or 4:1.',
  svt: 'SVT: a regular, narrow-complex tachycardia, usually 150–250 bpm, with P waves hidden or not identifiable.',
  mat: 'Multifocal atrial tachycardia: rate > 100, irregular, with at least three different P-wave shapes and varying PR intervals.',
  wap: 'Wandering atrial pacemaker: like MAT (≥ 3 P-wave shapes, varying PR) but the rate is under 100 bpm.',
  junctional: 'Junctional escape rhythm: regular, narrow QRS, rate 40–60; P waves are inverted before the QRS (PR < 0.12 s), hidden, or after the QRS.',
  accjunct: 'Accelerated junctional rhythm: junctional features (inverted, absent or retrograde P) at a rate of 60–100 bpm.',
  jtach: 'Junctional tachycardia: junctional features at a rate above 100 bpm.',
  pjc: 'A PJC is an early narrow beat with an inverted, absent or retrograde P wave (PR < 0.12 s if present).',
  pvc: 'A PVC is an early, wide (≥ 0.12 s), bizarre QRS with no preceding P wave, a T wave opposite the QRS and usually a full compensatory pause.',
  bigeminy: 'Ventricular bigeminy: every other beat is a PVC (normal, PVC, normal, PVC…).',
  trigeminy: 'Ventricular trigeminy: every third beat is a PVC (two normal beats, then a PVC).',
  couplet: 'A couplet is two PVCs in a row; three or more in a row is a run of ventricular tachycardia.',
  multifocal: 'Multifocal PVCs have different shapes because they arise from more than one ventricular focus.',
  vtach: 'Ventricular tachycardia: three or more consecutive wide (≥ 0.12 s) complexes at a rate above 100 (often 150–250), regular, with no related P waves.',
  torsades: 'Torsades de pointes: polymorphic VT whose QRS amplitude twists around the baseline (waxing and waning), usually linked to a long QT.',
  vfib: 'Ventricular fibrillation: chaotic, irregular deflections with no identifiable P, QRS or T waves—no cardiac output.',
  vfibfine: 'Fine ventricular fibrillation: low-amplitude chaotic waves; confirm in another lead because it can resemble asystole.',
  asystole: 'Asystole: no ventricular electrical activity—an essentially flat line (confirm in two leads and check connections/gain).',
  idio: 'Idioventricular rhythm: a regular wide-QRS ventricular escape rhythm at 20–40 bpm with no P waves related to the QRS.',
  aivr: 'Accelerated idioventricular rhythm: a wide-QRS ventricular rhythm at about 40–100 bpm, often seen after reperfusion.',
  avb1: 'First-degree AV block: PR > 0.20 s and constant, with every P conducted (1:1).',
  mobitz1: 'Second-degree AV block Mobitz I (Wenckebach): the PR progressively lengthens until a P wave is not conducted; groups of beats repeat.',
  mobitz2: 'Second-degree AV block Mobitz II: the PR is constant on conducted beats, and P waves are suddenly not conducted; the QRS is often wide.',
  avb21: '2:1 AV block: every other P wave is not conducted. Because no two consecutive PRs can be compared, it cannot be labeled Mobitz I or II from the strip alone.',
  avb3: 'Third-degree (complete) AV block: P waves and QRS complexes are independent (AV dissociation); atrial rate is faster than the ventricular escape rate; PR intervals vary randomly.',
  rbbb: 'RBBB: QRS ≥ 0.12 s with an rSR\' pattern in V1 (terminal R\'), and wide S waves in I and V6.',
  lbbb: 'LBBB: QRS ≥ 0.12 s with a deep QS or rS in V1 and broad R waves in I, aVL, V5–V6 without septal q waves.',
  apace: 'Atrial pacing: a pacing spike precedes each P wave, followed by an intrinsically conducted (usually narrow) QRS.',
  vpace: 'Ventricular pacing: a pacing spike immediately precedes each wide QRS complex.',
  avpace: 'Dual-chamber (AV) pacing: an atrial spike before the P wave and a ventricular spike before each wide QRS.',
  failcapture: 'Failure to capture: a pacing spike appears but is not followed by a P wave or QRS complex.',
  failsense: 'Failure to sense (undersensing): the pacemaker fires spikes despite the patient\'s own beats—spikes land on or right after intrinsic QRS/T waves.',
  art_tremor: 'Somatic (muscle tremor) artifact: irregular, jittery high-frequency baseline noise while the underlying QRS complexes continue on time.',
  art_wander: 'Wandering baseline: the whole tracing drifts slowly up and down (often with respiration) but the complexes are otherwise normal.',
  art_60hz: '60-cycle (AC) interference: a uniform, fine, regular "thick" baseline caused by electrical interference.',
  art_loose: 'Loose/detached lead artifact: a sudden erratic or flat segment in one lead while the patient\'s actual rhythm continues.',
};
const CONF = {
  nsr: ['sbrady', 'stach', 'sinarr', 'avb1'], sbrady: ['nsr', 'junctional', 'avb1', 'idio'], stach: ['svt', 'nsr', 'aflutter', 'jtach'],
  sinarr: ['nsr', 'afib', 'sarrest', 'wap'], sarrest: ['sinarr', 'mobitz2', 'avb21', 'pac'], pac: ['pvc', 'pjc', 'sinarr', 'afib'],
  afib: ['aflutter', 'mat', 'sinarr', 'vfibfine'], aflutter: ['afib', 'svt', 'stach', 'art_tremor'], svt: ['stach', 'aflutter', 'vtach', 'jtach'],
  mat: ['afib', 'wap', 'stach', 'aflutter'], wap: ['mat', 'sinarr', 'afib', 'nsr'],
  junctional: ['idio', 'sbrady', 'accjunct', 'avb3'], accjunct: ['junctional', 'jtach', 'nsr', 'aivr'], jtach: ['svt', 'accjunct', 'stach', 'vtach'], pjc: ['pac', 'pvc', 'sinarr', 'junctional'],
  pvc: ['pac', 'pjc', 'bigeminy', 'multifocal'], bigeminy: ['trigeminy', 'pvc', 'couplet', 'avb21'], trigeminy: ['bigeminy', 'couplet', 'pvc', 'pac'], couplet: ['vtach', 'bigeminy', 'multifocal', 'trigeminy'],
  multifocal: ['pvc', 'couplet', 'bigeminy', 'vtach'], vtach: ['svt', 'vfib', 'torsades', 'aivr'], torsades: ['vfib', 'vtach', 'art_loose', 'aflutter'],
  vfib: ['vtach', 'torsades', 'asystole', 'art_tremor'], vfibfine: ['asystole', 'vfib', 'afib', 'art_loose'], asystole: ['vfibfine', 'idio', 'avb3', 'art_loose'],
  idio: ['junctional', 'aivr', 'avb3', 'vtach'], aivr: ['vtach', 'idio', 'accjunct', 'vpace'],
  avb1: ['nsr', 'mobitz1', 'sbrady', 'avb3'], mobitz1: ['mobitz2', 'avb3', 'avb1', 'sarrest'], mobitz2: ['mobitz1', 'avb3', 'avb21', 'sarrest'],
  avb21: ['mobitz2', 'avb3', 'mobitz1', 'sbrady'], avb3: ['mobitz1', 'mobitz2', 'avb21', 'idio'],
  rbbb: ['lbbb', 'nsr', 'vtach', 'avb1'], lbbb: ['rbbb', 'nsr', 'vpace', 'idio'],
  apace: ['vpace', 'avpace', 'nsr', 'failsense'], vpace: ['avpace', 'apace', 'idio', 'failcapture'], avpace: ['vpace', 'apace', 'failsense', 'lbbb'],
  failcapture: ['failsense', 'vpace', 'mobitz2', 'sarrest'], failsense: ['failcapture', 'avpace', 'pvc', 'vpace'],
  art_tremor: ['art_60hz', 'afib', 'art_wander', 'vfib'], art_wander: ['art_tremor', 'art_loose', 'art_60hz', 'afib'],
  art_60hz: ['art_tremor', 'aflutter', 'art_wander', 'afib'], art_loose: ['asystole', 'vfib', 'art_wander', 'art_tremor'],
};
const NAME = id => ({
  nsr: 'Normal sinus rhythm', sbrady: 'Sinus bradycardia', stach: 'Sinus tachycardia', sinarr: 'Sinus arrhythmia', sarrest: 'Sinus arrest (pause)',
  pac: 'Sinus rhythm with PACs', afib: 'Atrial fibrillation', aflutter: 'Atrial flutter', svt: 'Supraventricular tachycardia (SVT)', mat: 'Multifocal atrial tachycardia',
  wap: 'Wandering atrial pacemaker', junctional: 'Junctional escape rhythm', accjunct: 'Accelerated junctional rhythm', jtach: 'Junctional tachycardia', pjc: 'Sinus rhythm with PJCs',
  pvc: 'Sinus rhythm with a unifocal PVC', bigeminy: 'Ventricular bigeminy', trigeminy: 'Ventricular trigeminy', couplet: 'Sinus rhythm with a PVC couplet', multifocal: 'Sinus rhythm with multifocal PVCs',
  vtach: 'Monomorphic ventricular tachycardia', torsades: 'Torsades de pointes', vfib: 'Ventricular fibrillation', vfibfine: 'Fine ventricular fibrillation', asystole: 'Asystole',
  idio: 'Idioventricular rhythm', aivr: 'Accelerated idioventricular rhythm', avb1: 'Sinus rhythm with first-degree AV block', mobitz1: 'Second-degree AV block, Mobitz I (Wenckebach)',
  mobitz2: 'Second-degree AV block, Mobitz II', avb21: '2:1 AV block', avb3: 'Third-degree (complete) AV block', rbbb: 'Sinus rhythm with RBBB', lbbb: 'Sinus rhythm with LBBB',
  apace: 'Atrial paced rhythm', vpace: 'Ventricular paced rhythm', avpace: 'AV (dual-chamber) paced rhythm', failcapture: 'Pacemaker failure to capture', failsense: 'Pacemaker failure to sense',
  art_tremor: 'Muscle tremor (somatic) artifact', art_wander: 'Wandering baseline artifact', art_60hz: '60-cycle (AC) interference', art_loose: 'Loose lead artifact',
}[id]);
const irregularIds = new Set(['afib', 'mat', 'wap', 'sinarr', 'sarrest', 'pac', 'pjc', 'pvc', 'bigeminy', 'trigeminy', 'couplet', 'multifocal', 'mobitz1', 'mobitz2', 'failcapture']);
function describe(s) {
  const m = s.measured, bits = [];
  if (m.vrate) bits.push(`${irregularIds.has(s.rhythm) ? 'about ' + m.qrsIn6s * 10 + ' bpm by the 6-second method' : 'rate ≈ ' + m.vrate + ' bpm'}`);
  if (s.rhythm === 'aflutter') bits.push(`flutter-wave rate ≈ ${s.meta.rate}/min with ${s.meta.ratio}:1 conduction`);
  if (s.rhythm === 'avb3') bits.push(`atrial rate ≈ ${s.meta.arate}, ventricular escape ≈ ${m.vrate} (${s.meta.escape})`);
  if (m.vrate) bits.push(m.regular ? 'regular' : 'irregular');
  if (m.pr != null && !['avb3', 'mat', 'wap', 'mobitz1'].includes(s.rhythm)) bits.push(`PR ≈ ${m.pr.toFixed(2)} s`);
  if (s.rhythm === 'mobitz1' && m.prRange) bits.push(`PR lengthens from ≈ ${m.prRange[0].toFixed(2)} to ${m.prRange[1].toFixed(2)} s before the dropped beat`);
  if (m.qrs != null) bits.push(`QRS ≈ ${m.qrs.toFixed(2)} s`);
  return bits.join(', ');
}
const imgNote = s => (s.real ? 'real recording' : 'generated tracing');
const ID_STEMS = [
  'Identify the rhythm on this lead {L} strip.',
  'What is the rhythm shown in this {L} rhythm strip?',
  'A patient on telemetry has the following rhythm in lead {L}. Which interpretation is correct?',
  'This strip was printed during a routine ECG. Which rhythm does it show?',
  'Interpret this rhythm strip (lead {L}, 25 mm/s).',
  'Which rhythm is displayed?',
  'A monitor technician prints this strip. What is the rhythm?',
  'Analyze the strip: rate, regularity, P waves, PR and QRS. What is the rhythm?',
];
const LIFE = { vfib: 1, vfibfine: 1, vtach: 1, torsades: 1, asystole: 1 };

function idQuestion(s, k, area = 'F', sub = FAMILY[s.rhythm]) {
  const opts = [NAME(s.rhythm), ...shuffle(CONF[s.rhythm]).slice(0, 3).map(NAME)];
  const isArt = s.rhythm.startsWith('art_');
  G({ area, subtopic: sub, difficulty: ['nsr', 'sbrady', 'stach', 'vfib', 'asystole', 'afib'].includes(s.rhythm) ? 1 : ['mobitz2', 'avb21', 'mat', 'wap', 'aivr', 'failsense', 'vfibfine', 'jtach'].includes(s.rhythm) ? 3 : 2,
    type: 'mcq', stem: (isArt ? 'What is causing the disturbance on this lead II strip?' : ID_STEMS[k % ID_STEMS.length]).replace('{L}', s.lead), image: s.id, options: opts, answer: 0,
    explanation: `${CRIT[s.rhythm]} On this ${imgNote(s)}: ${describe(s)}.`, source: SRC.DUBIN + '; generated strip verified by tools/criteria.mjs', rhythm: s.rhythm });
}
function rateQuestion(s) {
  const irr = irregularIds.has(s.rhythm); const c = irr ? s.measured.qrsIn6s * 10 : s.measured.vrate;
  if (!c) return idQuestion(s, 1);
  const cand = [Math.round(c * 0.5), Math.round(c * 0.67), Math.round(c * 1.45), Math.round(c * 2)].filter(x => Math.abs(x - c) >= Math.max(15, c * 0.22));
  const opts = [c, ...shuffle(cand).slice(0, 3)].map(x => `${x} bpm`);
  G({ area: 'F', subtopic: 'Rate calculation', difficulty: 2, type: 'mcq', image: s.id, rhythm: s.rhythm,
    stem: irr ? 'This rhythm is irregular. Using the 6-second method, what is the approximate ventricular rate? (The strip is 6 seconds long.)' : 'Calculate the ventricular rate of this regular rhythm (use the 1,500 or 300 method).',
    options: opts, answer: 0,
    explanation: irr ? `There are ${s.measured.qrsIn6s} QRS complexes in 6 seconds; ${s.measured.qrsIn6s} × 10 = ${c} bpm. Use the 6-second method for irregular rhythms because a single R–R interval is not representative. Rhythm: ${NAME(s.rhythm)}.`
      : `The R–R interval is about ${(60 / c).toFixed(2)} s ≈ ${Math.round(1500 / c)} small boxes; 1500 ÷ ${Math.round(1500 / c)} ≈ ${c} bpm. Rhythm: ${NAME(s.rhythm)}.`,
    source: SRC.DUBIN });
}
function intervalQuestion(s) {
  const m = s.measured;
  if (m.pr != null && m.prConst && !['avb3'].includes(s.rhythm)) {
    const c = Math.round(m.pr * 100) / 100; const pool = [0.08, 0.12, 0.16, 0.2, 0.24, 0.28, 0.32, 0.36, 0.4].filter(x => Math.abs(x - c) >= 0.07);
    const opts = [c, ...shuffle(pool).slice(0, 3)].map(x => `${x.toFixed(2)} s`);
    G({ area: 'F', subtopic: 'Intervals & waveforms', difficulty: 2, type: 'mcq', image: s.id, rhythm: s.rhythm,
      stem: 'Measure the PR interval on this strip.', options: opts, answer: 0,
      explanation: `The PR interval runs from the start of the P wave to the start of the QRS: about ${Math.round(c / 0.04)} small boxes × 0.04 s ≈ ${c.toFixed(2)} s. ${c > 0.2 ? 'This is prolonged (> 0.20 s).' : 'This is within the normal 0.12–0.20 s range.'} Rhythm: ${NAME(s.rhythm)}.`, source: SRC.DUBIN });
  } else if (m.qrs != null) {
    const c = Math.round(m.qrs * 100) / 100; const pool = [0.04, 0.08, 0.12, 0.16, 0.2, 0.24].filter(x => Math.abs(x - c) >= 0.05);
    const opts = [c, ...shuffle(pool).slice(0, 3)].map(x => `${x.toFixed(2)} s`);
    G({ area: 'F', subtopic: 'Intervals & waveforms', difficulty: 2, type: 'mcq', image: s.id, rhythm: s.rhythm,
      stem: 'Estimate the duration of the widest QRS complex on this strip.', options: opts, answer: 0,
      explanation: `QRS duration is measured from the first deflection after the PR segment to the J point: about ${Math.round(c / 0.04)} small boxes ≈ ${c.toFixed(2)} s. ${c >= 0.12 ? 'A QRS ≥ 0.12 s is wide (ventricular origin or abnormal conduction).' : 'A QRS < 0.12 s is narrow (supraventricular conduction).'} Rhythm: ${NAME(s.rhythm)}.`, source: SRC.DUBIN });
  } else idQuestion(s, 2);
}
const FEATURES = [
  ['Regular R–R intervals', s => s.measured.vrate > 0 && s.measured.regular, s => s.measured.vrate > 0 && !s.measured.regular],
  ['Irregular R–R intervals', s => s.measured.vrate > 0 && !s.measured.regular && s.measured.qrsIn6s > 2, s => s.measured.regular],
  ['A P wave precedes every QRS complex', s => s.measured.pBeforeEach, s => !s.measured.pBeforeEach],
  ['No identifiable P waves', s => s.measured.noP && s.measured.vrate > 0, s => !s.measured.noP],
  ['More P waves than QRS complexes', s => s.measured.moreP, s => !s.measured.moreP && s.measured.pBeforeEach],
  ['PR interval constant and longer than 0.20 s', s => s.measured.prConst && s.measured.prLong && s.measured.pBeforeEach, s => !s.measured.prLong],
  ['All QRS complexes are 0.12 s or wider', s => s.measured.wideAll, s => !s.measured.wideAny],
  ['All QRS complexes are narrower than 0.12 s', s => !s.measured.wideAny && s.measured.vrate > 0, s => s.measured.wideAny],
  ['Rate above 100 bpm', s => s.measured.vrate > 100, s => s.measured.vrate > 0 && s.measured.vrate < 95],
  ['Rate below 60 bpm', s => s.measured.vrate > 0 && s.measured.vrate < 60, s => s.measured.vrate > 65],
];
function featureQuestion(s) {
  if (!s.measured.vrate || s.rhythm.startsWith('art_') || ['mat', 'wap', 'failsense'].includes(s.rhythm)) return idQuestion(s, 6);
  const yes = FEATURES.filter(f => f[1](s)), no = FEATURES.filter(f => f[2](s) && !f[1](s));
  if (yes.length < 2 || no.length < 3) return idQuestion(s, 5);
  const right = shuffle(yes).slice(0, 2), wrong = shuffle(no).slice(0, 3);
  G({ area: 'F', subtopic: FAMILY[s.rhythm], difficulty: 2, type: 'multi', image: s.id, rhythm: s.rhythm,
    stem: 'Which findings are present on this strip? (Select two.)', options: [...right.map(f => f[0]), ...wrong.map(f => f[0])], answers: [0, 1],
    explanation: `This is ${NAME(s.rhythm).toLowerCase()}: ${describe(s)}. ${CRIT[s.rhythm]}`, source: SRC.DUBIN });
}
function hotspotQuestion(s) {
  const regs = []; let stem = '', ans = [], expl = '';
  const qrsRegs = () => s.beats.filter(b => b.q).map(b => ({ x: b.q[0] - 1.2, w: b.q[1] - b.q[0] + 2.4, beat: b }));
  if (['pvc', 'bigeminy', 'trigeminy', 'couplet', 'multifocal'].includes(s.rhythm)) {
    qrsRegs().forEach(g => regs.push(g)); stem = 'Tap any premature ventricular complex (PVC) on this strip.';
    ans = regs.map((g, i) => (g.beat.l === 'PVC' ? i : -1)).filter(i => i >= 0); expl = 'PVCs are the early, wide, bizarre complexes with no preceding P wave and a T wave opposite in direction to the QRS.';
  } else if (s.rhythm === 'pac' || s.rhythm === 'pjc') {
    qrsRegs().forEach(g => regs.push(g)); const lab = s.rhythm === 'pac' ? 'PAC' : 'PJC';
    stem = `Tap the premature ${s.rhythm === 'pac' ? 'atrial' : 'junctional'} complex (${lab}).`; ans = regs.map((g, i) => (g.beat.l === lab ? i : -1)).filter(i => i >= 0);
    expl = s.rhythm === 'pac' ? 'The PAC arrives early with a differently shaped P wave and a narrow QRS.' : 'The PJC arrives early with a narrow QRS and an inverted/absent P wave.';
  } else if (['mobitz1', 'mobitz2', 'avb21'].includes(s.rhythm)) {
    s.beats.filter(b => b.p).forEach(b => regs.push({ x: b.p[0] - 1.5, w: b.p[1] - b.p[0] + 3, beat: b }));
    stem = 'Tap a P wave that is NOT followed by a QRS complex (non-conducted P).'; ans = regs.map((g, i) => (g.beat.l === 'dropped' ? i : -1)).filter(i => i >= 0);
    expl = `${CRIT[s.rhythm]} The non-conducted P wave stands alone with no QRS after it.`;
  } else if (s.rhythm === 'failcapture') {
    s.beats.filter(b => b.s != null).forEach(b => regs.push({ x: b.s - 2, w: 4, beat: b }));
    stem = 'Tap the pacing spike that failed to capture.'; ans = regs.map((g, i) => (g.beat.l === 'noncapture' ? i : -1)).filter(i => i >= 0);
    expl = 'A spike with no QRS after it shows failure to capture; the other spikes are followed by wide paced complexes.';
  } else if (s.rhythm === 'sarrest') {
    const q = s.beats.filter(b => b.q); for (let i = 0; i + 1 < q.length; i++) regs.push({ x: q[i].q[1] + 1, w: q[i + 1].q[0] - q[i].q[1] - 2, beat: q[i] });
    stem = 'Tap the pause in this rhythm.'; ans = regs.map((g, i) => (g.beat.l === 'before-pause' ? i : -1)).filter(i => i >= 0);
    expl = 'The long R–R gap with no P–QRS–T is the sinus pause/arrest.';
  } else return idQuestion(s, 3);
  if (!ans.length || regs.length < 3) return idQuestion(s, 4);
  G({ area: 'F', subtopic: FAMILY[s.rhythm], difficulty: 2, type: 'hotspot', image: s.id, rhythm: s.rhythm, stem,
    regions: regs.map(g => [Math.round(g.x * 10) / 10, 0, Math.round(g.w * 10) / 10, s.height]), answers: ans,
    explanation: `${expl} Rhythm: ${NAME(s.rhythm)} (${describe(s)}).`, source: SRC.DUBIN });
}
const ACTIONS = {
  vfib: ['Call for help, begin CPR and defibrillate as soon as a defibrillator is available', ['Give adenosine', 'Perform synchronized cardioversion', 'Record a 12-lead ECG before doing anything else']],
  vfibfine: ['Begin CPR and defibrillate as soon as possible, confirming the rhythm in another lead', ['Treat as asystole and never shock', 'Give atropine first', 'Wait 5 minutes to see if it resolves']],
  vtach: ['Begin CPR and defibrillate (pulseless VT is treated like VF)', ['Give adenosine and observe', 'Perform carotid massage', 'Recheck in 10 minutes']],
  torsades: ['Begin CPR and defibrillate (unsynchronized); magnesium is given per ACLS', ['Perform synchronized cardioversion at low energy only', 'Give adenosine', 'Tell the patient to cough']],
  asystole: ['Begin CPR and give epinephrine per ACLS; asystole is not a shockable rhythm', ['Defibrillate immediately at maximum energy', 'Give adenosine', 'Perform synchronized cardioversion']],
};
function actionQuestion(s) {
  const a = ACTIONS[s.rhythm]; if (!a) return featureQuestion(s);
  G({ area: 'F', subtopic: 'Life-threatening', difficulty: 2, type: 'mcq', image: s.id, rhythm: s.rhythm, tags: ['scenario'],
    stem: 'Your patient becomes unresponsive, is not breathing normally and has no pulse. The monitor shows this rhythm. What is the most appropriate immediate action?',
    options: [a[0], ...a[1]], answer: 0, explanation: `The rhythm is ${NAME(s.rhythm).toLowerCase()}. ${CRIT[s.rhythm]} AHA ACLS: VF/pulseless VT are shockable (CPR + defibrillation); asystole/PEA are non-shockable (CPR + epinephrine).`, source: SRC.ACLS });
}
function artifactAction(s) {
  const fix = {
    art_tremor: ['Help the patient relax, keep them warm and support the limbs, then repeat the recording', ['Unplug nearby electrical equipment', 'Increase the gain to double standard', 'Defibrillate the patient']],
    art_wander: ['Check electrode contact/skin prep, reduce lead-wire tension and have the patient breathe normally', ['Unplug the treadmill', 'Give the patient a blanket for shivering', 'Change the paper speed to 50 mm/s']],
    art_60hz: ['Unplug nonessential nearby electrical devices and check grounding and cable routing', ['Ask the patient to stop shivering', 'Re-abrade the skin only', 'Switch to half standard']],
    art_loose: ['Check the patient, then reattach or replace the loose electrode/lead wire', ['Start CPR immediately', 'Increase the filter to 40 Hz', 'Call a code blue for asystole']],
  }[s.rhythm];
  G({ area: 'B', subtopic: 'Troubleshooting', difficulty: 2, type: 'mcq', image: s.id, rhythm: s.rhythm, tags: ['scenario'],
    stem: 'You see this tracing while recording an ECG. The patient is awake and comfortable. What is the best corrective action?', options: [fix[0], ...fix[1]], answer: 0,
    explanation: `${CRIT[s.rhythm]} ${fix[0]}.`, source: SRC.BOOTH });
}

// ---------------- Generate from strips ----------------
const byRhythm = {}; strips.filter(s => s.kind === 'strip').forEach(s => (byRhythm[s.rhythm] = byRhythm[s.rhythm] || []).push(s));
for (const [rid, list] of Object.entries(byRhythm)) {
  list.forEach((s, i) => {
    if (rid.startsWith('art_')) { if (i < 5) artifactAction(s); else idQuestion(s, i, 'F', 'Artifact'); return; }
    const plan = [0, 1, 'rate', 'interval', 'hot', 'feature', LIFE[rid] ? 'action' : 2, 3, 'interval'][i];
    if (plan === 'rate') rateQuestion(s); else if (plan === 'interval') intervalQuestion(s); else if (plan === 'hot') hotspotQuestion(s);
    else if (plan === 'feature') featureQuestion(s); else if (plan === 'action') actionQuestion(s); else idQuestion(s, i);
  });
}

// ---------------- 12-lead generated items ----------------
const TWELVE_INFO = {
  inferior: { leads: ['II', 'III', 'aVF'], wall: 'Inferior', artery: 'Right coronary artery (RCA)', recip: ['aVL', 'I'] },
  anterior: { leads: ['V2', 'V3', 'V4'], wall: 'Anterior', artery: 'Left anterior descending (LAD)' },
  septal: { leads: ['V1', 'V2'], wall: 'Septal', artery: 'Left anterior descending (LAD)' },
  lateral: { leads: ['I', 'aVL', 'V5', 'V6'], wall: 'Lateral', artery: 'Left circumflex (LCx)', recip: ['III'] },
  anterolateral: { leads: ['V3', 'V4', 'V5', 'V6', 'I', 'aVL'], wall: 'Anterolateral', artery: 'Left anterior descending (LAD), often with diagonal branches' },
};
const WALLS = ['Inferior', 'Anterior', 'Septal', 'Lateral', 'Posterior'];
const ARTS = ['Right coronary artery (RCA)', 'Left anterior descending (LAD)', 'Left circumflex (LCx)', 'Left main coronary artery'];
const twelve = strips.filter(s => s.kind === '12lead');
const t12Name = {
  normal: 'Normal 12-lead ECG', lad: 'Left axis deviation', rad: 'Right axis deviation', rbbb: 'Right bundle branch block', lbbb: 'Left bundle branch block', lvh: 'Left ventricular hypertrophy with strain',
  inferior: 'Acute inferior STEMI', anterior: 'Acute anterior STEMI', septal: 'Acute septal STEMI', lateral: 'Acute lateral STEMI', anterolateral: 'Acute anterolateral STEMI', posterior: 'Posterior MI pattern',
  ischemia: 'Ischemic ST depression', hyperk: 'Hyperkalemia (peaked T waves)', dextro: 'Dextrocardia', afib12: 'Atrial fibrillation', paced12: 'Ventricular paced rhythm', stach12: 'Sinus tachycardia', avb1_12: 'First-degree AV block',
  rev_lara: 'Left arm/right arm lead reversal', rev_lall: 'Left arm/left leg lead reversal', rev_rall: 'Right arm/left leg lead reversal', rev_v1v2: 'V1/V2 electrode swap',
};
const t12Conf = {
  normal: ['lvh', 'lad', 'ischemia'], lad: ['rad', 'normal', 'lbbb'], rad: ['lad', 'normal', 'rbbb'], rbbb: ['lbbb', 'normal', 'paced12'], lbbb: ['rbbb', 'paced12', 'lvh'],
  lvh: ['normal', 'lbbb', 'anterior'], inferior: ['lateral', 'anterior', 'ischemia'], anterior: ['inferior', 'lateral', 'posterior'], septal: ['anterior', 'inferior', 'rbbb'],
  lateral: ['inferior', 'anterior', 'septal'], anterolateral: ['inferior', 'septal', 'ischemia'], posterior: ['anterior', 'ischemia', 'rbbb'], ischemia: ['inferior', 'normal', 'hyperk'],
  hyperk: ['anterior', 'normal', 'lvh'], dextro: ['rev_lara', 'rad', 'normal'], afib12: ['normal', 'stach12', 'avb1_12'], paced12: ['lbbb', 'rbbb', 'lvh'], stach12: ['normal', 'afib12', 'avb1_12'], avb1_12: ['normal', 'stach12', 'afib12'],
  rev_lara: ['dextro', 'normal', 'rad'], rev_lall: ['rev_lara', 'normal', 'rev_rall'], rev_rall: ['rev_lara', 'rev_lall', 'normal'], rev_v1v2: ['rev_lara', 'normal', 'septal'],
};
const t12Expl = {
  normal: 'Sinus rhythm, normal axis (lead I and aVF positive), narrow QRS, normal R-wave progression and no ST elevation or depression.',
  lad: 'Lead I is positive and leads II/aVF are negative, placing the axis beyond −30° (left axis deviation).',
  rad: 'Lead I is negative and aVF is positive: the axis is between +90° and +180° (right axis deviation).',
  rbbb: 'QRS ≥ 0.12 s with a terminal R\' in V1 and wide terminal S waves in I and V6.',
  lbbb: 'QRS ≥ 0.12 s, deep QS/rS in V1–V2, broad R waves without septal q in I, aVL, V5–V6, with discordant ST-T changes.',
  lvh: 'Very tall voltages (S V1 + R V5/V6 ≥ 35 mm) with lateral ST depression/T inversion (strain).',
  posterior: 'ST depression with tall R waves in V1–V3 is the mirror image of posterior injury; confirm with V7–V9.',
  ischemia: 'Horizontal ST depression in the inferior (II, III, aVF) and lateral (V4–V6) leads without ST elevation indicates ischemia (subendocardial).',
  hyperk: 'Tall, narrow, peaked T waves, most obvious in the precordial leads, are an early sign of hyperkalemia.',
  dextro: 'Lead I shows inverted P, QRS and T with aVR upright, and R waves get smaller from V1 to V6 instead of larger.',
  afib12: 'No P waves and an irregularly irregular rhythm in the lead II rhythm strip.',
  paced12: 'Pacing spikes precede wide QRS complexes in every beat.',
  stach12: 'Sinus P waves before each QRS at a rate above 100.',
  avb1_12: 'Sinus rhythm with a constant PR interval longer than 0.20 s.',
  rev_lara: 'Lead I is inverted (negative P, QRS and T) and aVR is upright—classic LA/RA reversal. Leads II and III and aVR/aVL are swapped.',
  rev_lall: 'LA/LL reversal swaps I with II and aVL with aVF and inverts III; it can look nearly normal—the P wave in I larger than in II is a clue.',
  rev_rall: 'RA/LL reversal inverts leads I, II and III and aVF; aVR becomes upright and aVF inverted.',
  rev_v1v2: 'V1 and V2 are swapped, so R-wave progression is interrupted (V1 looks like V2 and vice versa).',
};
const leadOptions = ['I', 'II', 'III', 'aVR', 'aVL', 'aVF', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6'];
for (const s of twelve) {
  const c = s.condition; const info = TWELVE_INFO[c]; const st = s.measured.st;
  const stText = info ? `Measured ST elevation: ${info.leads.map(L => `${L} ${st[L] > 0 ? '+' : ''}${st[L]} mm`).join(', ')}.` : '';
  const isRev = c.startsWith('rev_');
  const area = isRev ? 'B' : 'C', sub = isRev ? 'Troubleshooting' : info ? 'Ischemia & infarction' : ['lad', 'rad'].includes(c) ? 'Axis' : ['rbbb', 'lbbb'].includes(c) ? 'Bundle branch block' : c === 'lvh' ? 'Hypertrophy' : 'Ischemia & infarction';
  // 1. identify
  G({ area, subtopic: sub, difficulty: 2, type: 'mcq', image: s.id, stem: isRev ? 'This 12-lead was just recorded on a patient whose prior ECG was normal. What best explains the appearance?' : 'What is the best interpretation of this 12-lead ECG?',
    options: [t12Name[c], ...t12Conf[c].map(k => t12Name[k])], answer: 0, explanation: (info ? `ST elevation in ${info.leads.join(', ')} indicates ${info.wall.toLowerCase()} wall injury, usually from the ${info.artery}. ${stText}` : t12Expl[c]) + (isRev ? ' Correct the electrode placement and repeat the ECG.' : ''),
    source: info ? SRC.UDMI : isRev ? SRC.AHA_STD : c === 'lvh' ? SRC.AHA_LVH : ['rbbb', 'lbbb'].includes(c) ? SRC.AHA_BBB : SRC.MARRIOTT });
  if (info) {
    G({ area: 'C', subtopic: 'Ischemia & infarction', difficulty: 2, type: 'mcq', image: s.id, stem: 'Which coronary artery is most likely occluded in this patient with chest pain?',
      options: [info.artery, ...ARTS.filter(a => !info.artery.startsWith(a.split(' (')[0]) && !(info.artery.includes('LAD') && a.includes('LAD'))).slice(0, 3)], answer: 0,
      explanation: `ST elevation is in ${info.leads.join(', ')} (${info.wall.toLowerCase()} wall). ${info.wall} wall → ${info.artery}. Typical map: inferior = RCA; septal/anterior = LAD; lateral = circumflex. ${stText}`, source: SRC.AHA_ISCH });
    const wrongLeads = shuffle(leadOptions.filter(L => !info.leads.includes(L) && Math.abs(st[L]) < 0.6 && L !== 'aVR')).slice(0, 3);
    const right = info.leads.slice(0, 3);
    G({ area: 'C', subtopic: 'Ischemia & infarction', difficulty: 2, type: 'multi', image: s.id, stem: `Which leads show ST-segment elevation on this ECG? (Select ${right.length === 2 ? 'two' : 'three'}.)`,
      options: [...right, ...wrongLeads], answers: right.map((_, i) => i), explanation: `${stText} Elevation of ≥ 1 mm in two or more contiguous leads defines the territory; here the ${info.wall.toLowerCase()} leads.`, source: SRC.UDMI });
    const hl = [...info.leads];
    G({ area: 'C', subtopic: 'Ischemia & infarction', difficulty: 3, type: 'hotspot', image: s.id, stem: 'Tap any lead that shows ST-segment elevation.',
      regions: leadOptions.map(L => s.boxes[L]), regionLabels: leadOptions, answers: leadOptions.map((L, i) => (hl.includes(L) && st[L] >= 1 ? i : -1)).filter(i => i >= 0),
      explanation: `ST elevation is present in ${hl.filter(L => st[L] >= 1).join(', ')}. ${stText}`, source: SRC.UDMI });
    G({ area: 'C', subtopic: 'Ischemia & infarction', difficulty: 1, type: 'mcq', image: s.id, stem: 'Which wall of the left ventricle is affected?',
      options: [info.wall === 'Anterolateral' ? 'Anterolateral' : info.wall, ...WALLS.filter(w => w !== info.wall && !(info.wall === 'Anterolateral' && (w === 'Anterior' || w === 'Lateral'))).slice(0, 3)], answer: 0,
      explanation: `${info.leads.join(', ')} face the ${info.wall.toLowerCase()} wall. Lead groups: II/III/aVF inferior; V1–V2 septal; V3–V4 anterior; I/aVL/V5–V6 lateral.`, source: SRC.AHA_ISCH });
  } else if (['lad', 'rad', 'normal'].includes(c)) {
    const ax = s.measured.axis; const right = c === 'lad' ? 'Left axis deviation (−30° to −90°)' : c === 'rad' ? 'Right axis deviation (+90° to +180°)' : 'Normal axis (−30° to +90°)';
    G({ area: 'C', subtopic: 'Axis', difficulty: 2, type: 'mcq', image: s.id, stem: 'Using leads I and aVF (and II if needed), what is the QRS axis?', options: [right, ...['Left axis deviation (−30° to −90°)', 'Right axis deviation (+90° to +180°)', 'Normal axis (−30° to +90°)', 'Extreme axis (−90° to ±180°)'].filter(x => x !== right)], answer: 0,
      explanation: `Lead I net QRS is ${c === 'rad' ? 'negative' : 'positive'} and aVF is ${c === 'lad' ? 'negative' : 'positive'}${c === 'lad' ? ', and lead II is also negative' : ''}. The calculated axis is about ${ax}°.`, source: SRC.DUBIN });
  } else if (['rbbb', 'lbbb'].includes(c)) {
    G({ area: 'C', subtopic: 'Bundle branch block', difficulty: 2, type: 'hotspot', image: s.id, stem: 'Tap the lead you would examine first to tell RBBB from LBBB ("turn signal" lead).',
      regions: leadOptions.map(L => s.boxes[L]), regionLabels: leadOptions, answers: [leadOptions.indexOf('V1')], explanation: `V1 is the key lead: a terminal upward R' means RBBB; a deep QS/rS means LBBB. ${t12Expl[c]}`, source: SRC.AHA_BBB });
    G({ area: 'C', subtopic: 'Bundle branch block', difficulty: 2, type: 'multi', image: s.id, stem: 'Which findings support the diagnosis on this ECG? (Select two.)',
      options: c === 'rbbb' ? ['QRS duration ≥ 0.12 s', "Terminal R' (rSR') in V1", 'Absent septal q waves with broad R in V6', 'Deep QS in V1', 'PR interval > 0.20 s'] : ['QRS duration ≥ 0.12 s', 'Broad notched R in I and V6 without q waves', "rSR' in V1", 'Wide terminal S wave in lead I', 'Delta wave'],
      answers: [0, 1], explanation: t12Expl[c], source: SRC.AHA_BBB });
  } else if (c === 'lvh') {
    G({ area: 'C', subtopic: 'Hypertrophy', difficulty: 3, type: 'mcq', image: s.id, stem: 'Using the Sokolow-Lyon criterion, which measurement supports LVH on this ECG?',
      options: [`S in V1 + R in V5/V6 ≈ ${s.measured.voltage} mm (≥ 35 mm)`, 'R in aVR ≥ 5 mm', 'QRS duration ≥ 0.12 s', 'PR interval > 0.20 s'], answer: 0, explanation: `${t12Expl.lvh} Measured S V1 + tallest R V5/V6 ≈ ${s.measured.voltage} mm.`, source: SRC.AHA_LVH });
  } else if (isRev) {
    G({ area: 'B', subtopic: 'Troubleshooting', difficulty: 2, type: 'mcq', image: s.id, stem: 'You suspect electrode misplacement on this tracing. What should you do?',
      options: ['Check and correct electrode placement, then repeat the ECG and label it as a repeat', 'Send it as is—the computer will correct it', 'Delete the leads that look abnormal', 'Report it as an acute MI'], answer: 0,
      explanation: `${t12Expl[c]} Reversals can mimic infarction or axis deviation, so the tracing must be repeated with correct placement.`, source: SRC.AHA_STD });
  }
}

// ---------------- Real image items ----------------
const realQ = {
  'real-afib-ecgpedia': ['F', 'Atrial rhythms', 'afib'], 'real-aflutter-ecgpedia': ['F', 'Atrial rhythms', 'aflutter'], 'real-vfib-ecgpedia': ['F', 'Ventricular rhythms', 'vfib'],
  'real-afib-90bpm': ['F', 'Atrial rhythms', 'afib'], 'real-nsr-rbbb-74': ['C', 'Bundle branch block', 'rbbb'], 'real-sinus-pause': ['F', 'Sinus rhythms', 'sarrest'],
  'real-mobitz2-ecg': ['F', 'Heart blocks', 'mobitz2'], 'real-normal-12lead-26m': ['C', 'Axis', 'nsr'], 'real-avb3-ecg': ['F', 'Heart blocks', 'avb3'], 'real-bigeminy': ['F', 'Ventricular rhythms', 'bigeminy'],
  'real-dual-chamber-paced': ['F', 'Pacemakers', 'avpace'], 'real-lbbb-ecg': ['C', 'Bundle branch block', 'lbbb'], 'real-junctional-ecg': ['F', 'Junctional rhythms', 'junctional'],
  'real-holter-aflutter': ['E', 'Holter analysis', 'aflutter'], 'real-svt-lead2': ['F', 'Atrial rhythms', 'svt'], 'real-pvc-arrow': ['F', 'Ventricular rhythms', 'pvc'],
};
for (const s of strips.filter(x => x.kind === 'real')) {
  const q = realQ[s.id]; if (!q) continue; const [area, sub, rid] = q;
  const right = rid === 'nsr' ? 'Normal sinus rhythm, normal 12-lead ECG' : s.id === 'real-holter-aflutter' ? 'Atrial flutter that terminates, followed by sinus rhythm' : s.id === 'real-mobitz2-ecg' ? 'Sinus rhythm with type II (Mobitz II) second-degree AV block' : NAME(rid);
  const wrong = rid === 'nsr' ? ['Left bundle branch block', 'Acute inferior STEMI', 'Atrial fibrillation'] : CONF[rid].slice(0, 3).map(NAME);
  G({ area, subtopic: sub, difficulty: 2, type: 'mcq', image: s.id, rhythm: rid, stem: `This is a real ECG recording (${area === 'E' ? 'from a Holter monitor' : 'licensed from Wikimedia Commons'}). What does it show?`,
    options: [right, ...wrong], answer: 0, explanation: `${CRIT[rid] ?? 'Normal sinus rhythm with normal intervals and axis.'} Source description: "${s.sourceDescription.slice(0, 160)}" (${s.author}, ${s.license}).`, source: `${s.title} — ${s.source}` });
}

// ---------------- Calculations ----------------
for (const age of [25, 30, 35, 40, 45, 50, 55, 60, 64, 68, 70, 75]) {
  const max = 220 - age, t = Math.round(max * 0.85);
  G({ area: 'D', subtopic: 'Protocols', difficulty: 2, type: 'mcq', tags: ['calculation'], stem: `A ${age}-year-old is scheduled for a treadmill test. Using 220 − age, what is 85% of the age-predicted maximum heart rate?`,
    options: [`${t} bpm`, `${max} bpm`, `${Math.round(max * 0.7)} bpm`, `${Math.round((200 - age) * 0.85)} bpm`].filter((v, i, a) => a.indexOf(v) === i), answer: 0,
    explanation: `APMHR = 220 − ${age} = ${max} bpm; 85% × ${max} = ${(max * 0.85).toFixed(1)} ≈ ${t} bpm. ${max} is the full predicted maximum, not the 85% target.`, source: SRC.AHA_EX });
}
for (const [boxes, speed] of [[5, 25], [3, 25], [4, 25], [7, 25], [2, 25], [10, 50], [6, 50], [8, 25], [12, 50], [9, 25], [15, 50], [11, 25], [14, 50], [6, 25], [20, 50]]) {
  const sec = boxes * (speed === 25 ? 0.04 : 0.02);
  const opts = [sec, sec * 2, sec / 2, boxes * 0.2].map(x => `${x.toFixed(2)} s`).filter((v, i, a) => a.indexOf(v) === i);
  if (opts.length < 4) opts.push(`${(sec + 0.1).toFixed(2)} s`);
  G({ area: 'B', subtopic: 'Calibration & paper', difficulty: 2, type: 'mcq', tags: ['calculation'], stem: `At a paper speed of ${speed} mm/s, an interval spans ${boxes} small boxes. How long is it?`, options: opts.slice(0, 4), answer: 0,
    explanation: `At ${speed} mm/s each 1-mm box = ${speed === 25 ? '0.04' : '0.02'} s, so ${boxes} × ${speed === 25 ? '0.04' : '0.02'} = ${sec.toFixed(2)} s.`, source: SRC.AHA_STD });
}
for (const [mm, cal] of [[15, 10], [8, 5], [30, 20], [12, 10], [6, 5], [22, 10]]) {
  const mv = mm / cal; const opts = [mv, mm / 10 === mv ? mv * 2 : mm / 10, mv / 2, mv * 2].map(x => `${+x.toFixed(2)} mV`).filter((v, i, a) => a.indexOf(v) === i);
  while (opts.length < 4) opts.push(`${+(mv + opts.length * 0.3).toFixed(2)} mV`);
  G({ area: 'B', subtopic: 'Calibration & paper', difficulty: 3, type: 'mcq', tags: ['calculation'], stem: `The calibration is set at ${cal} mm/mV. An R wave is ${mm} mm tall. What is its true amplitude?`, options: opts.slice(0, 4), answer: 0,
    explanation: `Amplitude = height ÷ calibration = ${mm} mm ÷ ${cal} mm/mV = ${+mv.toFixed(2)} mV.${cal !== 10 ? ' Always check the calibration mark before judging voltage.' : ''}`, source: SRC.AHA_STD });
}
for (const [qt, rr] of [[0.36, 0.64], [0.40, 1.0], [0.44, 0.81], [0.32, 0.49], [0.48, 0.81], [0.38, 0.64]]) {
  const qtc = qt / Math.sqrt(rr); const c = Math.round(qtc * 100) / 100;
  const opts = [c, Math.round(qt * 100) / 100 === c ? c + 0.06 : qt, c + 0.08, Math.max(0.2, c - 0.08)].map(x => `${x.toFixed(2)} s`).filter((v, i, a) => a.indexOf(v) === i);
  while (opts.length < 4) opts.push(`${(c + 0.12 + opts.length * 0.02).toFixed(2)} s`);
  G({ area: 'F', subtopic: 'Intervals & waveforms', difficulty: 3, type: 'mcq', tags: ['calculation'], stem: `The QT interval is ${qt.toFixed(2)} s and the R–R interval is ${rr.toFixed(2)} s. Using Bazett's formula, what is the QTc?`, options: opts.slice(0, 4), answer: 0,
    explanation: `QTc = QT ÷ √RR = ${qt.toFixed(2)} ÷ √${rr.toFixed(2)} = ${qt.toFixed(2)} ÷ ${Math.sqrt(rr).toFixed(2)} ≈ ${c.toFixed(2)} s. ${c >= 0.46 ? 'This is prolonged.' : 'This is within normal limits.'}`, source: SRC.AHA_QT });
}

// ---------------- Assemble, shuffle options, IDs ----------------
const hand = [...A, ...B, ...C, ...D, ...E, ...F, ...EXTRA];
const all = [...hand, ...gen].map(q => ({ ...q }));
const counters = {};
const out = [];
for (const q of all) {
  const area = q.area; counters[area] = (counters[area] || 0) + 1;
  const id = `${area}${String(counters[area]).padStart(4, '0')}`;
  const o = { id, area, areaName: AREAS[area], subtopic: q.subtopic, difficulty: q.difficulty, type: q.type, stem: q.stem };
  if (q.image) o.image = q.image;
  if (q.type === 'mcq' || q.type === 'multi') {
    const idx = shuffle(q.options.map((_, i) => i));
    o.options = idx.map(i => q.options[i]);
    if (q.type === 'mcq') o.answer = idx.indexOf(q.answer); else o.answers = q.answers.map(a => idx.indexOf(a)).sort((a, b) => a - b);
  } else if (q.type === 'order') o.items = q.items;
  else if (q.type === 'hotspot') { o.regions = q.regions; o.answers = q.answers; if (q.regionLabels) o.regionLabels = q.regionLabels; }
  o.explanation = q.explanation; o.source = q.source;
  const tags = [...(q.tags || [])]; if (q.generated) tags.push('generated-item'); if (q.image) tags.push('image');
  if (tags.length) o.tags = tags;
  if (q.rhythm) o.rhythm = q.rhythm;
  o.lesson = lessonId(area, q.subtopic);
  out.push(o);
}
function lessonId(area, sub) { return `${area}-${sub.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '')}`; }
fs.writeFileSync(path.join(ROOT, 'data/questions.json'), JSON.stringify({ version: 1, generated: new Date().toISOString().slice(0, 10), disclaimer: 'Study aid only. Not an official CCI product. Not affiliated with or endorsed by Cardiovascular Credentialing International.', count: out.length, questions: out }));
const by = {}; out.forEach(q => (by[q.area] = (by[q.area] || 0) + 1));
console.log('questions', out.length, by, 'types', out.reduce((a, q) => ((a[q.type] = (a[q.type] || 0) + 1), a), {}), 'med', out.filter(q => q.tags?.includes('medication')).length);
