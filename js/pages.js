// pages.js — library, rhythm trainer, calculations, study plan, flashcard sessions and reference pages.
import { D, AREAS, AREA_FULL, AREA_PCT, AREA_ICON } from './data.js';
import { $, $$, h, esc, toast, pct, bar, shuffle, ecgImage } from './ui.js';
import * as S from './store.js';
import { runSession } from './quiz.js';
import * as PL from './planner.js';

const go = (el, title, items) => runSession(el, { title, items });

// ---------- Flashcard session ----------
export function cardSession(el, cards, title, opts = {}) {
  if (!cards.length) { el.innerHTML = `<div class="card"><h2>${esc(title)}</h2><p>No cards here right now.</p><a class="btn" href="#/flashcards">Back</a></div>`; return; }
  let i = 0, got = 0;
  const show = () => {
    const c = cards[i];
    el.innerHTML = `<div class="progress-top"><b>${esc(title)}</b><span class="muted">${i + 1}/${cards.length}</span>${bar(i / cards.length)}</div>
      <div class="flip" tabindex="0" role="button" aria-label="Flip card"><div class="flip-inner"><div class="face front"><span class="badge area">${esc(AREAS[c.area])} · ${esc(c.topic)}</span><div class="slot"></div><div class="big">${esc(c.front)}</div><small class="muted">Tap to flip</small></div>
      <div class="face back"><div class="big">${esc(c.back)}</div></div></div></div>
      <div class="btn-row stretch"><button class="btn" data-g="0">✗ Missed it</button><button class="btn primary" data-g="1">✓ Got it</button></div>
      <div class="btn-row"><a class="btn ghost small" href="#/flashcards">End session</a></div>`;
    if (c.image) { const im = ecgImage(c.image); $('.slot', el).append(im); $('.flip-inner', el).style.minHeight = '360px'; }
    const f = $('.flip', el); const flip = () => f.classList.toggle('flipped'); f.onclick = e => { if (!e.target.closest('.zoom-btn,a')) flip(); }; f.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); } };
    $$('[data-g]', el).forEach(b => b.onclick = () => { const ok = b.dataset.g === '1'; if (ok) got++; S.recordCard(c, ok); i++; i < cards.length ? show() : done(); });
  };
  const done = () => { if (opts.onFinish) opts.onFinish({ got, n: cards.length }); el.innerHTML = `<div class="card center"><h2>Deck finished</h2><div class="big-num">${got}/${cards.length}</div><p>got it</p><p class="muted">Missed cards will come back tomorrow in Daily review.</p><div class="btn-row stretch"><a class="btn primary" href="#/flashcards">More cards</a><a class="btn" href="#/">Home</a></div></div>`; };
  show();
}

