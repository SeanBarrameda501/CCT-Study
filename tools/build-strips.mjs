// Builds generated ECG images (rhythm strips + 12-leads) into images/generated/ and
// writes data/strips.json. Every image is validated against textbook criteria
// (tools/criteria.mjs); the build fails if any image does not meet its criteria.
// Usage: node tools/build-strips.mjs
import fs from 'fs';
import path from 'path';
import { buildRhythm, synthesize, renderStrip, render12, measure, RHYTHMS, TWELVE } from '../js/ecg.js';
import { checkStrip, check12 } from './criteria.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT = path.join(ROOT, 'images/generated');
fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(OUT)) if (f.endsWith('.svg')) fs.unlinkSync(path.join(OUT, f));

const VARIANTS = 8;
const strips = [];
const failures = [];
const r2 = x => Math.round(x * 100) / 100;

// ---------- rhythm strips ----------
const leadFor = id => (id === 'rbbb' || id === 'lbbb' ? 'V1' : 'II');
for (const id of Object.keys(RHYTHMS)) {
  let made = 0;
  for (let seed = 1; made < VARIANTS && seed < 60; seed++) {
    const opts = { seed: seed * 97 + id.length };
    if (id === 'aflutter') opts.ratio = [2, 3, 4, 4, 2, 4, 3, 4][made];
    if (id === 'asystole' && made === VARIANTS - 1) opts.pWaves = true;
    if (id === 'junctional' || id === 'accjunct' || id === 'jtach') opts.pPos = ['before', 'none', 'after'][made % 3];
    if (id === 'mobitz1') opts.cycle = [3, 4, 4, 3, 5, 4, 3, 4][made];
    if (id === 'avb3') opts.vrate = made % 2 ? 32 + made : 42 + made;
    const rh = buildRhythm(id, opts);
    const lead = leadFor(id);
    const syn = synthesize(rh, { leads: [lead], seed: opts.seed });
    const clean = synthesize(rh, { leads: [lead], seed: opts.seed, noise: 0, wander: 0, artifact: 'none' });
    const m = measure(clean, rh);
    const verdict = checkStrip(id, rh, m, clean);
    if (!verdict.ok) { failures.push({ id, seed: opts.seed, why: verdict.why }); continue; }
    made++;
    const sid = `${id}-${made}`;
    const st = renderStrip(syn, { lead, uid: sid.replace(/[^a-z0-9]/gi, ''), tag: 'generated', aria: `Generated ECG strip, lead ${lead}` });
    fs.writeFileSync(path.join(OUT, sid + '.svg'), st.svg);
    const toX = t => r2(st.x0 + t * 25);
    strips.push({
      id: sid, file: `images/generated/${sid}.svg`, kind: 'strip', real: false, rhythm: id, name: RHYTHMS[id].name, lead,
      width: r2(st.width), height: r2(st.height), x0: st.x0, y0: st.y0,
      meta: Object.fromEntries(Object.entries(rh.meta).filter(([k]) => !['id', 'name', 'spikes'].includes(k))),
      measured: {
        vrate: m.vrate, arate: m.arate, regular: m.rrCV < 0.06,
        pr: m.pr.length ? r2(m.pr.reduce((a, b) => a + b) / m.pr.length) : null,
        prRange: m.pr.length ? [r2(Math.min(...m.pr)), r2(Math.max(...m.pr))] : null,
        qrs: m.qrs.length ? r2(Math.max(...m.qrs)) : null,
        qt: m.qt.length ? r2(m.qt[0]) : null,
        qrsIn6s: m.qrsCount6,
      },
      // beat geometry in SVG units (mm) for hot-spots and caliper hints
      beats: syn.ann.beats.filter(b => (b.qrsOn ?? b.p?.on ?? b.spikeV ?? -1) >= 0 && (b.qrsOn ?? b.p?.on ?? b.spikeV) < rh.D).map(b => ({
        p: b.p ? [toX(b.p.on), toX(b.p.off)] : null,
        q: b.qrsOn != null ? [toX(b.qrsOn), toX(b.qrsOff)] : null,
        t: b.tEnd != null ? toX(b.tEnd) : null,
        w: b.wide ? 1 : 0, l: b.label || undefined, s: b.spikeV != null ? toX(b.spikeV) : b.spikeA != null ? toX(b.spikeA) : undefined,
      })),
      spikes: (syn.ann.spikes || []).map(toX),
    });
  }
  if (made < VARIANTS) console.warn(`WARN ${id}: only ${made} valid variants`);
}

