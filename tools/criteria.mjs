// Textbook criteria used to accept or reject each generated tracing.
// References: Dubin, Rapid Interpretation of EKG's (6th ed.); Booth & O'Brien, Electrocardiography
// for Healthcare Professionals; Wagner & Strauss, Marriott's Practical Electrocardiography;
// Fourth Universal Definition of MI (2018) for STEMI thresholds; AHA/ACCF/HRS 2009 recommendations
// for BBB (QRS >= 120 ms) and LVH (Sokolow-Lyon S V1 + R V5/V6 >= 35 mm).

const between = (x, a, b) => x >= a && x <= b;
const all = (arr, f) => arr.length > 0 && arr.every(f);

export function checkStrip(id, rh, m, syn) {
  const why = [];
  const need = (cond, msg) => { if (!cond) why.push(msg); };
  const beats = syn.ann.beats.filter(b => (b.qrsOn ?? b.p?.on ?? b.spikeV ?? -1) >= 0 && (b.qrsOn ?? b.p?.on ?? b.spikeV) <= rh.D);
  const qb = beats.filter(b => b.qrsOn != null);
  const narrow = all(qb, b => b.qrsOff - b.qrsOn < 0.12);
  const wideAll = all(qb, b => b.qrsOff - b.qrsOn >= 0.12);
  const regular = m.rrCV < 0.06;
  const prNormal = all(m.pr, p => between(p, 0.12, 0.2));
  const eachQrsHasP = all(qb, b => b.p && b.pr != null);
  const sinusBase = () => { need(eachQrsHasP, 'every QRS preceded by P'); need(prNormal, 'PR 0.12–0.20'); need(narrow, 'QRS < 0.12'); };
  const sig = syn.leads[Object.keys(syn.leads)[0]];
  switch (id) {
    case 'nsr': case 'art_tremor': case 'art_wander': case 'art_60hz': case 'art_loose':
      need(between(m.vrate, 60, 100), 'rate 60–100'); need(regular, 'regular'); sinusBase(); break;
    case 'sbrady': need(m.vrate < 60 && m.vrate >= 35, 'rate < 60'); need(regular, 'regular'); sinusBase(); break;
    case 'stach': need(between(m.vrate, 101, 160), 'rate 101–160'); need(regular, 'regular'); sinusBase(); break;
    case 'sinarr': need(m.rrMax - m.rrMin >= 0.16, 'R-R varies >= 0.16 s'); need(between(m.vrate, 50, 100), 'rate ~60–100'); sinusBase(); break;
    case 'sarrest': need(m.rrMax > 1.8 * m.rrMin, 'pause > 1.8x R-R'); sinusBase(); break;
    case 'pac': case 'pjc': {
      const lab = id === 'pac' ? 'PAC' : 'PJC'; const k = qb.findIndex(b => b.label === lab);
      need(k > 0, 'has ectopic beat'); need(narrow, 'narrow QRS');
      if (k > 0 && k + 1 < qb.length) { const rrE = qb[k].qrsOn - qb[k - 1].qrsOn; need(rrE < 0.85 * (m.rrMax), 'ectopic is premature'); }
      if (id === 'pac') need(beats.some(b => b.p?.shape === 'ectopic'), 'different P morphology');
      else need(qb.filter(b => b.label === 'PJC').every(b => !b.p || b.p.shape === 'retro'), 'retrograde/absent P');
      break;
    }
    case 'afib': need(m.pCount === 0, 'no P waves'); need(m.rrCV > 0.08, 'irregularly irregular'); need(narrow, 'narrow QRS'); break;
    case 'aflutter': {
      need(m.pCount === 0, 'no sinus P'); need(between(rh.meta.rate, 250, 350), 'atrial (F) rate 250–350');
      need(Math.abs(m.vrate - rh.meta.rate / rh.meta.ratio) <= 6, 'ventricular rate = F rate / ratio'); need(narrow, 'narrow'); break;
    }
    case 'svt': need(between(m.vrate, 150, 250), 'rate 150–250'); need(regular, 'regular'); need(narrow, 'narrow'); need(m.pCount === 0, 'P not visible'); break;
    case 'mat': case 'wap': {
      const shapes = new Set(beats.filter(b => b.p).map(b => b.p.shape));
      need(shapes.size >= 3, '>= 3 P-wave morphologies'); need(m.rrCV > 0.04, 'irregular');
      need(id === 'mat' ? m.vrate > 100 : between(m.vrate, 55, 100), id === 'mat' ? 'rate > 100' : 'rate 60–100'); need(narrow, 'narrow');
      const prs = m.pr; need(prs.length > 2 && Math.max(...prs) - Math.min(...prs) >= 0.02, 'PR varies'); break;
    }
    case 'junctional': case 'accjunct': case 'jtach': {
      const [a, b] = id === 'junctional' ? [40, 60] : id === 'accjunct' ? [61, 100] : [101, 180];
      need(between(m.vrate, a, b), `rate ${a}–${b}`); need(regular, 'regular'); need(narrow, 'narrow');
      need(beats.every(x => !x.p || x.p.shape === 'retro'), 'P inverted/absent/after');
      need(all(m.pr.length ? m.pr : [0.09], p => p < 0.12), 'PR < 0.12 if P precedes'); break;
    }
    case 'pvc': case 'bigeminy': case 'trigeminy': case 'couplet': case 'multifocal': {
      const pv = qb.map((b, i) => [b, i]).filter(([b]) => b.label === 'PVC');
      need(pv.length >= 1, 'has PVC'); need(pv.every(([b]) => b.qrsOff - b.qrsOn >= 0.12 && !b.p), 'PVC wide, no P');
      const normalRR = Math.min(...qb.slice(1).map((b, i) => (qb[i].label || b.label) ? 9 : b.qrsOn - qb[i].qrsOn));
      if (id === 'pvc' || id === 'multifocal') for (const [, i] of pv) if (i > 0 && i + 1 < qb.length && !qb[i + 1].label) {
        const span = qb[i + 1].qrsOn - qb[i - 1].qrsOn; need(Math.abs(span - 2 * normalRR) < 0.07, 'full compensatory pause');
      }
      const seq = qb.map(b => (b.label === 'PVC' ? 'V' : 'N')).join('');
      if (id === 'bigeminy') need(/(NV){3,}/.test(seq) && !/VV|NN/.test(seq.slice(1, -1)), 'every other beat is a PVC');
      if (id === 'trigeminy') need(/(NNV){2,}/.test(seq) && !/VV/.test(seq), 'every third beat is a PVC');
      if (id === 'couplet') need(/NVVN/.test(seq), 'two consecutive PVCs');
      if (id === 'multifocal') need(new Set(rh.beats.filter(b => b.label === 'PVC').map(b => b.qrs.fseed)).size >= 2, '>= 2 PVC morphologies');
      break;
    }
    case 'vtach': need(between(m.vrate, 100, 250), 'rate 100–250'); need(wideAll, 'wide QRS'); need(regular, 'regular'); need(m.pCount === 0, 'no P'); need(qb.length >= 3, '>= 3 consecutive'); break;
    case 'idio': need(between(m.vrate, 20, 40), 'rate 20–40'); need(wideAll, 'wide'); need(regular, 'regular'); break;
    case 'aivr': need(between(m.vrate, 41, 100), 'rate 41–100'); need(wideAll, 'wide'); need(regular, 'regular'); break;
    case 'torsades': case 'vfib': case 'vfibfine': need(qb.length === 0, 'no organized QRS'); break;
    case 'asystole': { need(qb.length === 0, 'no QRS'); let mx = 0; for (const v of sig) mx = Math.max(mx, Math.abs(v)); need(rh.meta.pWaves ? mx < 0.45 : mx < 0.06, 'flat line'); break; }
    case 'avb1': need(all(m.pr, p => p > 0.2), 'PR > 0.20'); need(Math.max(...m.pr) - Math.min(...m.pr) < 0.01, 'PR constant'); need(eachQrsHasP && m.pCount === m.qrsCount, '1:1 conduction'); need(narrow, 'narrow'); break;
    case 'mobitz1': {
      need(beats.some(b => b.label === 'dropped'), 'non-conducted P present');
      let ok = true; for (let i = 1; i < beats.length; i++) { const a = beats[i - 1], b = beats[i]; if (a.pr != null && b.pr != null && b.pr <= a.pr && a.label !== 'dropped') ok = false; }
      need(ok, 'PR lengthens until a beat drops'); need(m.arate > m.vrate, 'more P than QRS'); break;
    }
    case 'mobitz2': need(beats.some(b => b.label === 'dropped'), 'dropped QRS'); need(Math.max(...m.pr) - Math.min(...m.pr) < 0.01, 'PR constant'); need(m.arate > m.vrate, 'more P than QRS'); break;
    case 'avb21': need(Math.abs(m.arate - 2 * m.vrate) <= 4, 'P:QRS 2:1'); need(Math.max(...m.pr) - Math.min(...m.pr) < 0.01, 'constant PR'); break;
    case 'avb3': {
      need(m.arate > m.vrate, 'atrial rate > ventricular'); need(qb.every(b => b.pr == null), 'no conducted beats (AV dissociation)');
      const esc = rh.meta.escape; need(esc === 'junctional' ? between(m.vrate, 40, 60) && narrow : between(m.vrate, 20, 40) && wideAll, 'escape rate/width'); break;
    }
    case 'rbbb': case 'lbbb': {
      sinusBase.call(null); why.splice(why.indexOf('QRS < 0.12'), why.includes('QRS < 0.12') ? 1 : 0);
      need(wideAll, 'QRS >= 0.12');
      const b = qb[1] ?? qb[0]; const i0 = Math.round(b.qrsOn * syn.fs), i1 = Math.round(b.qrsOff * syn.fs);
      const seg = Array.from(sig.slice(i0, i1)); const late = seg.slice(Math.floor(seg.length * 0.6));
      if (id === 'rbbb') need(Math.max(...late) > 0.2, "V1 terminal R' (rSR')");
      else need(Math.abs(Math.min(...seg)) > 2 * Math.max(...seg), 'V1 predominantly negative (QS/rS)');
      break;
    }
    case 'apace': need(qb.every(b => b.spikeA != null && b.p), 'atrial spike + P each beat'); need(narrow, 'narrow (intrinsic conduction)'); break;
    case 'vpace': need(qb.every(b => b.spikeV != null) && wideAll, 'V spike + wide QRS'); break;
    case 'avpace': need(qb.every(b => b.spikeA != null && b.spikeV != null) && wideAll, 'A and V spikes, wide QRS'); break;
    case 'failcapture': need(beats.some(b => b.label === 'noncapture'), 'spike without QRS'); break;
    case 'failsense': {
      const sp = syn.ann.spikes; need(sp.length >= 1, 'spikes present');
      need(sp.every(t => qb.some(b => t > b.qrsOn && t - b.qrsOn < 0.4)), 'spike fires during intrinsic beat (not sensed)'); sinusBase(); break;
    }
    default: why.push('no criteria for ' + id);
  }
  return { ok: why.length === 0, why: why.join(', ') };
}