// ---------- Rhythm trainer ----------
export function trainer(el, a, p, opts = {}) {
  let checked = 0;
  const pool = Object.values(D.strips).filter(s => s.kind === 'strip' && !s.rhythm.startsWith('art_') && s.measured.vrate > 0);
  const names = [...new Map(pool.map(s => [s.rhythm, s.name.replace(/ \(.*\)$/, '')])).entries()].sort((a, b) => a[1].localeCompare(b[1]));
  let s = null, hint = false;
  const next = () => { s = shuffle(pool)[0]; hint = false; draw(); };
  const draw = () => {
    el.innerHTML = `<div class="card"><h2>📏 Rhythm trainer</h2><p class="muted">Measure first, then name it. Use the grid: 1 small box = 0.04 s; 1 large box = 0.20 s. Rate = 1500 ÷ small boxes between R waves (or count beats in 6 s × 10 if irregular).</p></div>
      <div class="card"><div class="img"></div>
      <div class="grid two"><label class="field"><span>Ventricular rate (bpm)</span><input type="number" id="t-rate" inputmode="numeric" min="0" max="350"></label>
      <label class="field"><span>Regularity</span><select id="t-reg"><option value="">—</option><option value="1">Regular</option><option value="0">Irregular</option></select></label>
      <label class="field"><span>PR interval (s) <small class="muted">blank if none/variable</small></span><input type="number" id="t-pr" step="0.01" inputmode="decimal" min="0" max="0.6"></label>
      <label class="field"><span>QRS duration (s)</span><input type="number" id="t-qrs" step="0.01" inputmode="decimal" min="0" max="0.3"></label></div>
      <label class="field"><span>Rhythm</span><select id="t-name"><option value="">Choose…</option>${names.map(([id, n]) => `<option value="${id}">${esc(n)}</option>`).join('')}</select></label>
      <div class="btn-row"><button class="btn" id="t-hint">📐 Caliper hint</button><button class="btn primary" id="t-check">Reveal & check</button><button class="btn ghost" id="t-next">New strip</button></div><div id="t-res"></div></div>`;
    const im = ecgImage(s.id, { caliper: true }); $('.img', el).append(im);
    $('#t-hint', el).onclick = () => { hint = !hint; const g = im.overlay?.querySelector('.cal'); if (g) g.style.display = hint ? '' : 'none'; };
    $('#t-next', el).onclick = next;
    $('#t-check', el).onclick = () => {
      const m = s.measured, irr = !m.regular, trueRate = irr ? m.qrsIn6s * 10 : m.vrate;
      const rate = +$('#t-rate', el).value, pr = $('#t-pr', el).value, qrs = +$('#t-qrs', el).value, reg = $('#t-reg', el).value, nm = $('#t-name', el).value;
      const rateOk = rate && Math.abs(rate - trueRate) <= Math.max(6, trueRate * 0.1);
      const prOk = m.pr == null || !m.prConst ? pr === '' || true : pr !== '' && Math.abs(+pr - m.pr) <= 0.04;
      const qrsOk = qrs && Math.abs(qrs - m.qrs) <= 0.04; const regOk = reg !== '' && (+reg === 1) === m.regular; const nameOk = nm === s.rhythm;
      const row = (ok, label, yours, truth) => `<tr><td>${ok ? '✅' : '❌'}</td><td>${label}</td><td>${esc(yours || '—')}</td><td><b>${esc(truth)}</b></td></tr>`;
      $('#t-res', el).innerHTML = `<div class="feedback ${nameOk ? 'ok' : 'bad'}"><h3>${nameOk ? '✓ Correct rhythm' : '✗ ' + esc(s.name)}</h3>
        <table class="simple"><tr><th></th><th>Measure</th><th>You</th><th>Strip</th></tr>
        ${row(rateOk, 'Rate', rate ? rate + ' bpm' : '', `${trueRate} bpm${irr ? ' (6-s method)' : ''}`)}${row(regOk, 'Regularity', reg === '' ? '' : reg === '1' ? 'Regular' : 'Irregular', m.regular ? 'Regular' : 'Irregular')}
        ${row(prOk, 'PR', pr ? pr + ' s' : '', m.pr == null ? 'none / not measurable' : m.prConst ? m.pr.toFixed(2) + ' s' : `varies ${m.prRange[0].toFixed(2)}–${m.prRange[1].toFixed(2)} s`)}${row(qrsOk, 'QRS', qrs ? qrs + ' s' : '', (m.qrs ?? 0).toFixed(2) + ' s')}${row(nameOk, 'Rhythm', names.find(n => n[0] === nm)?.[1], s.name)}</table>
        <p class="src">Tolerance: rate ±10%, intervals ±0.04 s (one small box). Strip ${esc(s.id)} — generated and checked against textbook criteria.</p></div>`;
      S.profile().days[S.today()] = (S.profile().days[S.today()] || 0) + 1; S.save();
      checked++; if (opts.goal) { if (checked >= opts.goal && opts.onDone) { opts.onDone(); toast(`Task done: ${checked} strips measured ✓`); } else if (checked < opts.goal) toast(`${checked}/${opts.goal} strips for today's task`); }
    };
  };
  next();
}