// ---------- 12-lead ECGs ----------
const T12 = {
  normal: { name: 'Normal 12-lead ECG (normal sinus rhythm, normal axis)', mods: {} },
  lad: { name: 'Left axis deviation', mods: { axis: -50 } },
  rad: { name: 'Right axis deviation', mods: { axis: 115 } },
  rbbb: { name: 'Right bundle branch block', qrs: 'rbbb', mods: {} },
  lbbb: { name: 'Left bundle branch block', qrs: 'lbbb', mods: {} },
  lvh: { name: 'Left ventricular hypertrophy with strain pattern', mods: { qrsGain: 1.9, tLead: { I: -0.4, aVL: -0.5, V5: -0.6, V6: -0.6 }, stLead: { V5: -0.08, V6: -0.08 } } },
  inferior: { name: 'Acute inferior STEMI (ST elevation II, III, aVF)', mods: { stVec: [-0.28, 1, 0].map(x => x * 0.36), qVec: [0, -0.3, 0], tScale: 1.25 }, wall: 'inferior' },
  anterior: { name: 'Acute anterior STEMI (ST elevation V1–V4)', mods: { stVec: [0.1, -0.7, 0].map(x => x * 0.12), stLead: { V1: 0.12, V2: 0.3, V3: 0.34, V4: 0.26, V5: 0.06 }, tLead: { V2: 1.5, V3: 1.6, V4: 1.4 } }, wall: 'anterior' },
  septal: { name: 'Acute septal STEMI (ST elevation V1–V2)', mods: { stLead: { V1: 0.22, V2: 0.27, V3: 0.04 }, tLead: { V1: 2.0, V2: 1.4 } }, wall: 'septal' },
  lateral: { name: 'Acute lateral STEMI (ST elevation I, aVL, V5, V6)', mods: { stVec: [0.9, -0.5, 0].map(x => x * 0.22), stLead: { V5: 0.2, V6: 0.22, V4: 0.04 } }, wall: 'lateral' },
  anterolateral: { name: 'Acute anterolateral STEMI (ST elevation V3–V6, I, aVL)', mods: { stVec: [0.9, -0.5, 0].map(x => x * 0.18), stLead: { V2: 0.08, V3: 0.25, V4: 0.3, V5: 0.25, V6: 0.18 } }, wall: 'anterolateral' },
  posterior: { name: 'Posterior MI pattern (ST depression and tall R in V1–V3)', mods: { stLead: { V1: -0.16, V2: -0.24, V3: -0.18 }, addLead: { V1: [{ c: 0.04, s: 0.012, amp: 0.55 }], V2: [{ c: 0.04, s: 0.012, amp: 0.6 }] }, tLead: { V1: 2.2, V2: 1.4 } }, wall: 'posterior' },
  ischemia: { name: 'Ischemia: horizontal ST depression (II, III, aVF, V4–V6)', mods: { stVec: [0, -1, 0].map(x => x * 0.16), stLead: { V4: -0.15, V5: -0.18, V6: -0.15 } }, wall: 'ischemia' },
  hyperk: { name: 'Peaked T waves (hyperkalemia pattern)', mods: { tPeaked: true, tScale: 2.1 } },
  rev_lara: { name: 'Limb lead reversal: left arm / right arm (LA–RA)', mods: {}, reversal: 'LA-RA' },
  rev_lall: { name: 'Limb lead reversal: left arm / left leg (LA–LL)', mods: {}, reversal: 'LA-LL' },
  rev_rall: { name: 'Limb lead reversal: right arm / left leg (RA–LL)', mods: {}, reversal: 'RA-LL' },
  rev_v1v2: { name: 'Precordial misplacement: V1 and V2 swapped', mods: {}, reversal: 'V1-V2' },
  dextro: { name: 'Dextrocardia (standard lead placement)', mods: { dextro: true } },
  afib12: { name: 'Atrial fibrillation (12-lead)', rhythm: 'afib', mods: {} },
  paced12: { name: 'Ventricular paced rhythm (12-lead)', rhythm: 'vpace', mods: {} },
  stach12: { name: 'Sinus tachycardia (12-lead)', rhythm: 'stach', mods: {} },
  avb1_12: { name: 'First-degree AV block (12-lead)', rhythm: 'avb1', mods: {} },
};
const COUNT12 = { normal: 3, lad: 2, rad: 2, rbbb: 2, lbbb: 2, lvh: 2, inferior: 3, anterior: 3, septal: 2, lateral: 2, anterolateral: 2, posterior: 1, ischemia: 2, hyperk: 1, rev_lara: 2, rev_lall: 1, rev_rall: 1, rev_v1v2: 1, dextro: 1, afib12: 1, paced12: 1, stach12: 1, avb1_12: 1 };
for (const [key, def] of Object.entries(T12)) {
  let made = 0;
  for (let seed = 1; made < COUNT12[key] && seed < 40; seed++) {
    const s = seed * 131 + key.length * 7;
    const rid = def.rhythm ?? (def.qrs === 'rbbb' ? 'rbbb' : def.qrs === 'lbbb' ? 'lbbb' : 'nsr');
    const rh = buildRhythm(rid, { seed: s, duration: 10, rate: rid === 'nsr' ? 64 + ((s * 7) % 28) : undefined });
    const syn = synthesize(rh, { leads: TWELVE, seed: s, mods: def.mods, reversal: def.reversal });
    const clean = synthesize(rh, { leads: TWELVE, seed: s, mods: def.mods, reversal: def.reversal, noise: 0, wander: 0 });
    const v = check12(key, rh, clean, def);
    if (!v.ok) { failures.push({ id: '12:' + key, seed: s, why: v.why }); continue; }
    made++;
    const sid = `12lead-${key}-${made}`;
    const out = render12(syn, { uid: sid.replace(/[^a-z0-9]/gi, ''), tag: 'generated', aria: 'Generated 12-lead ECG' });
    fs.writeFileSync(path.join(OUT, sid + '.svg'), out.svg);
    const m = measure(clean, rh);
    strips.push({
      id: sid, file: `images/generated/${sid}.svg`, kind: '12lead', real: false, condition: key, name: def.name, rhythm: rid,
      width: r2(out.width), height: r2(out.height), boxes: Object.fromEntries(Object.entries(out.boxes).map(([k, b]) => [k, [r2(b.x), r2(b.y), r2(b.w), r2(b.h)]])),
      measured: { vrate: m.vrate, axis: v.axis, st: v.st, qrs: m.qrs.length ? r2(Math.max(...m.qrs)) : null, pr: m.pr.length ? r2(m.pr[0]) : null, voltage: v.voltage },
    });
  }
  if (made < COUNT12[key]) console.warn(`WARN 12-lead ${key}: only ${made}`);
}