// ---------- 12-lead ----------
function leadStats(syn, L) {
  const s = syn.leads[L], fs = syn.fs; const bs = syn.ann.beats.filter(b => b.qrsOn != null && b.qrsOn > 0.2 && b.tEnd < syn.D);
  let net = 0, st = 0, rmax = 0, smin = 0, first = 0, tmax = 0; const n = bs.length || 1;
  for (const b of bs) {
    const i0 = Math.round(b.qrsOn * fs), i1 = Math.round(b.qrsOff * fs);
    const base = (s[i0 - Math.round(0.03 * fs)] + s[i0 - Math.round(0.015 * fs)]) / 2;
    let a = 0, mx = -9, mn = 9; for (let i = i0; i <= i1; i++) { const v = s[i] - base; a += v; mx = Math.max(mx, v); mn = Math.min(mn, v); }
    net += a / fs; rmax += mx; smin += mn;
    st += s[Math.round((b.qrsOff + 0.06) * fs)] - base;
    first += s[i0 + Math.round(0.015 * fs)] - base;
    let tm = -9; for (let i = Math.round((b.qrsOff + 0.08) * fs); i < Math.round(b.tEnd * fs); i++) tm = Math.max(tm, s[i] - base); tmax += tm;
  }
  return { net: net / n, st: (st / n) * 10, r: (rmax / n) * 10, s: (smin / n) * 10, first: first / n, t: tmax / n };
}
export function check12(key, rh, syn, def) {
  const why = []; const need = (c, m) => { if (!c) why.push(m); };
  const S = {}; for (const L of Object.keys(syn.leads)) S[L] = leadStats(syn, L);
  const axis = Math.round((Math.atan2(S.aVF.net, S.I.net) * 180) / Math.PI);
  const st = Object.fromEntries(Object.entries(S).map(([k, v]) => [k, Math.round(v.st * 10) / 10]));
  const qrsW = Math.max(...syn.ann.beats.filter(b => b.qrsOn != null).map(b => b.qrsOff - b.qrsOn));
  const elev = (leads, mm = 1) => leads.every(L => st[L] >= mm);
  const noElev = leads => leads.every(L => st[L] < 1);
  const limbs = ['I', 'II', 'III', 'aVL', 'aVF'], pre = ['V1', 'V2', 'V3', 'V4', 'V5', 'V6'];
  const voltage = Math.round(-S.V1.s + Math.max(S.V5.r, S.V6.r));
  switch (key) {
    case 'normal': case 'stach12': case 'avb1_12':
      need(between(axis, -30, 90), 'normal axis'); if (key !== 'stach12') need(noElev([...limbs, ...pre]), 'no ST elevation'); need(qrsW < 0.12, 'narrow');
      need(S.aVR.net < 0, 'aVR negative'); need(S.V1.r < -S.V1.s, 'V1 rS'); need(S.V6.r > -S.V6.s, 'V6 R dominant'); break;
    case 'lad': need(axis < -30 && axis >= -90, 'axis -30 to -90'); break;
    case 'rad': need(axis > 90 && axis <= 180, 'axis +90 to +180'); break;
    case 'rbbb': need(qrsW >= 0.12, 'QRS >= 0.12'); need(S.V1.r > 2, "V1 terminal R'"); need(S.I.s < -1, 'wide S in I'); break;
    case 'lbbb': need(qrsW >= 0.12, 'QRS >= 0.12'); need(S.V1.s < -5 && S.V1.r < 2, 'V1 QS/rS'); need(S.I.first > 0 && S.V6.first > 0, 'no septal q in I, V6'); break;
    case 'lvh': need(voltage >= 35, 'S V1 + R V5/V6 >= 35 mm'); need(S.V6.t < 0, 'lateral T inversion (strain)'); break;
    case 'inferior': need(elev(['II', 'III', 'aVF']), 'ST up II, III, aVF'); need(st.aVL <= -0.5, 'reciprocal aVL'); need(noElev(pre), 'precordials not elevated'); break;
    case 'anterior': need(elev(['V2', 'V3'], 2) && elev(['V4']), 'ST up V2–V4'); need(noElev(['II', 'III', 'aVF', 'V6']), 'no inferior elevation'); break;
    case 'septal': need(elev(['V1']) && elev(['V2'], 2), 'ST up V1–V2'); need(noElev(['V4', 'V5', 'V6', ...limbs]), 'no elevation elsewhere'); break;
    case 'lateral': need(elev(['I', 'aVL', 'V5', 'V6']), 'ST up I, aVL, V5, V6'); need(noElev(['II', 'III', 'aVF', 'V1', 'V2']), 'no inferior/septal elevation'); break;
    case 'anterolateral': need(elev(['V3', 'V4', 'V5', 'V6', 'I', 'aVL']), 'ST up V3–V6, I, aVL'); need(noElev(['II', 'III', 'aVF']), 'no inferior elevation'); break;
    case 'posterior': need(['V1', 'V2', 'V3'].every(L => st[L] <= -1), 'ST down V1–V3'); need(S.V2.r > -S.V2.s, 'tall R in V2'); need(noElev([...limbs, ...pre]), 'no elevation'); break;
    case 'ischemia': need(['II', 'III', 'aVF', 'V4', 'V5', 'V6'].every(L => st[L] <= -1), 'ST down >= 1 mm'); need(noElev([...limbs, ...pre]), 'no ST elevation'); break;
    case 'hyperk': need(S.V3.t > 0.75 && S.V3.t > 0.6 * S.V3.r / 10, 'tall peaked T (' + S.V3.t.toFixed(2) + ' mV)'); break;
    case 'rev_lara': need(S.I.net < 0 && S.aVR.net > 0, 'lead I inverted, aVR upright'); break;
    case 'dextro': need(S.I.net < 0, 'lead I inverted'); need(S.V6.r < S.V1.r + 2 || -S.V6.s > S.V6.r, 'poor R progression'); break;
    case 'afib12': need(syn.ann.beats.every(b => !b.p), 'no P'); break;
    case 'paced12': need(qrsW >= 0.12, 'wide paced QRS'); break;
    default: break; // reversals LA-LL, RA-LL, V1-V2 are exact lead permutations by construction
  }
  return { ok: why.length === 0, why: why.join(', '), axis, st, voltage };
}