// ---------- Calculation practice ----------
const CALCS = {
  r300: { t: '300 method', make: r => { const n = [1, 1.5, 2, 2.5, 3, 4, 5, 6][Math.floor(r() * 8)]; return { q: `There are ${n} large boxes between two R waves. What is the heart rate?`, a: Math.round(300 / n), tol: 1, unit: 'bpm', work: `300 ÷ ${n} = ${Math.round(300 / n)} bpm. Memorize 300-150-100-75-60-50 for 1–6 large boxes.` }; } },
  r1500: { t: '1,500 method', make: r => { const n = 8 + Math.floor(r() * 33); return { q: `There are ${n} small boxes between two R waves. What is the heart rate?`, a: Math.round(1500 / n), tol: 1, unit: 'bpm', work: `1500 ÷ ${n} = ${(1500 / n).toFixed(1)} ≈ ${Math.round(1500 / n)} bpm (1500 small boxes = 1 minute at 25 mm/s).` }; } },
  r6: { t: '6-second method', make: r => { const n = 3 + Math.floor(r() * 14); return { q: `An irregular rhythm has ${n} QRS complexes in a 6-second strip. What is the approximate rate?`, a: n * 10, tol: 0, unit: 'bpm', work: `${n} × 10 = ${n * 10} bpm. Use this method for irregular rhythms.` }; } },
  rr: { t: 'Rate from R–R (s)', make: r => { const rr = [0.4, 0.5, 0.6, 0.75, 0.8, 1.0, 1.2, 1.5][Math.floor(r() * 8)]; return { q: `The R–R interval is ${rr.toFixed(2)} s. What is the heart rate?`, a: Math.round(60 / rr), tol: 1, unit: 'bpm', work: `60 ÷ ${rr.toFixed(2)} = ${Math.round(60 / rr)} bpm.` }; } },
  box: { t: 'Boxes → seconds', make: r => { const n = 2 + Math.floor(r() * 12), fast = r() < 0.25; const v = +(n * (fast ? 0.02 : 0.04)).toFixed(2); return { q: `At ${fast ? 50 : 25} mm/s, an interval measures ${n} small boxes. How many seconds is it?`, a: v, tol: 0.005, unit: 's', work: `${n} × ${fast ? '0.02' : '0.04'} s = ${v.toFixed(2)} s.` }; } },
  thr: { t: 'Target heart rate', make: r => { const age = 25 + Math.floor(r() * 51), p = [85, 85, 90, 70][Math.floor(r() * 4)]; const v = Math.round((220 - age) * p / 100); return { q: `Age ${age}. Using 220 − age, what is ${p}% of the age-predicted maximum heart rate?`, a: v, tol: 1, unit: 'bpm', work: `220 − ${age} = ${220 - age}; ${220 - age} × ${(p / 100).toFixed(2)} = ${((220 - age) * p / 100).toFixed(1)} ≈ ${v} bpm.` }; } },
  qtc: { t: 'QTc (Bazett)', make: r => { const hr = [50, 60, 75, 80, 90, 100, 120][Math.floor(r() * 7)], qt = +(0.32 + Math.floor(r() * 9) * 0.02).toFixed(2), rr = 60 / hr; const v = +(qt / Math.sqrt(rr)).toFixed(2); return { q: `Heart rate ${hr} bpm (R–R ${rr.toFixed(2)} s). Measured QT = ${qt.toFixed(2)} s. What is the QTc?`, a: v, tol: 0.011, unit: 's', work: `QTc = QT ÷ √RR = ${qt.toFixed(2)} ÷ √${rr.toFixed(2)} = ${qt.toFixed(2)} ÷ ${Math.sqrt(rr).toFixed(3)} = ${v.toFixed(2)} s. ${v >= 0.46 ? 'Prolonged.' : 'Within normal limits.'}` }; } },
  dp: { t: 'Double product', make: r => { const hr = 100 + Math.floor(r() * 9) * 10, sbp = 140 + Math.floor(r() * 7) * 10; return { q: `Peak HR ${hr} bpm and BP ${sbp}/80 mm Hg. What is the double (rate-pressure) product?`, a: hr * sbp, tol: 0, unit: '', work: `HR × SBP = ${hr} × ${sbp} = ${(hr * sbp).toLocaleString()}.` }; } },
  strip: { t: 'Rate from a strip', make: null },
};
export function calc(el, [kind], p = {}, opts = {}) {
  let mixKinds = null; if (kind === 'mix') { mixKinds = Object.keys(CALCS); }
  if (!kind) {
    el.innerHTML = `<div class="card"><h2>🧮 Calculation practice</h2><p class="muted">Instant checking with worked examples.</p><ul class="list">${Object.entries(CALCS).map(([k, c]) => `<li><a href="#/calc/${k}"><span class="grow"><b>${esc(c.t)}</b></span><span class="chev"></span></a></li>`).join('')}</ul></div>
      <div class="card"><h3>Formulas</h3><ul><li>Rate (regular) = 300 ÷ large boxes = 1500 ÷ small boxes = 60 ÷ R–R (s)</li><li>Rate (irregular) = QRS in 6 s × 10</li><li>Time = small boxes × 0.04 s (25 mm/s) · × 0.02 s (50 mm/s)</li><li>APMHR = 220 − age; target ≥ 85%</li><li>QTc (Bazett) = QT ÷ √RR</li><li>Double product = HR × SBP</li></ul></div>`;
    return;
  }
  let score = 0, n = 0; const r = Math.random;
  const next = () => {
    let pr;
    if (kind === 'strip') { const s = shuffle(Object.values(D.strips).filter(x => x.kind === 'strip' && x.measured.regular && x.measured.vrate > 30 && !x.rhythm.startsWith('art_')))[0];
      pr = { q: 'Calculate the ventricular rate of this regular strip (1500 ÷ small boxes between R waves).', a: s.measured.vrate, tol: Math.max(5, Math.round(s.measured.vrate * 0.08)), unit: 'bpm', work: `R–R ≈ ${(60 / s.measured.vrate).toFixed(2)} s ≈ ${Math.round(1500 / s.measured.vrate)} small boxes → 1500 ÷ ${Math.round(1500 / s.measured.vrate)} ≈ ${s.measured.vrate} bpm. Rhythm: ${s.name}.`, img: s.id };
    } else if (mixKinds) { const k = mixKinds[Math.floor(r() * (mixKinds.length - 1))]; pr = CALCS[k].make(r); pr.t = CALCS[k].t; }
    else pr = CALCS[kind].make(r);
    el.innerHTML = `<div class="progress-top"><b>${esc(mixKinds ? 'Mixed calculations · ' + pr.t : CALCS[kind].t)}</b><span class="muted">${score}/${n} correct${opts.goal ? ` · goal ${opts.goal}` : ''}</span></div><div class="card"><div class="img"></div><p class="q-stem">${esc(pr.q)}</p>
      <div style="display:flex;gap:8px;align-items:center"><input type="number" step="any" inputmode="decimal" id="ans" aria-label="Your answer"> <span>${esc(pr.unit)}</span></div>
      <div class="btn-row"><button class="btn primary" id="chk">Check</button><button class="btn ghost" id="skip">Show answer</button><a class="btn ghost" href="#/calc">All calculations</a></div><div id="out"></div></div>`;
    if (pr.img) $('.img', el).append(ecgImage(pr.img, { caliper: true }));
    const reveal = ok => { n++; if (ok) score++; if (opts.goal && n === opts.goal && opts.onDone) { opts.onDone(); toast('Task done ✓'); } $('#out', el).innerHTML = `<div class="feedback ${ok ? 'ok' : 'bad'}"><h3>${ok ? '✓ Correct' : `✗ Answer: ${pr.a}${pr.unit ? ' ' + pr.unit : ''}`}</h3><p><b>Worked example:</b> ${esc(pr.work)}</p></div><button class="btn primary block" id="nx">Next →</button>`; $('#nx', el).onclick = next; $('#chk', el).disabled = true; };
    $('#chk', el).onclick = () => { const v = parseFloat($('#ans', el).value); if (isNaN(v)) return toast('Enter a number'); reveal(Math.abs(v - pr.a) <= pr.tol); };
    $('#ans', el).addEventListener('keydown', e => { if (e.key === 'Enter') $('#chk', el).click(); });
    $('#skip', el).onclick = () => reveal(false);
  };
  next();
}

