// ecg.js — deterministic ECG synthesizer used by the build tools (Node) and the app (browser).
// Model: each wave (P, QRS parts, T, ST) is a time-Gaussian with a 3-D cardiac vector.
// Leads are projections of that vector, so Einthoven's law (II = I + III) holds exactly.
// Coordinates: x = patient's left, y = inferior, z = anterior. Amplitudes in mV, time in s.
// Not a physiological simulator — a teaching tool whose intervals/rates are set explicitly
// and then verified by tools/validate-strips.mjs against textbook criteria.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const deg = d => (d * Math.PI) / 180;
const norm = v => { const m = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / m, v[1] / m, v[2] / m]; };
const sc = (v, s) => [v[0] * s, v[1] * s, v[2] * s];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const rotZ = (v, d) => { const c = Math.cos(deg(d)), s = Math.sin(deg(d)); return [v[0] * c - v[1] * s, v[0] * s + v[1] * c, v[2]]; };
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const rand = (r, a, b) => a + (b - a) * r();
const gauss = r => { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };

// ---------- Lead vectors ----------
const pre = (a, g, y = 0) => [Math.cos(deg(a)) * g, y * g, Math.sin(deg(a)) * g];
const I = [1, 0, 0], II = [Math.cos(deg(60)), Math.sin(deg(60)), 0], III = [Math.cos(deg(120)), Math.sin(deg(120)), 0];
export const LEADS = {
  I, II, III,
  aVR: [-(I[0] + II[0]) / 2, -(I[1] + II[1]) / 2, 0],
  aVL: [(I[0] - III[0]) / 2, (I[1] - III[1]) / 2, 0],
  aVF: [(II[0] + III[0]) / 2, (II[1] + III[1]) / 2, 0],
  V1: pre(120, 1.0), V2: pre(95, 1.35), V3: pre(75, 1.45, 0.1), V4: pre(52, 1.35, 0.15), V5: pre(28, 1.15, 0.15), V6: pre(5, 1.0, 0.15),
  V4R: pre(128, 0.9), V7: pre(-20, 0.8), V8: pre(-45, 0.7), V9: pre(-70, 0.65),
};
const LIMB = new Set(['I', 'II', 'III', 'aVR', 'aVL', 'aVF']);
export const TWELVE = ['I', 'II', 'III', 'aVR', 'aVL', 'aVF', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6'];

// ---------- Morphology library (times relative to wave onset) ----------
// comp: {c: centre (s), sl, sr: sigma left/right, v: vector (mV)}
const P_SINUS = [{ c: 0.035, sl: 0.016, sr: 0.016, v: sc(norm([0.25, 0.8, 0.45]), 0.17) }, { c: 0.062, sl: 0.016, sr: 0.017, v: sc(norm([0.75, 0.6, -0.35]), 0.13) }];
const P_ECTOPIC = [{ c: 0.045, sl: 0.02, sr: 0.02, v: sc(norm([0.7, 0.3, -0.2]), 0.16) }];
const P_RETRO = [{ c: 0.035, sl: 0.016, sr: 0.016, v: sc(norm([-0.25, -0.95, 0.15]), 0.17) }];
const P_LOW = [{ c: 0.045, sl: 0.02, sr: 0.02, v: sc(norm([0.2, -0.5, 0.5]), 0.12) }];
const P_DUR = 0.1; // onset → offset for the sinus P

function qrsNormal(o = {}) {
  const rot = (o.axis ?? 55) - 55, k = o.gain ?? 1;
  const r = v => rotZ(v, rot);
  return {
    dur: 0.09,
    comps: [
      { c: 0.012, sl: 0.0065, sr: 0.0065, v: r(sc(norm([-0.45, 0.2, 0.85]), 0.24)) },
      { c: 0.036, sl: 0.0105, sr: 0.0105, v: r(sc(norm([0.45, 0.8, 0.45]), 1.25 * k)) },
      { c: 0.053, sl: 0.0095, sr: 0.0095, v: r(sc(norm([0.78, 0.22, -0.6]), 1.15 * k)) },
      { c: 0.072, sl: 0.0075, sr: 0.0075, v: r(sc(norm([-0.4, -0.5, -0.75]), 0.3)) },
    ],
    t: sc(norm([0.62, 0.62, 0.42]), 0.4),
  };
}
function qrsRBBB(o = {}) {
  const n = qrsNormal(o);
  n.comps = n.comps.slice(0, 3).concat([{ c: 0.104, sl: 0.02, sr: 0.016, v: sc(norm([-0.6, 0.05, 0.8]), 0.85) }]);
  n.dur = 0.13; n.t = sc(norm([0.7, 0.55, -0.35]), 0.25); // secondary T change (inverted V1–V2)
  return n;
}
function qrsLBBB(o = {}) {
  const rot = (o.axis ?? 30) - 30, r = v => rotZ(v, rot);
  return {
    dur: 0.15,
    comps: [
      { c: 0.02, sl: 0.012, sr: 0.012, v: r(sc(norm([0.65, 0.2, -0.45]), 0.32)) },
      { c: 0.06, sl: 0.028, sr: 0.026, v: r(sc(norm([0.7, 0.28, -0.78]), 1.45)) },
      { c: 0.112, sl: 0.018, sr: 0.017, v: r(sc(norm([0.72, 0.05, -0.75]), 0.95)) },
    ],
    t: r(sc(norm([-0.75, -0.2, 0.6]), 0.32)), st: r(sc(norm([-0.75, -0.2, 0.6]), 0.08)),
  };
}
function qrsWide(seed, o = {}) { // PVC / VT / idioventricular — focus varies with seed
  const r = mulberry32(seed);
  const ang = o.angle ?? rand(r, -160, 160), up = o.z ?? rand(r, -0.8, 0.8);
  const v1 = norm([Math.cos(deg(ang)), Math.sin(deg(ang)), up]);
  const amp = o.amp ?? rand(r, 1.2, 1.8);
  return {
    dur: o.dur ?? rand(r, 0.14, 0.17),
    comps: [
      { c: 0.05, sl: 0.028, sr: 0.03, v: sc(v1, amp) },
      { c: 0.115, sl: 0.022, sr: 0.02, v: sc(norm([-v1[0] + 0.2, -v1[1] * 0.6, -v1[2]]), amp * 0.35) },
    ],
    t: sc(v1, -0.42), st: sc(v1, -0.1),
  };
}
function qrsPaced() { // RV apical pacing: LBBB-like, superior axis
  return {
    dur: 0.16,
    comps: [
      { c: 0.05, sl: 0.026, sr: 0.028, v: sc(norm([0.45, -0.75, -0.5]), 1.3) },
      { c: 0.115, sl: 0.02, sr: 0.02, v: sc(norm([0.5, -0.4, -0.7]), 0.6) },
    ],
    t: sc(norm([-0.4, 0.8, 0.45]), 0.35), st: sc(norm([-0.4, 0.8, 0.45]), 0.06),
  };
}
const QRS = { normal: qrsNormal, rbbb: qrsRBBB, lbbb: qrsLBBB, paced: qrsPaced };

// ---------- Rhythm definitions ----------
// Each builder returns {beats, atrial, meta}. beat: {p?:{t,shape}, qrs?:{t,morph,label}, spikeA?, spikeV?, label}
export const RHYTHMS = {
  nsr: { name: 'Normal sinus rhythm', rate: [62, 98] },
  sbrady: { name: 'Sinus bradycardia', rate: [40, 56] },
  stach: { name: 'Sinus tachycardia', rate: [106, 150] },
  sinarr: { name: 'Sinus arrhythmia', rate: [58, 85] },
  sarrest: { name: 'Sinus arrest / pause', rate: [64, 88] },
  pac: { name: 'Sinus rhythm with PACs', rate: [66, 92] },
  afib: { name: 'Atrial fibrillation', rate: [70, 140] },
  aflutter: { name: 'Atrial flutter', rate: [250, 320] },
  svt: { name: 'Supraventricular tachycardia (SVT)', rate: [160, 220] },
  mat: { name: 'Multifocal atrial tachycardia', rate: [105, 135] },
  wap: { name: 'Wandering atrial pacemaker', rate: [62, 90] },
  junctional: { name: 'Junctional escape rhythm', rate: [42, 58] },
  accjunct: { name: 'Accelerated junctional rhythm', rate: [64, 98] },
  jtach: { name: 'Junctional tachycardia', rate: [106, 140] },
  pjc: { name: 'Sinus rhythm with PJCs', rate: [66, 90] },
  pvc: { name: 'Sinus rhythm with unifocal PVCs', rate: [64, 92] },
  bigeminy: { name: 'Ventricular bigeminy', rate: [66, 88] },
  trigeminy: { name: 'Ventricular trigeminy', rate: [66, 90] },
  couplet: { name: 'Sinus rhythm with a PVC couplet', rate: [66, 90] },
  multifocal: { name: 'Sinus rhythm with multifocal PVCs', rate: [66, 90] },
  vtach: { name: 'Ventricular tachycardia (monomorphic)', rate: [150, 210] },
  torsades: { name: 'Torsades de pointes', rate: [200, 250] },
  vfib: { name: 'Ventricular fibrillation (coarse)', rate: [0, 0] },
  vfibfine: { name: 'Ventricular fibrillation (fine)', rate: [0, 0] },
  asystole: { name: 'Asystole', rate: [0, 0] },
  idio: { name: 'Idioventricular rhythm', rate: [24, 38] },
  aivr: { name: 'Accelerated idioventricular rhythm', rate: [45, 95] },
  avb1: { name: 'First-degree AV block', rate: [60, 90] },
  mobitz1: { name: 'Second-degree AV block, Mobitz I (Wenckebach)', rate: [68, 96] },
  mobitz2: { name: 'Second-degree AV block, Mobitz II', rate: [70, 100] },
  avb21: { name: 'Second-degree AV block with 2:1 conduction', rate: [72, 96] },
  avb3: { name: 'Third-degree (complete) AV block', rate: [68, 100] },
  rbbb: { name: 'Sinus rhythm with right bundle branch block', rate: [62, 92] },
  lbbb: { name: 'Sinus rhythm with left bundle branch block', rate: [62, 92] },
  apace: { name: 'Atrial paced rhythm', rate: [60, 80] },
  vpace: { name: 'Ventricular paced rhythm', rate: [60, 80] },
  avpace: { name: 'AV (dual-chamber) paced rhythm', rate: [60, 80] },
  failcapture: { name: 'Pacemaker failure to capture', rate: [60, 72] },
  failsense: { name: 'Pacemaker failure to sense (undersensing)', rate: [60, 72] },
  art_tremor: { name: 'Artifact: muscle tremor (somatic)', rate: [64, 90] },
  art_wander: { name: 'Artifact: wandering baseline', rate: [64, 90] },
  art_60hz: { name: 'Artifact: 60-cycle (AC) interference', rate: [64, 90] },
  art_loose: { name: 'Artifact: loose / detached lead', rate: [64, 90] },
};

const QTC = 0.41;
const qtFor = rr => clamp(QTC * Math.sqrt(rr), 0.28, 0.5);

function sinusTrain(r, D, rate, o = {}) {
  const beats = []; let t = rand(r, 0.1, 0.5); const rr0 = 60 / rate;
  let i = 0;
  while (t < D + 0.5) {
    let rr = rr0 * (1 + gauss(r) * (o.jitter ?? 0.012));
    if (o.resp) rr = rr0 * (1 + o.resp * Math.sin(2 * Math.PI * t / o.respT + o.ph));
    beats.push({ p: { t, shape: 'sinus' }, pr: o.pr ?? 0.16, i: i++ });
    t += rr;
  }
  return beats;
}
function conducted(beats, pr, morph) {
  return beats.map(b => ({ ...b, qrs: b.qrs ?? (b.p ? { t: b.p.t + (b.pr ?? pr), morph } : null) }));
}

export function buildRhythm(id, opts = {}) {
  const r = mulberry32(opts.seed ?? 1);
  const D = opts.duration ?? 6;
  const def = RHYTHMS[id];
  if (!def) throw new Error('unknown rhythm ' + id);
  const rate = opts.rate ?? Math.round(rand(r, def.rate[0], def.rate[1]));
  const pr = opts.pr ?? +rand(r, 0.14, 0.18).toFixed(3);
  const base = opts.qrs ?? 'normal';
  let beats = [], atrial = null, meta = { id, name: def.name, rate };
  const N = () => base;
  switch (id) {
    case 'nsr': case 'sbrady': case 'stach': case 'rbbb': case 'lbbb': case 'art_tremor': case 'art_wander': case 'art_60hz': case 'art_loose': {
      const m = id === 'rbbb' ? 'rbbb' : id === 'lbbb' ? 'lbbb' : N();
      const p = id === 'stach' ? Math.min(pr, 0.15) : pr;
      beats = conducted(sinusTrain(r, D, rate, { pr: p }), p, m); meta.pr = p; break;
    }
    case 'avb1': {
      const p = opts.pr ?? +rand(r, 0.24, 0.34).toFixed(3);
      beats = conducted(sinusTrain(r, D, rate, { pr: p }), p, N()); meta.pr = p; break;
    }
    case 'sinarr': {
      const respT = rand(r, 3.2, 4.2);
      beats = conducted(sinusTrain(r, D, rate, { pr, resp: 0.2, respT, ph: rand(r, 0, 6) }), pr, N()); meta.pr = pr; break;
    }
    case 'sarrest': {
      const rr = 60 / rate; let t = rand(r, 0.15, 0.4); const pauseAt = 2 + Math.floor(r() * 2);
      let k = 0;
      while (t < D + 0.5) {
        beats.push({ p: { t, shape: 'sinus' }, pr, qrs: { t: t + pr, morph: N() } });
        k++; t += (k === pauseAt ? rr * rand(r, 2.3, 2.7) : rr * (1 + gauss(r) * 0.01));
        if (k === pauseAt) beats[beats.length - 1].label = 'before-pause';
      }
      meta.pr = pr; meta.pause = true; break;
    }
    case 'pac': case 'pjc': {
      const rr = 60 / rate; let t = rand(r, 0.15, 0.4); let k = 0; const ectopicAt = new Set([2 + Math.floor(r() * 2), 6 + Math.floor(r() * 2)]);
      while (t < D + 0.5) {
        k++;
        if (ectopicAt.has(k)) {
          const te = t - rr + rr * rand(r, 0.6, 0.68);
          if (id === 'pac') beats.push({ p: { t: te, shape: 'ectopic' }, pr: pr - 0.01, qrs: { t: te + pr - 0.01, morph: N() }, label: 'PAC' });
          else beats.push({ p: { t: te + 0.04, shape: 'retro' }, qrs: { t: te + 0.1, morph: N() }, label: 'PJC' });
          t = te + rr * (id === 'pac' ? 1.0 : 1.04); // non-compensatory pause
          continue;
        }
        beats.push({ p: { t, shape: 'sinus' }, pr, qrs: { t: t + pr, morph: N() } }); t += rr * (1 + gauss(r) * 0.01);
      }
      meta.pr = pr; break;
    }
    case 'pvc': case 'bigeminy': case 'trigeminy': case 'couplet': case 'multifocal': {
      // Sinus schedule t_k; a PVC replaces slot k (its sinus P is buried) -> full compensatory pause.
      const rr = 60 / rate, t0 = rand(r, 0.15, 0.35), fseed = (opts.seed ?? 1) * 7 + 3;
      const isPvc = k => id === 'bigeminy' ? k % 2 === 1 : id === 'trigeminy' ? k % 3 === 2 : id === 'couplet' ? (k === 3 || k === 4) : (k === 2 || k === 6 || (id === 'multifocal' && k === 4));
      let focus = 0, lastQ = null;
      for (let k = 0; t0 + k * rr < D + 0.6; k++) {
        const tk = t0 + k * rr + gauss(r) * 0.004;
        if (k > 0 && isPvc(k) && lastQ != null) {
          const tq = lastQ + rr * (id === 'couplet' && k === 4 ? 0.58 : rand(r, 0.55, 0.62));
          beats.push({ qrs: { t: tq, morph: 'wide', fseed: id === 'multifocal' ? fseed + (focus++) * 101 : fseed }, label: 'PVC' });
          lastQ = tq; continue;
        }
        beats.push({ p: { t: tk, shape: 'sinus' }, pr, qrs: { t: tk + pr, morph: N() } }); lastQ = tk + pr;
      }
      meta.pr = pr; break;
    }
    case 'afib': {
      let t = rand(r, 0.05, 0.4); const mean = 60 / rate;
      while (t < D + 0.5) { beats.push({ qrs: { t, morph: N() } }); t += clamp(mean * (1 + gauss(r) * 0.24), 0.32, mean * 1.9); }
      atrial = { type: 'fib', amp: rand(r, 0.06, 0.1), seed: (opts.seed ?? 1) + 11 }; break;
    }
    case 'aflutter': {
      const arate = rate, ratio = opts.ratio ?? [2, 3, 4, 4][Math.floor(r() * 4)];
      const F = 60 / arate, ph = rand(r, 0, F);
      atrial = { type: 'flutter', period: F, phase: ph, amp: rand(r, 0.26, 0.34) };
      for (let n = 1; ph + n * F < D + 0.5; n++) if (n % ratio === 0) beats.push({ qrs: { t: ph + n * F + 0.12, morph: N() } });
      meta.ratio = ratio; meta.vrate = Math.round(arate / ratio); break;
    }
    case 'svt': {
      let t = rand(r, 0.05, 0.25); const rr = 60 / rate;
      while (t < D + 0.5) { beats.push({ qrs: { t, morph: N() } }); t += rr * (1 + gauss(r) * 0.004); }
      break;
    }
    case 'mat': case 'wap': {
      let t = rand(r, 0.1, 0.3); const shapes = ['sinus', 'ectopic', 'low', 'retro2'];
      while (t < D + 0.5) {
        const s = shapes[Math.floor(r() * 3)]; const p = +rand(r, 0.12, 0.2).toFixed(3);
        beats.push({ p: { t, shape: s }, pr: p, qrs: { t: t + p, morph: N() } });
        t += (60 / rate) * (1 + gauss(r) * 0.12);
      }
      meta.variablePR = true; break;
    }
    case 'junctional': case 'accjunct': case 'jtach': {
      let t = rand(r, 0.1, 0.4); const rr = 60 / rate; const pos = opts.pPos ?? ['before', 'none', 'after'][Math.floor(r() * 3)];
      while (t < D + 0.5) {
        const b = { qrs: { t, morph: N() } };
        if (pos === 'before') { b.p = { t: t - 0.09, shape: 'retro' }; b.pr = 0.09; }
        if (pos === 'after') b.p = { t: t + 0.11, shape: 'retro' };
        beats.push(b); t += rr * (1 + gauss(r) * 0.006);
      }
      meta.pPos = pos; break;
    }
    case 'vtach': {
      let t = rand(r, 0.05, 0.25); const rr = 60 / rate; const fs = (opts.seed ?? 1) * 13;
      while (t < D + 0.5) { beats.push({ qrs: { t, morph: 'wide', fseed: fs } }); t += rr * (1 + gauss(r) * 0.005); }
      break;
    }
    case 'idio': case 'aivr': {
      let t = rand(r, 0.2, 0.8); const rr = 60 / rate; const fs = (opts.seed ?? 1) * 17;
      while (t < D + 0.5) { beats.push({ qrs: { t, morph: 'wide', fseed: fs } }); t += rr * (1 + gauss(r) * 0.01); }
      break;
    }
    case 'torsades': atrial = { type: 'torsades', rate, seed: opts.seed ?? 1 }; break;
    case 'vfib': atrial = { type: 'vfib', amp: rand(r, 0.35, 0.6), seed: opts.seed ?? 1 }; break;
    case 'vfibfine': atrial = { type: 'vfib', amp: rand(r, 0.08, 0.14), seed: opts.seed ?? 1 }; break;
    case 'asystole': {
      if (opts.pWaves) { meta.pWaves = true; meta.name = 'Ventricular standstill (P-wave asystole)'; let t = 0.3; while (t < D) { beats.push({ p: { t, shape: 'sinus' } }); t += 60 / 60; } }
      break;
    }
    case 'mobitz1': {
      const rr = 60 / rate; let t = rand(r, 0.1, 0.3); const cyc = opts.cycle ?? (3 + Math.floor(r() * 2)); // P's per group
      const pr0 = +rand(r, 0.16, 0.2).toFixed(3), incs = [0, 0.1, 0.05, 0.03, 0.02];
      let n = Math.floor(r() * cyc); // start mid-cycle
      while (t < D + 0.5) {
        const pos = n % cyc;
        if (pos === cyc - 1) beats.push({ p: { t, shape: 'sinus' }, label: 'dropped' });
        else { let p = pr0; for (let j = 1; j <= pos; j++) p += incs[j]; beats.push({ p: { t, shape: 'sinus' }, pr: p, qrs: { t: t + p, morph: N() } }); }
        n++; t += rr * (1 + gauss(r) * 0.006);
      }
      meta.cycle = cyc; meta.pr0 = pr0; break;
    }
    case 'mobitz2': case 'avb21': {
      const rr = 60 / rate; let t = rand(r, 0.1, 0.3); let n = 0;
      const p = +rand(r, 0.15, 0.19).toFixed(3); const drops = id === 'avb21' ? (k => k % 2 === 1) : (k => k === 3 || k === 7 || (opts.extraDrop && k === 10));
      const m = id === 'mobitz2' && opts.wide !== false ? (r() < 0.5 ? 'rbbb' : 'normal') : N();
      while (t < D + 0.5) {
        if (drops(n)) beats.push({ p: { t, shape: 'sinus' }, label: 'dropped' });
        else beats.push({ p: { t, shape: 'sinus' }, pr: p, qrs: { t: t + p, morph: m } });
        n++; t += rr * (1 + gauss(r) * 0.005);
      }
      meta.pr = p; break;
    }
    case 'avb3': {
      const vr = opts.vrate ?? (r() < 0.5 ? Math.round(rand(r, 32, 40)) : Math.round(rand(r, 42, 52)));
      const escape = vr < 41 ? 'ventricular' : 'junctional';
      let t = rand(r, 0.05, 0.3); while (t < D + 0.5) { beats.push({ p: { t, shape: 'sinus' } }); t += (60 / rate) * (1 + gauss(r) * 0.006); }
      let tv = rand(r, 0.3, 0.9); const fs = (opts.seed ?? 1) * 19;
      while (tv < D + 0.5) { beats.push({ qrs: { t: tv, morph: escape === 'ventricular' ? 'wide' : N(), fseed: fs } }); tv += (60 / vr) * (1 + gauss(r) * 0.005); }
      meta.vrate = vr; meta.escape = escape; meta.arate = rate; break;
    }
    case 'apace': case 'vpace': case 'avpace': case 'failcapture': case 'failsense': {
      const rr = 60 / rate; let t = rand(r, 0.15, 0.4); let k = 0; const av = 0.16;
      while (t < D + 0.5) {
        k++;
        if (id === 'apace') beats.push({ spikeA: t, p: { t: t + 0.01, shape: 'sinus' }, pr: pr, qrs: { t: t + pr, morph: N() } });
        else if (id === 'avpace') beats.push({ spikeA: t, p: { t: t + 0.01, shape: 'sinus' }, spikeV: t + av, qrs: { t: t + av + 0.005, morph: 'paced' } });
        else if (id === 'vpace') beats.push({ spikeV: t, qrs: { t: t + 0.005, morph: 'paced' } });
        else if (id === 'failcapture') {
          if (k === 3 || k === 6) beats.push({ spikeV: t, label: 'noncapture' });
          else beats.push({ spikeV: t, qrs: { t: t + 0.005, morph: 'paced' } });
        }
        t += rr;
      }
      if (id === 'failsense') { // intrinsic sinus rhythm; pacer fires spikes that ignore it (land on ST/T)
        const srate = Math.round(rand(r, 70, 84)); beats = conducted(sinusTrain(r, D, srate, { pr }), pr, N());
        const spikes = []; beats.forEach((b, i) => { if (i % 3 === 1) spikes.push(b.qrs.t + rand(r, 0.14, 0.26)); });
        meta.spikes = spikes; meta.srate = srate; meta.pr = pr;
      }
      break;
    }
    default: throw new Error('no builder ' + id);
  }
  return { beats: beats.filter(b => (b.qrs?.t ?? b.p?.t ?? 0) < D + 0.6), atrial, meta, D };
}

// ---------- Signal synthesis ----------
const PSHAPES = { sinus: P_SINUS, ectopic: P_ECTOPIC, retro: P_RETRO, low: P_LOW, retro2: P_RETRO };

function addComp(sig, fs, t0, comp, proj) {
  const amp = proj(comp.v); if (Math.abs(amp) < 1e-4) return;
  const c = t0 + comp.c, a = Math.max(0, Math.floor((c - 5 * comp.sl) * fs)), b = Math.min(sig.length - 1, Math.ceil((c + 5 * comp.sr) * fs));
  for (let i = a; i <= b; i++) { const d = i / fs - c, s = d < 0 ? comp.sl : comp.sr; sig[i] += amp * Math.exp(-0.5 * (d / s) * (d / s)); }
}
function addPlateau(sig, fs, a, b, amp) { // smooth step up at a, down at b
  if (Math.abs(amp) < 1e-4) return;
  const i0 = Math.max(0, Math.floor((a - 0.05) * fs)), i1 = Math.min(sig.length - 1, Math.ceil((b + 0.12) * fs));
  for (let i = i0; i <= i1; i++) { const t = i / fs; sig[i] += amp / (1 + Math.exp(-(t - a) / 0.006)) / (1 + Math.exp((t - b) / 0.035)); }
}

// opts: {leads:[...], fs, seed, mods:{stVec, stLead:{V1:..}, tLead:{..}, tScale, qrsGain}, reversal, noise, wander, artifact}
export function synthesize(rhythm, opts = {}) {
  const fs = opts.fs ?? 500, D = rhythm.D, n = Math.round(D * fs) + 1;
  const r = mulberry32((opts.seed ?? 1) * 31 + 7);
  const leads = opts.leads ?? ['II'];
  const mods = opts.mods ?? {};
  const qrsOpts = { axis: mods.axis, gain: mods.qrsGain };
  const out = {}; const ann = { beats: [], spikes: [] };
  const physLeads = ['I', 'II', 'III', 'aVR', 'aVL', 'aVF', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V4R', 'V7', 'V8', 'V9'];
  const need = new Set(leads.map(l => reverseSource(l, opts.reversal)).flatMap(x => x.src));
  const raw = {};
  // per-beat jitter shared by all leads
  const jit = rhythm.beats.map(() => ({ a: 1 + gauss(r) * 0.035, t: 1 + gauss(r) * 0.05 }));
  for (const L of physLeads) {
    if (!need.has(L)) continue;
    let lv = LEADS[L]; if (mods.dextro) lv = lv; // handled via vector mirror below
    const mir = v => (mods.dextro ? [-v[0], v[1], v[2]] : v);
    const sig = new Float64Array(n);
    rhythm.beats.forEach((b, bi) => {
      const j = jit[bi];
      const proj = v => dot(mir(v), lv) * j.a;
      if (b.p) for (const c of PSHAPES[b.p.shape] || P_SINUS) addComp(sig, fs, b.p.t, c, proj);
      if (b.qrs) {
        const m = b.qrs.morph === 'wide' ? qrsWide(b.qrs.fseed ?? 5) : QRS[b.qrs.morph](qrsOpts);
        const gain = (b.qrs.morph === 'normal' && mods.qrsGainLead?.[L]) || 1;
        for (const c of m.comps) addComp(sig, fs, b.qrs.t, c, v => proj(v) * gain);
        const rrNext = nextRR(rhythm.beats, bi);
        const qt = (mods.qt ?? qtFor(rrNext)) * (m.dur > 0.12 ? 1.08 : 1);
        const tEnd = b.qrs.t + qt, sr = 0.042, tp = tEnd - 2.3 * sr;
        let tVec = m.t; const tl = (mods.tLead?.[L] ?? 1) * (mods.tScale ?? 1) * j.t;
        const tsig = mods.tPeaked ? 0.75 : 1;
        addComp(sig, fs, 0, { c: tp, sl: 0.068 * tsig, sr: sr * tsig, v: tVec }, v => proj(v) * tl);
        if (m.st) addPlateau(sig, fs, b.qrs.t + m.dur, tp, proj(m.st));
        if (mods.u) addComp(sig, fs, 0, { c: tEnd + 0.08, sl: 0.035, sr: 0.035, v: sc(norm([0.3, 0.5, 0.8]), mods.u) }, proj);
        const stv = mods.stVec && LIMB.has(L) ? proj(mods.stVec) : 0;
        if (mods.addLead?.[L] && b.qrs.morph !== 'wide') for (const c of mods.addLead[L]) addComp(sig, fs, b.qrs.t, { c: c.c, sl: c.s, sr: c.s, v: [c.amp, 0, 0] }, v => v[0]); const stl = mods.stLead?.[L] ?? 0;
        if ((stv || stl) && b.qrs.morph !== 'wide') addPlateau(sig, fs, b.qrs.t + m.dur - 0.004, tp + 0.02, stv + stl);
        if (mods.qVec && b.qrs.morph === 'normal') addComp(sig, fs, b.qrs.t, { c: 0.02, sl: 0.01, sr: 0.012, v: mods.qVec }, proj);
        if (L === leads[0] || bi >= 0) ann._q = ann._q || {};
        ann._tmp = ann._tmp || []; ann._tmp[bi] = { qrsOn: b.qrs.t, qrsOff: b.qrs.t + m.dur, tEnd, wide: m.dur >= 0.12 };
      }
    });
    addAtrial(sig, fs, rhythm, L, lv, mir);
    raw[L] = sig;
  }
  // spikes (added to every lead, unaffected by vector)
  const spikes = [];
  rhythm.beats.forEach(b => { if (b.spikeA != null) spikes.push({ t: b.spikeA, k: 'A' }); if (b.spikeV != null) spikes.push({ t: b.spikeV, k: 'V' }); });
  (rhythm.meta.spikes || []).forEach(t => spikes.push({ t, k: 'V' }));
  // compose displayed leads (with lead reversal)
  for (const L of leads) {
    const { src, f } = reverseSource(L, opts.reversal);
    const sig = new Float64Array(n);
    for (let i = 0; i < n; i++) sig[i] = f(...src.map(s => raw[s][i]));
    for (const s of spikes) { const i = Math.round(s.t * fs); for (let k = 0; k < 2 && i + k < n; k++) sig[i + k] += (s.k === 'A' ? 1.0 : 1.6) * (k === 0 ? 1 : 0.6); }
    addNoise(sig, fs, r, opts, rhythm);
    out[L] = sig;
  }
  // annotations
  rhythm.beats.forEach((b, bi) => {
    const a = { p: b.p ? { on: b.p.t + 0.006, off: b.p.t + P_DUR, shape: b.p.shape } : null, label: b.label || null };
    const tm = ann._tmp?.[bi];
    if (b.qrs && tm) Object.assign(a, { qrsOn: tm.qrsOn, qrsOff: tm.qrsOff, tEnd: tm.tEnd, wide: tm.wide, pr: b.pr ?? null, morph: b.qrs.morph });
    if (b.spikeA != null) a.spikeA = b.spikeA; if (b.spikeV != null) a.spikeV = b.spikeV;
    ann.beats.push(a);
  });
  ann.spikes = spikes.map(s => s.t);
  delete ann._tmp; delete ann._q;
  return { fs, D, leads: out, ann };
}
function nextRR(beats, bi) {
  const t = beats[bi].qrs.t; let best = 1.0;
  for (const b of beats) if (b.qrs && b.qrs.t > t + 0.2) { best = Math.min(best === 1.0 ? 9 : best, b.qrs.t - t); }
  return clamp(best === 9 ? 1 : best, 0.3, 1.6);
}
function addAtrial(sig, fs, rh, L, lv, mir) {
  const a = rh.atrial; if (!a) return; const n = sig.length;
  if (a.type === 'fib') {
    const r = mulberry32(a.seed); const comps = Array.from({ length: 6 }, () => ({ f: rand(r, 4.5, 8.5), ph: rand(r, 0, 6.28), w: rand(r, 0.5, 1) }));
    const p = dot(mir(norm([0.3, 0.5, 0.8])), lv);
    for (let i = 0; i < n; i++) { const t = i / fs; let s = 0; for (const c of comps) s += c.w * Math.sin(2 * Math.PI * c.f * t + c.ph); sig[i] += a.amp * p * s / 2.4 * (0.75 + 0.25 * Math.sin(t * 1.3)); }
  } else if (a.type === 'flutter') {
    const p = dot(mir(norm([-0.1, -0.85, 0.5])), lv);
    for (let i = 0; i < n; i++) { const t = i / fs; let ph = ((t - a.phase) / a.period) % 1; if (ph < 0) ph += 1; const saw = ph < 0.78 ? 1 - 2 * (ph / 0.78) : -1 + 2 * ((ph - 0.78) / 0.22); sig[i] += a.amp * p * -saw * 0.9; }
  } else if (a.type === 'vfib') {
    const r = mulberry32(a.seed); const comps = Array.from({ length: 5 }, () => ({ f: rand(r, 3.5, 7), ph: rand(r, 0, 6.28), w: rand(r, 0.4, 1) }));
    const p = 0.6 + 0.4 * Math.abs(dot(norm([0.5, 0.7, 0.3]), lv));
    for (let i = 0; i < n; i++) { const t = i / fs; let s = 0; for (const c of comps) s += c.w * Math.sin(2 * Math.PI * c.f * t + c.ph + 0.6 * Math.sin(t * 0.9 + c.ph)); sig[i] += a.amp * p * s / 2.2 * (0.6 + 0.4 * Math.sin(t * 1.7 + 1)); }
  } else if (a.type === 'torsades') {
    const f = a.rate / 60, p = 0.8 + 0.2 * Math.abs(dot(norm([0.5, 0.7, 0.3]), lv));
    for (let i = 0; i < n; i++) { const t = i / fs; const env = 0.25 + 0.9 * Math.abs(Math.sin(Math.PI * t / 2.6)); const ph = 2 * Math.PI * f * t; sig[i] += p * env * (1.1 * Math.sin(ph) + 0.25 * Math.sin(2 * ph + 1)); }
  }
}
function addNoise(sig, fs, r, opts, rh) {
  const n = sig.length, art = opts.artifact ?? (rh.meta.id.startsWith('art_') ? rh.meta.id.slice(4) : null);
  const w = { f: rand(r, 0.12, 0.3), ph: rand(r, 0, 6), f2: rand(r, 0.4, 0.7), ph2: rand(r, 0, 6) };
  const wanderAmp = opts.wander ?? 0.04;
  let lp = 0;
  for (let i = 0; i < n; i++) {
    const t = i / fs;
    sig[i] += wanderAmp * (Math.sin(2 * Math.PI * w.f * t + w.ph) + 0.4 * Math.sin(2 * Math.PI * w.f2 * t + w.ph2));
    lp = 0.75 * lp + 0.25 * gauss(r) * (opts.noise ?? 0.012); sig[i] += lp;
  }
  if (art === 'wander') for (let i = 0; i < n; i++) { const t = i / fs; sig[i] += 0.55 * Math.sin(2 * Math.PI * 0.28 * t + w.ph) + 0.25 * Math.sin(2 * Math.PI * 0.6 * t + w.ph2); }
  if (art === '60hz') { const A = rand(r, 0.06, 0.1); for (let i = 0; i < n; i++) sig[i] += A * Math.sin(2 * Math.PI * 60 * i / fs); }
  if (art === 'tremor') {
    let s = 0, s2 = 0; const bursts = [[rand(r, 0.3, 1.5), rand(r, 2.5, 3.5)], [rand(r, 3.8, 4.4), rand(r, 5.4, 6)]];
    for (let i = 0; i < n; i++) { const t = i / fs; const on = bursts.some(([a, b]) => t > a && t < b) ? 1 : 0.25; s = 0.45 * s + gauss(r) * 0.11; s2 = 0.3 * s2 + 0.7 * s; sig[i] += on * s2; }
  }
  if (art === 'loose') {
    const a = rand(r, 2.0, 2.8), b = a + rand(r, 1.0, 1.6);
    for (let i = 0; i < n; i++) { const t = i / fs; if (t > a && t < b) { const k = (t - a) / (b - a); sig[i] = k < 0.15 ? sig[i] + 2.2 * (k / 0.15) : k < 0.85 ? 0.9 + 0.5 * Math.sin(t * 9) * Math.exp(-(k - 0.15) * 4) + gauss(r) * 0.01 : sig[i] * ((k - 0.85) / 0.15) + 0.9 * (1 - (k - 0.85) / 0.15); } }
    rh.meta.looseWindow = [a, b];
  }
}
// Lead-reversal mapping: displayed lead = f(true leads)
function reverseSource(L, rev) {
  const id = x => ({ src: [x], f: a => a }), neg = x => ({ src: [x], f: a => -a });
  if (rev === 'LA-RA') return ({ I: neg('I'), II: id('III'), III: id('II'), aVR: id('aVL'), aVL: id('aVR') })[L] ?? id(L);
  if (rev === 'LA-LL') return ({ I: id('II'), II: id('I'), III: neg('III'), aVL: id('aVF'), aVF: id('aVL') })[L] ?? id(L);
  if (rev === 'RA-LL') return ({ I: neg('III'), II: neg('II'), III: neg('I'), aVR: id('aVF'), aVF: id('aVR') })[L] ?? id(L);
  if (rev === 'V1-V2') return ({ V1: id('V2'), V2: id('V1') })[L] ?? id(L);
  return id(L);
}

// ---------- Rendering (SVG, units = mm; 25 mm/s, 10 mm/mV) ----------
function rdp(pts, eps) {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1; const st = [[0, pts.length - 1]];
  while (st.length) {
    const [a, b] = st.pop(); const [x1, y1] = pts[a], [x2, y2] = pts[b]; const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1;
    let md = 0, mi = -1; for (let i = a + 1; i < b; i++) { const d = Math.abs(dy * pts[i][0] - dx * pts[i][1] + x2 * y1 - y2 * x1) / L; if (d > md) { md = d; mi = i; } }
    if (md > eps) { keep[mi] = 1; st.push([a, mi], [mi, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}
export function tracePath(sig, fs, t0, t1, x0, y0, opts = {}) {
  const pts = []; const i0 = Math.round(t0 * fs), i1 = Math.min(sig.length - 1, Math.round(t1 * fs));
  const ymin = opts.ymin ?? -1e9, ymax = opts.ymax ?? 1e9;
  for (let i = i0; i <= i1; i++) pts.push([x0 + (i / fs - t0) * 25, clamp(y0 - sig[i] * 10, ymin, ymax)]);
  const s = rdp(pts, opts.eps ?? 0.035);
  let d = `M${s[0][0].toFixed(2)} ${s[0][1].toFixed(2)}`;
  for (let i = 1; i < s.length; i++) d += `l${(s[i][0] - s[i - 1][0]).toFixed(2)} ${(s[i][1] - s[i - 1][1]).toFixed(2)}`;
  return d.replace(/(\d)\.?0+(?=[ l]|$)/g, '$1').replace(/ -/g, '-').replace(/l0 0/g, '');
}
function gridDefs(id) {
  return `<defs><pattern id="s${id}" width="1" height="1" patternUnits="userSpaceOnUse"><path d="M1 0V1H0" fill="none" stroke="#f3c4c4" stroke-width=".06"/></pattern>` +
    `<pattern id="g${id}" width="5" height="5" patternUnits="userSpaceOnUse"><rect width="5" height="5" fill="url(#s${id})"/><path d="M5 0V5H0" fill="none" stroke="#e48f8f" stroke-width=".16"/></pattern></defs>`;
}
const calib = (x, y) => `M${x} ${y}h1v-10h5v10h1`;

// Single-lead rhythm strip. Returns {svg, width, height, x0, y0, ann}
export function renderStrip(syn, opts = {}) {
  const lead = opts.lead ?? Object.keys(syn.leads)[0];
  const sg = syn.leads[lead]; let mx = -1e9, mn = 1e9; for (const v of sg) { if (v > mx) mx = v; if (v < mn) mn = v; }
  mx = Math.max(mx, 1.05); mn = Math.min(mn, -0.3); // leave room for the 1 mV calibration pulse
  const D = syn.D, x0 = 8, W = x0 + D * 25 + 2, H = opts.height ?? Math.max(40, Math.ceil((mx - mn) * 10 + 13)), y0 = opts.baseline ?? Math.round(7 + mx * 10);
  const id = opts.uid ?? 'x';
  const d = tracePath(syn.leads[lead], syn.fs, 0, D, x0, y0, { ymin: 0.5, ymax: H - 0.5 });
  const label = opts.label ?? lead;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W * 4}" height="${H * 4}" role="img" aria-label="${opts.aria ?? 'ECG rhythm strip'}">` +
    gridDefs(id) + `<rect width="${W}" height="${H}" fill="#fffafa"/><rect width="${W}" height="${H}" fill="url(#g${id})"/>` +
    `<path d="${calib(0.5, y0)}" fill="none" stroke="#111" stroke-width=".3"/>` +
    `<path d="${d}" fill="none" stroke="#111" stroke-width=".32" stroke-linejoin="round" stroke-linecap="round"/>` +
    `<text x="${x0 + 1}" y="4.2" font-family="Arial,sans-serif" font-size="3.2" fill="#333">${label}</text>` +
    (opts.footer !== false ? `<text x="${W - 1.5}" y="${H - 1.2}" text-anchor="end" font-family="Arial,sans-serif" font-size="2.2" fill="#777">25 mm/s · 10 mm/mV${opts.tag ? ' · ' + opts.tag : ''}</text>` : '') +
    `</svg>`;
  return { svg, width: W, height: H, x0, y0 };
}

// Standard 12-lead: 3x4 at 2.5 s each + 10 s lead II rhythm strip.
export function render12(syn, opts = {}) {
  const x0 = 10, colW = 62.5, rowH = 27, top = 4, W = x0 + 250 + 2, H = top + rowH * 4 + 4;
  const id = opts.uid ?? 'z';
  const layout = [['I', 'aVR', 'V1', 'V4'], ['II', 'aVL', 'V2', 'V5'], ['III', 'aVF', 'V3', 'V6']];
  const labels = opts.labels ?? {};
  let paths = '', texts = '', ticks = ''; const boxes = {};
  layout.forEach((row, ri) => {
    const y0 = top + rowH * ri + 17;
    paths += `<path d="${calib(1.5, y0)}" fill="none" stroke="#111" stroke-width=".3"/>`;
    row.forEach((L, ci) => {
      const t0 = ci * 2.5, t1 = t0 + 2.5, xs = x0 + ci * colW;
      paths += `<path d="${tracePath(syn.leads[L], syn.fs, t0, t1, xs, y0, { ymin: top + rowH * ri - 3, ymax: top + rowH * (ri + 1) + 3 })}" fill="none" stroke="#111" stroke-width=".3" stroke-linejoin="round"/>`;
      texts += `<text x="${xs + 1.2}" y="${y0 - 11.5}" font-family="Arial,sans-serif" font-size="3.3" font-weight="bold" fill="#222">${labels[L] ?? L}</text>`;
      if (ci) ticks += `<path d="M${xs} ${y0 - 3}v6" stroke="#111" stroke-width=".3"/>`;
      boxes[L] = { x: xs, y: top + rowH * ri, w: colW, h: rowH };
    });
  });
  const yR = top + rowH * 3 + 17;
  paths += `<path d="${calib(1.5, yR)}" fill="none" stroke="#111" stroke-width=".3"/>`;
  paths += `<path d="${tracePath(syn.leads[opts.rhythmLead ?? 'II'], syn.fs, 0, 10, x0, yR, { ymin: top + rowH * 3 - 3, ymax: H - 0.5 })}" fill="none" stroke="#111" stroke-width=".3" stroke-linejoin="round"/>`;
  texts += `<text x="${x0 + 1.2}" y="${yR - 11.5}" font-family="Arial,sans-serif" font-size="3.3" font-weight="bold" fill="#222">${opts.rhythmLead ?? 'II'}</text>`;
  boxes.rhythm = { x: x0, y: top + rowH * 3, w: 250, h: rowH };
  texts += `<text x="${W - 1.5}" y="${H - 1.2}" text-anchor="end" font-family="Arial,sans-serif" font-size="2.4" fill="#777">25 mm/s · 10 mm/mV · 0.05–150 Hz${opts.tag ? ' · ' + opts.tag : ''}</text>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W * 4}" height="${H * 4}" role="img" aria-label="${opts.aria ?? '12-lead ECG'}">` +
    gridDefs(id) + `<rect width="${W}" height="${H}" fill="#fffafa"/><rect width="${W}" height="${H}" fill="url(#g${id})"/>` + paths + ticks + texts + `</svg>`;
  return { svg, width: W, height: H, boxes };
}

// ---------- Measurements from annotations (used for validation & rhythm trainer) ----------
export function measure(syn, rhythm) {
  const D = syn.D;
  const q = syn.ann.beats.filter(b => b.qrsOn != null && b.qrsOn >= 0 && b.qrsOn <= D).map(b => b.qrsOn).sort((a, b) => a - b);
  const ps = syn.ann.beats.filter(b => b.p && b.p.on >= 0 && b.p.on <= D).map(b => b.p.on).sort((a, b) => a - b);
  const rr = q.slice(1).map((t, i) => t - q[i]);
  const pp = ps.slice(1).map((t, i) => t - ps[i]);
  const mean = a => a.reduce((s, x) => s + x, 0) / (a.length || 1);
  const inWin = syn.ann.beats.filter(b => b.qrsOn != null && b.qrsOn >= 0 && b.qrsOn <= D);
  const prs = inWin.filter(b => b.pr != null && b.p).map(b => +(b.qrsOn - b.p.on + 0.006).toFixed(3));
  return {
    vrate: rr.length ? Math.round(60 / mean(rr)) : 0,
    arate: pp.length ? Math.round(60 / mean(pp)) : 0,
    rrMin: rr.length ? Math.min(...rr) : 0, rrMax: rr.length ? Math.max(...rr) : 0,
    rrCV: rr.length ? Math.sqrt(mean(rr.map(x => (x - mean(rr)) ** 2))) / mean(rr) : 0,
    qrsCount6: q.filter(t => t < 6).length,
    pr: prs, qrs: inWin.map(b => +(b.qrsOff - b.qrsOn).toFixed(3)),
    qt: inWin.map(b => +(b.tEnd - b.qrsOn).toFixed(3)),
    pCount: ps.length, qrsCount: q.length,
  };
}