if (failures.length) {
  const byId = {}; failures.forEach(f => (byId[f.id] = byId[f.id] || []).push(f.why));
  console.log('Rejected variants (regenerated with new seeds):', Object.entries(byId).map(([k, v]) => `${k}×${v.length} (${v[0]})`).join('; '));
}
// real images
const realMeta = JSON.parse(fs.readFileSync(path.join(ROOT, 'images/real/real-images.json'), 'utf8'));
for (const r of realMeta) if (fs.existsSync(path.join(ROOT, r.file)) && fs.statSync(path.join(ROOT, r.file)).size > 1000) strips.push({ ...r, kind: 'real' });

fs.writeFileSync(path.join(ROOT, 'data/strips.json'), JSON.stringify({ generatedAt: new Date().toISOString().slice(0, 10), note: 'Generated images are synthetic teaching tracings (real=false). Real images are licensed recordings from Wikimedia Commons (real=true); see ATTRIBUTION.md.', images: strips }));
const bytes = fs.readdirSync(OUT).reduce((s, f) => s + fs.statSync(path.join(OUT, f)).size, 0);
console.log(`strips: ${strips.filter(s => s.kind === 'strip').length}, 12-leads: ${strips.filter(s => s.kind === '12lead').length}, real: ${strips.filter(s => s.kind === 'real').length}, generated bytes: ${(bytes / 1e6).toFixed(2)} MB`);