// ---------- Library ----------
export function library(el) {
  el.innerHTML = `<div class="grid tiles">
    <a class="tile" href="#/leads"><span class="ico">📍</span><b>Lead placement</b><small>diagrams & lead groups</small></a>
    <a class="tile" href="#/glossary"><span class="ico">📖</span><b>Glossary</b><small>${D.glossary.length} terms</small></a>
    <a class="tile" href="#/mnemonics"><span class="ico">💡</span><b>Memory aids</b><small>mnemonics by topic</small></a>
    <a class="tile" href="#/meds"><span class="ico">💊</span><b>Medications</b><small>quick reference</small></a>
    <a class="tile" href="#/cheat"><span class="ico">🖨️</span><b>Cheat sheets</b><small>printable, one per area</small></a>
    <a class="tile" href="#/images"><span class="ico">🖼️</span><b>ECG gallery</b><small>real & generated</small></a></div>
    <h2 style="margin-top:16px">Lessons</h2>${Object.keys(AREAS).map(a => `<div class="card"><h3>${AREA_ICON[a]} ${esc(AREA_FULL[a])}</h3><ul class="list">${D.lessonList.filter(l => l.area === a).map(l => `<li><a href="#/lesson/${l.id}"><span class="grow">${esc(l.title)}</span><span class="chev"></span></a></li>`).join('')}</ul></div>`).join('')}`;
}
export function lesson(el, [id], p = {}) {
  const l = D.lessons[id]; if (!l) { el.innerHTML = '<div class="card">Lesson not found.</div>'; return; }
  const qs = D.questions.filter(q => q.lesson === id);
  el.innerHTML = `<div class="card"><span class="badge area">${esc(AREAS[l.area])}</span><h2>${esc(l.title)}</h2>${l.body.map(p => `<p>${esc(p)}</p>`).join('')}
    <h3>Key points</h3><ul>${l.keyPoints.map(k => `<li>${esc(k)}</li>`).join('')}</ul>${l.mnemonics.length ? `<h3>Memory aids</h3>${l.mnemonics.map(m => `<p>💡 <b>${esc(m.name)}:</b> ${esc(m.text)}</p>`).join('')}` : ''}
    <div class="btn-row">${qs.length ? `<button class="btn primary" id="lq">Quiz me on this (${Math.min(12, qs.length)})</button>` : ''}${id.startsWith('C-') || id.startsWith('B-') || id === 'A-landmarks' ? '<a class="btn" href="#/leads">Lead diagrams</a>' : ''}<a class="btn ghost" href="#/library">All lessons</a></div></div>`;
  const b = $('#lq', el); if (b) b.onclick = () => go(el, l.title, shuffle(qs).slice(0, 12));
  const read = S.profile().lessonsRead?.[id];
  const mk = h(`<div class="card center"><button class="btn ${read ? '' : 'primary'} block" id="mark">${read ? '✓ Studied ' + new Date(read).toLocaleDateString() + ' — tap to study again' : '✓ Mark studied'}</button><small class="muted">Marking a lesson studied checks it off in your plan.</small></div>`);
  el.append(mk);
  $('#mark', mk).onclick = () => {
    PL.plan(); S.profile().lessonsRead[id] = Date.now();
    const tasks = Object.values(PL.plan().days).flat().filter(t => t.type === 'lesson' && t.lesson === id);
    const target = (p.task && PL.findTask(p.task)) || tasks.find(t => !PL.isDone(t) && t.date <= PL.todayStr()) || tasks.find(t => !PL.isDone(t));
    if (target) PL.complete(target.id); else S.save(true);
    toast('Lesson marked studied ✓'); location.hash = p.back || '#/';
  };
}

// Lead placement diagrams (drawn here, not images)
export function leads(el) {
  const chest = `<svg viewBox="0 0 320 300" role="img" aria-label="Chest lead placement diagram">
    <path d="M60 20 Q160 0 260 20 L290 120 Q300 220 250 290 L70 290 Q20 220 30 120 Z" fill="var(--surface-2)" stroke="var(--muted)"/>
    <path d="M90 32 Q130 45 158 40 M230 32 Q190 45 162 40" stroke="var(--muted)" stroke-width="3" fill="none"/>
    <rect x="151" y="40" width="18" height="150" rx="6" fill="none" stroke="var(--muted)"/>
    ${[70, 98, 126, 154, 182].map((y, i) => `<path d="M60 ${y + 10} Q110 ${y - 2} 150 ${y}" stroke="var(--border)" fill="none"/><path d="M170 ${y} Q210 ${y - 2} 270 ${y + 10}" stroke="var(--border)" fill="none"/><text x="276" y="${y + 13}" font-size="9" fill="var(--muted)">${i + 2}</text>`).join('')}
    <line x1="205" y1="30" x2="205" y2="250" stroke="var(--accent)" stroke-dasharray="4 3"/><text x="188" y="262" font-size="9" fill="var(--accent)">MCL</text>
    <line x1="243" y1="60" x2="243" y2="250" stroke="var(--accent)" stroke-dasharray="4 3"/><text x="230" y="262" font-size="9" fill="var(--accent)">AAL</text>
    <line x1="272" y1="70" x2="272" y2="250" stroke="var(--accent)" stroke-dasharray="4 3"/><text x="262" y="274" font-size="9" fill="var(--accent)">MAL</text>
    <text x="118" y="52" font-size="8.5" fill="var(--muted)">Angle of Louis →</text>
    ${[['V1', 141, 140, '#e53935'], ['V2', 179, 140, '#fbc02d'], ['V3', 192, 157, '#43a047'], ['V4', 205, 172, '#1e88e5'], ['V5', 243, 172, '#fb8c00'], ['V6', 272, 172, '#8e24aa']].map(([t, x, y, c]) => `<circle cx="${x}" cy="${y}" r="9" fill="${c}" stroke="#222"/><text x="${x}" y="${y + 3.5}" text-anchor="middle" font-size="8" font-weight="bold" fill="#fff">${t}</text>`).join('')}
    <text x="8" y="296" font-size="9" fill="var(--muted)">Numbers = intercostal spaces (patient's left is on the right of the picture)</text></svg>`;
  const limbs = `<svg viewBox="0 0 220 260" role="img" aria-label="Limb lead placement diagram">
    <circle cx="110" cy="30" r="20" fill="var(--surface-2)" stroke="var(--muted)"/><rect x="80" y="52" width="60" height="100" rx="16" fill="var(--surface-2)" stroke="var(--muted)"/>
    <path d="M82 62 L40 140 M138 62 L180 140 M95 150 L80 245 M125 150 L140 245" stroke="var(--muted)" stroke-width="12" stroke-linecap="round"/>
    ${[['RA', 45, 128, '#fff', '#222'], ['LA', 175, 128, '#222', '#fff'], ['RL', 82, 232, '#43a047', '#fff'], ['LL', 138, 232, '#e53935', '#fff']].map(([t, x, y, f, tc]) => `<circle cx="${x}" cy="${y}" r="13" fill="${f}" stroke="#222"/><text x="${x}" y="${y + 4}" text-anchor="middle" font-size="10" font-weight="bold" fill="${tc}">${t}</text>`).join('')}
    <text x="110" y="258" text-anchor="middle" font-size="9" fill="var(--muted)">AHA colors: RA white · LA black · RL green · LL red</text></svg>`;
  const tri = `<svg viewBox="0 0 240 220" role="img" aria-label="Einthoven triangle and hexaxial leads">
    <polygon points="40,40 200,40 120,180" fill="none" stroke="var(--primary)" stroke-width="2"/><text x="120" y="32" text-anchor="middle" font-size="11" fill="var(--text)">Lead I (0°)</text>
    <text x="52" y="120" font-size="11" fill="var(--text)" transform="rotate(60 60 110)">Lead II (+60°)</text><text x="160" y="96" font-size="11" fill="var(--text)" transform="rotate(-60 170 100)">Lead III (+120°)</text>
    <text x="30" y="36" font-size="10" fill="var(--muted)">RA −</text><text x="190" y="36" font-size="10" fill="var(--muted)">LA</text><text x="108" y="198" font-size="10" fill="var(--muted)">LL +</text>
    <text x="120" y="214" text-anchor="middle" font-size="10" fill="var(--muted)">I + III = II (Einthoven's law)</text></svg>`;
  const lg = D.lessons['C-reading-lead-groups'];
  el.innerHTML = `<div class="card diagram"><h2>Chest leads (V1–V6)</h2>${chest}<table class="simple"><tr><th>Lead</th><th>Position</th></tr>
    <tr><td>V1</td><td>4th intercostal space, right sternal border</td></tr><tr><td>V2</td><td>4th intercostal space, left sternal border</td></tr><tr><td>V3</td><td>Midway between V2 and V4</td></tr><tr><td>V4</td><td>5th intercostal space, left midclavicular line</td></tr><tr><td>V5</td><td>Left anterior axillary line, level with V4</td></tr><tr><td>V6</td><td>Left midaxillary line, level with V4</td></tr>
    <tr><td>V4R</td><td>5th ICS, right midclavicular line</td></tr><tr><td>V7 · V8 · V9</td><td>Posterior axillary · tip of scapula · left paraspinal (level with V6)</td></tr></table></div>
    <div class="grid two"><div class="card diagram"><h2>Limb leads</h2>${limbs}<p class="muted">IEC: RA red · LA yellow · LL green · RL black. Exercise testing moves limb electrodes to the torso (Mason-Likar).</p></div><div class="card diagram"><h2>Einthoven's triangle</h2>${tri}</div></div>
    <div class="card"><h2>${esc(lg.title)}</h2>${lg.body.map(p => `<p>${esc(p)}</p>`).join('')}
    <table class="simple"><tr><th>Group</th><th>Leads</th><th>Wall</th><th>Usual artery</th></tr><tr><td>Inferior</td><td>II, III, aVF</td><td>Inferior</td><td>RCA</td></tr><tr><td>Septal</td><td>V1, V2</td><td>Septum</td><td>LAD</td></tr><tr><td>Anterior</td><td>V3, V4</td><td>Anterior</td><td>LAD</td></tr><tr><td>Lateral</td><td>I, aVL, V5, V6</td><td>Lateral</td><td>Circumflex</td></tr><tr><td>Posterior</td><td>(V1–V3 mirror) V7–V9</td><td>Posterior</td><td>RCA or circumflex</td></tr><tr><td>Right ventricle</td><td>V4R</td><td>RV</td><td>Proximal RCA</td></tr></table>
    <p>💡 <b>I SAW LA</b> — Inferior, Septal, Anterior, Lateral. 💡 <b>White on right, smoke over fire.</b></p></div>`;
}
export function glossary(el, a, p) {
  if (p.drill) { const terms = shuffle(D.glossary.filter(g => !p.area || g.area === p.area)).slice(0, 20).map(g => ({ id: 'G-' + g.term, area: g.area, topic: 'Glossary', front: g.term, back: g.def }));
    let i = 0, flipped = false; const show = () => { const t = terms[i]; el.innerHTML = `<div class="progress-top"><b>Glossary drill</b><span class="muted">${i + 1}/${terms.length}</span>${bar(i / terms.length)}</div>
      <div class="card center" style="min-height:180px;display:flex;flex-direction:column;justify-content:center"><div class="big-num" style="font-size:1.6em">${esc(t.front)}</div><p class="ans ${flipped ? '' : 'hide'}">${esc(t.back)}</p></div>
      <div class="btn-row stretch"><button class="btn" id="f">${flipped ? 'Hide' : 'Show definition'}</button><button class="btn primary" id="n">Next →</button></div><a class="btn ghost small" href="#/glossary">Back to glossary</a>`;
      $('#f', el).onclick = () => { flipped = !flipped; show(); }; $('#n', el).onclick = () => { flipped = false; i++; i < terms.length ? show() : (location.hash = '#/glossary'); }; }; show(); return; }
  el.innerHTML = `<div class="card"><h2>📖 Glossary</h2><input type="search" id="gq" placeholder="Search terms, abbreviations, normal values" aria-label="Search glossary"><div class="btn-row"><a class="btn primary" href="#/glossary?drill=1">Drill 20 random terms</a></div><div class="seg" id="ga"><button data-a="" class="on">All</button>${Object.keys(AREAS).map(x => `<button data-a="${x}">${x}</button>`).join('')}</div></div><div class="card"><ul class="list" id="gl"></ul></div>`;
  let area = ''; const draw = () => { const t = $('#gq', el).value.toLowerCase(); $('#gl', el).innerHTML = D.glossary.filter(g => (!area || g.area === area) && (g.term + ' ' + g.def).toLowerCase().includes(t)).sort((x, y) => x.term.localeCompare(y.term)).map(g => `<li style="padding:8px 0"><b>${esc(g.term)}</b> <span class="badge">${g.area}</span><br>${esc(g.def)}</li>`).join('') || '<li>No matches.</li>'; };
  $('#gq', el).oninput = draw; $$('#ga button', el).forEach(b => b.onclick = () => { area = b.dataset.a; $$('#ga button', el).forEach(x => x.classList.toggle('on', x === b)); draw(); }); draw();
}
export function mnemonics(el) {
  el.innerHTML = `<h2>💡 Memory aids</h2>` + Object.keys(AREAS).map(a => { const ms = D.lessonList.filter(l => l.area === a).flatMap(l => l.mnemonics.map(m => ({ ...m, l }))); return ms.length ? `<div class="card"><h3>${AREA_ICON[a]} ${esc(AREAS[a])}</h3>${ms.map(m => `<p><b>${esc(m.name)}</b> — ${esc(m.text)} <a href="#/lesson/${m.l.id}"><small>(${esc(m.l.title)})</small></a></p>`).join('')}</div>` : ''; }).join('') +
    `<p class="muted">Mnemonics are memory hooks only — always confirm the underlying fact in the lesson.</p>`;
}
export function meds(el) {
  el.innerHTML = `<div class="card"><h2>💊 Medication quick reference</h2><p class="notice">${esc(D.medNote)} CCI tests medications as one of 11 tasks in Rhythm Analysis, so this section is intentionally short.</p></div>` +
    D.meds.map(m => `<div class="card"><h3>${esc(m.name)}</h3><p><b>Examples:</b> ${esc(m.examples)}</p><p><b>ECG / cardiac effect:</b> ${esc(m.effect)}</p><p><b>Exam traps:</b> ${esc(m.traps)}</p></div>`).join('') +
    `<div class="btn-row"><button class="btn primary" id="mq">Quiz medication questions</button></div>`;
  $('#mq', el).onclick = () => go(el, 'Medications', shuffle(D.questions.filter(q => q.tags?.includes('medication'))).slice(0, 15));
}
export function cheat(el, [area]) {
  if (!area) { el.innerHTML = `<div class="card"><h2>🖨️ Printable cheat sheets</h2><p>One page per content area. Open one and use Print (or Share → Print / Save as PDF).</p><ul class="list">${Object.keys(AREAS).map(a => `<li><a href="#/cheat/${a}"><span class="grow"><b>${AREA_ICON[a]} ${esc(AREA_FULL[a])}</b></span><span class="chev"></span></a></li>`).join('')}</ul></div>`; return; }
  const ls = D.lessonList.filter(l => l.area === area);
  el.innerHTML = `<div class="card"><div class="no-print btn-row"><button class="btn primary" id="pr">Print this sheet</button><a class="btn ghost" href="#/cheat">All sheets</a></div>
    <h2>CCT Cheat Sheet — ${esc(AREA_FULL[area])} (${AREA_PCT[area]}% of exam)</h2><div class="cheat">${ls.map(l => `<h3>${esc(l.title)}</h3><ul>${l.keyPoints.map(k => `<li>${esc(k)}</li>`).join('')}${l.mnemonics.map(m => `<li>💡 <b>${esc(m.name)}</b>: ${esc(m.text)}</li>`).join('')}</ul>`).join('')}</div>
    <p class="muted" style="font-size:.75em">Study aid only — not an official CCI product.</p></div>`;
  $('#pr', el).onclick = () => window.print();
}
export function images(el, a, p) {
  const all = Object.values(D.strips); const kind = p.k || 'real';
  const list = all.filter(s => kind === 'real' ? s.kind === 'real' : kind === '12' ? s.kind === '12lead' : s.kind === 'strip');
  const seen = new Set(); const one = list.filter(s => { const k = s.kind === 'real' ? s.id : s.condition || s.rhythm; if (seen.has(k)) return false; seen.add(k); return true; });
  el.innerHTML = `<div class="card"><h2>🖼️ ECG gallery</h2><div class="seg">${[['real', 'Real recordings'], ['strip', 'Generated strips'], ['12', 'Generated 12-leads']].map(([k, t]) => `<button class="${k === kind ? 'on' : ''}" data-k="${k}">${t}</button>`).join('')}</div>
    <p class="muted">Real images are licensed recordings from Wikimedia Commons (see credits under each). Generated images are synthetic tracings made by this app and checked against textbook criteria.</p></div><div class="gal"></div>`;
  $$('[data-k]', el).forEach(b => b.onclick = () => (location.hash = `#/images?k=${b.dataset.k}`));
  const g = $('.gal', el); for (const s of one) { const c = h(`<div class="card"><b>${esc(s.caption || s.name)}</b></div>`); c.append(ecgImage(s.id)); g.append(c); }
}
export function guide(el) {
  el.innerHTML = `<div class="card"><h2>🧠 How to study with this app</h2>
  <h3>1. Quiz yourself first — don't just reread</h3><p>Retrieval practice (testing yourself) builds memory far better than rereading notes. Start each topic with a short quiz, then read the mini-lesson for what you missed.</p>
  <h3>2. Space your sessions</h3><p>Short daily sessions beat one long cram. Clear <a href="#/review">Daily review</a> first each day — the 1 → 3 → 7 → 14-day schedule brings items back just before you forget them.</p>
  <h3>3. Mix topics</h3><p>Use <a href="#/mixed">Interleaved practice</a> after the first three weeks. Mixing forces you to recognize which rule applies — exactly what the exam demands.</p>
  <h3>4. Be honest with the confidence buttons</h3><p>Mark <i>Unsure</i> or <i>Guess</i> when you are not certain. Right-but-unsure answers come back for review, and Smart review targets them.</p>
  <h3>5. Measure every strip</h3><p>In the <a href="#/trainer">Rhythm trainer</a> always measure rate, regularity, P waves, PR and QRS before naming the rhythm. Rhythm analysis is 40% of the exam.</p>
  <h3>6. Sleep well</h3><p>Memory consolidates during sleep. Aim for 7–9 hours, especially in the final week. All-nighters hurt recall.</p>
  <h3>7. Do a brief, low-stakes recap before bed</h3><p>Spend 5–10 minutes on a few flashcards or a rapid-fire round before sleep — relaxed, no pressure.</p>
  <h3>8. Simulate the real exam</h3><p>In week 7 take full <a href="#/exam">practice exams</a> (130 questions, 2 hours). Review every miss and its lesson.</p>
  <h3>Studying as a pair</h3><p>Each of you creates a profile (top-right chip). Compare weak spots weekly and quiz each other on cheat sheets.</p></div>
  <p class="disclaimer">Not an official CCI product. Confirm exam details at cci-online.org.</p>`;
}
export function about(el) {
  el.innerHTML = `<div class="card"><h2>About CCT Study</h2><p>A free, offline study app for the Cardiovascular Credentialing International (CCI) <b>Certified Cardiographic Technician (CCT)</b> exam.</p>
  <p class="notice"><b>This is not an official CCI product</b> and is not affiliated with, sponsored or endorsed by CCI. Content is for studying only and is not medical advice.</p>
  <h3>Exam blueprint used</h3><p>From CCI's CCT credential page (current matrix): Pre-Procedural 10%, Resting ECG 14%, Analyzing 12-Lead 22%, Stress Testing 10%, Ambulatory Monitoring 4%, Rhythm Analysis 40%. 130 questions (110 scored), 2 hours, scaled passing score 650/900.</p>
  <h3>Content</h3><p>${D.questions.length} questions, ${D.cards.length} flashcards, ${D.lessonList.length} lessons, ${D.glossary.length} glossary terms. Every question lists its source. Facts were checked against CCI's recommended texts and published AHA/ACC/HRS, CDC and Joint Commission documents.</p>
  <h3>Images</h3><p>Images marked <span class="badge real">REAL</span> are licensed ECG recordings from Wikimedia Commons (credit and license shown under each image and in ATTRIBUTION.md). Images marked <span class="badge gen">GENERATED</span> are synthetic tracings created by this app's own ECG generator and validated against textbook criteria.</p>
  <h3>Privacy</h3><p>No accounts, no tracking, no server. All progress stays in this browser on this device unless you export it.</p></div>`;
}
