// quiz.js — question renderer (MCQ, multi-select, ordering, hot-spot) and session runner
// for practice, exam, review and rapid-fire modes.
import { D, AREAS, AREA_PCT } from './data.js';
import { $, $$, h, esc, ecgImage, shuffle, toast, bar, pct } from './ui.js';
import * as S from './store.js';

const LETTERS = 'ABCDEF';

export function grade(q, resp) {
  if (resp == null) return false;
  if (q.type === 'mcq') return resp === q.answer;
  if (q.type === 'multi') return resp.length === q.answers.length && resp.every(r => q.answers.includes(r));
  if (q.type === 'order') return resp.length === q.items.length && resp.every((r, i) => r === i);
  if (q.type === 'hotspot') return q.answers.includes(resp);
  return false;
}
export function answerText(q) {
  if (q.type === 'mcq') return q.options[q.answer];
  if (q.type === 'multi') return q.answers.map(i => q.options[i]).join(' · ');
  if (q.type === 'order') return q.items.map((t, i) => `${i + 1}. ${t}`).join('  ');
  if (q.type === 'hotspot') return q.regionLabels ? 'Lead ' + q.answers.map(i => q.regionLabels[i]).join(', ') : 'The highlighted area';
  return '';
}

// Renders one question into a card. opts: {mode:'practice'|'exam'|'rapid', confidence, initial, onChange(resp), onSubmit(resp, conf)}
export function renderQuestion(q, opts = {}) {
  const el = h(`<div class="card q-card"></div>`);
  const typeLabel = { mcq: 'Multiple choice', multi: 'Select all that apply', order: 'Put in order', hotspot: 'Hot spot — tap the image' }[q.type];
  el.innerHTML = `<div class="q-meta"><span class="badge area">${esc(AREAS[q.area])}</span><span class="badge">${esc(q.subtopic)}</span><span class="badge">${typeLabel}</span>
    <span style="flex:1"></span>${opts.mode !== 'rapid' ? `<button class="icon-btn bm ${S.isBookmarked(q.id) ? 'on' : ''}" type="button" aria-label="Bookmark question" title="Bookmark">${S.isBookmarked(q.id) ? '★' : '☆'}</button>` : ''}</div>
    <div class="img-slot"></div><div class="q-stem">${esc(q.stem)}</div><div class="opts" role="group"></div><div class="actions"></div><div class="fb"></div>`;
  const opt = $('.opts', el); let resp = opts.initial ?? (q.type === 'multi' || q.type === 'order' ? [] : null); let locked = false; let img = null;
  const bm = $('.bm', el); if (bm) bm.onclick = () => { const on = S.toggleBookmark(q.id); bm.classList.toggle('on', on); bm.textContent = on ? '★' : '☆'; toast(on ? 'Bookmarked' : 'Bookmark removed'); };
  const changed = () => { draw(); opts.onChange && opts.onChange(resp); updateActions(); };

  // order: shuffle display order once, keep mapping to original index
  const orderDisp = q.type === 'order' ? (opts.orderDisp || shuffle(q.items.map((_, i) => i))) : null;
  if (q.type === 'order') el.orderDisp = orderDisp;

  if (q.image) {
    const regs = q.type === 'hotspot' ? q.regions : null;
    img = ecgImage(q.image, { regions: regs, labels: q.regionLabels, onPick: i => { if (locked) return; resp = i; changed(); } });
    $('.img-slot', el).append(img);
  }
  function draw() {
    if (q.type === 'mcq' || q.type === 'multi') {
      opt.innerHTML = q.options.map((o, i) => { const sel = q.type === 'mcq' ? resp === i : resp.includes(i);
        return `<button class="opt ${sel ? 'sel' : ''}" type="button" data-i="${i}" aria-pressed="${sel}"><span class="k">${q.type === 'multi' ? (sel ? '✓' : '') : LETTERS[i]}</span><span>${esc(o)}</span></button>`; }).join('');
      $$('.opt', opt).forEach(b => b.onclick = () => { if (locked) return; const i = +b.dataset.i;
        if (q.type === 'mcq') resp = i; else resp = resp.includes(i) ? resp.filter(x => x !== i) : [...resp, i]; changed(); });
    } else if (q.type === 'order') {
      opt.innerHTML = orderDisp.map(i => { const pos = resp.indexOf(i);
        return `<button class="opt ${pos >= 0 ? 'sel order-num' : ''}" type="button" data-i="${i}"><span class="k">${pos >= 0 ? pos + 1 : ''}</span><span>${esc(q.items[i])}</span></button>`; }).join('') +
        `<div><button class="btn small ghost reset" type="button">Reset order</button> <small class="muted">Tap the steps in the correct order.</small></div>`;
      $$('.opt', opt).forEach(b => b.onclick = () => { if (locked) return; const i = +b.dataset.i; resp = resp.includes(i) ? resp.filter(x => x !== i) : [...resp, i]; changed(); });
      $('.reset', opt).onclick = () => { if (!locked) { resp = []; changed(); } };
    } else if (q.type === 'hotspot') {
      opt.innerHTML = `<small class="muted">${resp == null ? 'Tap a region on the tracing above.' : q.regionLabels ? `Selected: lead ${esc(q.regionLabels[resp])}` : 'Region selected — tap another to change.'}</small>`;
      if (img?.overlay) $$('.hs', img.overlay).forEach((r, i) => r.classList.toggle('sel', resp === i));
    }
  }
  const ready = () => resp != null && (q.type === 'multi' ? resp.length > 0 : q.type === 'order' ? resp.length === q.items.length : true);
  function updateActions() {
    const a = $('.actions', el); if (opts.mode === 'exam' || locked) { a.innerHTML = ''; return; }
    if (opts.mode === 'rapid') { a.innerHTML = ''; if (q.type === 'mcq' && resp != null) submit('sure'); return; }
    const dis = ready() ? '' : 'disabled';
    a.innerHTML = opts.confidence ? `<div class="conf"><p>How sure are you? (submits your answer)</p><div class="btn-row stretch"><button class="btn primary" data-c="sure" ${dis}>Sure</button><button class="btn" data-c="unsure" ${dis}>Unsure</button><button class="btn" data-c="guess" ${dis}>Guess</button></div></div>`
      : `<div class="btn-row"><button class="btn primary block" data-c="sure" ${dis}>Check answer</button></div>`;
    $$('[data-c]', a).forEach(b => b.onclick = () => submit(b.dataset.c));
  }
  function submit(conf) { if (!ready() || locked) return; locked = true; updateActions(); opts.onSubmit && opts.onSubmit(resp, conf); }
  el.reveal = (r = resp, { showLesson = true } = {}) => { locked = true; resp = r; draw(); showFeedback(el, q, r, img, showLesson); updateActions(); };
  el.getResp = () => resp;
  draw(); updateActions();
  return el;
}

function showFeedback(el, q, resp, img, showLesson) {
  const ok = grade(q, resp);
  if (q.type === 'mcq' || q.type === 'multi') {
    const right = q.type === 'mcq' ? [q.answer] : q.answers; const picked = q.type === 'mcq' ? [resp] : resp || [];
    $$('.opt', el).forEach((b, i) => { if (right.includes(i)) b.classList.add('correct'); else if (picked.includes(i)) b.classList.add('wrong'); });
  }
  if (q.type === 'order') $$('.opt', el).forEach(b => { const i = +b.dataset.i; b.classList.add((resp || []).indexOf(i) === i ? 'correct' : 'wrong'); $('.k', b).textContent = (i + 1); });
  if (q.type === 'hotspot' && img?.overlay) $$('.hs', img.overlay).forEach((r, i) => { r.classList.remove('sel'); if (q.answers.includes(i)) r.classList.add('correct'); else if (i === resp) r.classList.add('wrong'); });
  const lesson = D.lessons[q.lesson];
  const fb = $('.fb', el);
  fb.innerHTML = `<div class="feedback ${ok ? 'ok' : 'bad'}" role="status"><h3>${ok ? '✓ Correct' : '✗ Not quite'}</h3>
    ${ok ? '' : `<p><b>Correct answer:</b> ${esc(answerText(q))}</p>`}<p>${esc(q.explanation)}</p><div class="src">Source: ${esc(q.source)} · ID ${q.id}</div></div>
    ${!ok && showLesson && lesson ? `<div class="lesson-box"><b>Mini-lesson: ${esc(lesson.title)}</b>${lesson.body.slice(0, 2).map(p => `<p>${esc(p)}</p>`).join('')}<ul>${lesson.keyPoints.map(k => `<li>${esc(k)}</li>`).join('')}</ul><a href="#/lesson/${lesson.id}">Open full lesson →</a></div>` : ''}`;
}

// ---------- Session runner ----------
// cfg: {title, items:[questions], mode:'practice'|'exam'|'review', timeLimit (min), confidence}
export function runSession(root, cfg) {
  const mode = cfg.mode || 'practice';
  const st = { i: 0, resp: {}, conf: {}, ms: {}, done: {}, flags: new Set(), start: Date.now(), qStart: Date.now() };
  const items = cfg.items; if (!items.length) { root.innerHTML = `<div class="card"><h2>${esc(cfg.title)}</h2><p>No questions match. Try another mode.</p><a class="btn" href="#/">Home</a></div>`; return; }
  let timerId = null;
  const conf = mode !== 'exam' && (cfg.confidence ?? S.settings().confidence);
  if (cfg.timeLimit) timerId = setInterval(tick, 1000);
  function tick() {
    const left = cfg.timeLimit * 60 - Math.floor((Date.now() - st.start) / 1000); const t = $('.timer', root);
    if (t) { t.textContent = fmt(left); t.classList.toggle('warn', left < 600); }
    if (left <= 0) { clearInterval(timerId); toast('Time is up — submitting your exam.'); finish(); }
  }
  const fmt = s => `${Math.floor(Math.max(0, s) / 60)}:${String(Math.max(0, s) % 60).padStart(2, '0')}`;
  function show() {
    const q = items[st.i]; st.qStart = Date.now();
    root.innerHTML = `<div class="progress-top"><b>${esc(cfg.title)}</b><span class="muted">${st.i + 1}/${items.length}</span>${bar((st.i) / items.length)}${cfg.timeLimit ? `<span class="timer">--:--</span>` : ''}</div>`;
    if (cfg.timeLimit) tick();
    const card = renderQuestion(q, {
      mode, confidence: conf, initial: st.resp[q.id], orderDisp: st.order?.[q.id],
      onChange: r => { if (mode === 'exam') { st.resp[q.id] = r; } },
      onSubmit: (r, c) => {
        st.resp[q.id] = r; st.conf[q.id] = c; st.ms[q.id] = Date.now() - st.qStart; st.done[q.id] = true;
        const ok = grade(q, r); S.recordAnswer(q, ok, { conf: c, ms: st.ms[q.id] });
        card.reveal(r); nav();
      },
    });
    st.order = st.order || {}; if (card.orderDisp) st.order[q.id] = card.orderDisp;
    root.append(card);
    if (mode === 'practice' && st.done[q.id]) card.reveal(st.resp[q.id]);
    nav();
    window.scrollTo({ top: 0 });
  }
  function nav() {
    const q = items[st.i]; let n = $('.navbar', root); if (n) n.remove();
    n = h(`<div class="navbar btn-row"></div>`);
    if (mode === 'exam') {
      n.innerHTML = `<button class="btn" data-a="prev" ${st.i ? '' : 'disabled'}>← Back</button><button class="btn ${st.flags.has(q.id) ? 'primary' : ''}" data-a="flag">${st.flags.has(q.id) ? '⚑ Flagged' : '⚐ Flag'}</button>
        ${st.i < items.length - 1 ? '<button class="btn primary" data-a="next">Next →</button>' : '<button class="btn primary" data-a="finish">Finish exam</button>'}
        <button class="btn ghost" data-a="grid">Question list</button>`;
    } else if (st.done[q.id]) {
      n.innerHTML = st.i < items.length - 1 ? `<button class="btn primary block" data-a="next">Next question →</button>` : `<button class="btn primary block" data-a="finish">See results</button>`;
    } else n.innerHTML = `<button class="btn ghost" data-a="skip">Skip</button><button class="btn ghost" data-a="quit">End session</button>`;
    root.append(n);
    $$('[data-a]', n).forEach(b => b.onclick = () => act(b.dataset.a));
  }
  function act(a) {
    const q = items[st.i];
    if (a === 'next' || a === 'skip') { if (st.i < items.length - 1) { st.i++; show(); } else finish(); }
    if (a === 'prev' && st.i) { st.i--; show(); }
    if (a === 'flag') { st.flags.has(q.id) ? st.flags.delete(q.id) : st.flags.add(q.id); nav(); }
    if (a === 'finish' || a === 'quit') {
      if (mode === 'exam') { const left = items.filter(x => st.resp[x.id] == null || (Array.isArray(st.resp[x.id]) && !st.resp[x.id].length)).length; if (left && !confirm(`${left} unanswered. Finish anyway?`)) return; }
      finish();
    }
    if (a === 'grid') grid();
  }
  function grid() {
    root.innerHTML = `<div class="card"><h2>Question list</h2><p class="muted">Tap a number to jump. ⚑ = flagged, ● = answered.</p><div class="pill-list">${items.map((x, i) => `<button class="btn small ${st.flags.has(x.id) ? 'primary' : ''}" data-j="${i}">${i + 1}${st.resp[x.id] != null && !(Array.isArray(st.resp[x.id]) && !st.resp[x.id].length) ? '●' : ''}${st.flags.has(x.id) ? '⚑' : ''}</button>`).join('')}</div><div class="btn-row"><button class="btn primary" data-j="${st.i}">Back to question</button></div></div>`;
    $$('[data-j]', root).forEach(b => b.onclick = () => { st.i = +b.dataset.j; show(); });
  }
  function finish() {
    clearInterval(timerId);
    const answered = items.filter(q => st.resp[q.id] != null);
    if (mode === 'exam') for (const q of answered) { const ok = grade(q, st.resp[q.id]); S.recordAnswer(q, ok, { conf: 'sure', ms: 0 }); }
    const scored = mode === 'exam' ? items.filter((q, i) => !cfg.pretest?.has(i)) : items.filter(q => st.done[q.id]);
    const correct = scored.filter(q => grade(q, st.resp[q.id])).length;
    const byArea = {}; for (const q of scored) { const a = byArea[q.area] || (byArea[q.area] = [0, 0]); a[1]++; if (grade(q, st.resp[q.id])) a[0]++; }
    const pctScore = scored.length ? correct / scored.length : 0;
    if (mode === 'exam') S.addExam({ date: Date.now(), total: items.length, scored: scored.length, correct, pct: pctScore, byArea, minutes: Math.round((Date.now() - st.start) / 60000) });
    const missed = scored.filter(q => !grade(q, st.resp[q.id]));
    root.innerHTML = `<div class="card"><h2>${esc(cfg.title)} — results</h2>
      <div class="stats"><div class="stat"><b>${correct}/${scored.length}</b><small>correct${mode === 'exam' ? ' (scored items)' : ''}</small></div><div class="stat"><b>${pct(pctScore)}</b><small>score</small></div>
      ${mode === 'exam' ? `<div class="stat"><b style="color:var(--${pctScore >= S.PASS_PCT ? 'ok' : 'bad'})">${pctScore >= S.PASS_PCT ? 'Likely PASS' : 'Not yet'}</b><small>estimate (≥ ${Math.round(S.PASS_PCT * 100)}%)</small></div>` : ''}</div>
      ${mode === 'exam' ? `<p class="notice">CCI reports a scaled score (650 of 900 to pass), which is not the same as percent correct. This pass/fail line is only an estimate based on ${Math.round(S.PASS_PCT * 100)}% correct. 20 of the 130 questions were treated as unscored pretest items, as on the real exam.</p>` : ''}
      <h3>By content area</h3><table class="simple"><tr><th>Area</th><th>Score</th><th style="width:35%"></th></tr>${Object.keys(AREAS).filter(a => byArea[a]).map(a => `<tr><td>${esc(AREAS[a])}${mode === 'exam' ? ` <small class="muted">(${AREA_PCT[a]}%)</small>` : ''}</td><td>${byArea[a][0]}/${byArea[a][1]}</td><td>${bar(byArea[a][0] / byArea[a][1], byArea[a][0] / byArea[a][1] >= 0.7 ? 'ok' : 'bad')}</td></tr>`).join('')}</table>
      <div class="btn-row">${missed.length ? '<button class="btn primary" data-r="missed">Retry missed</button><button class="btn" data-r="review">Review answers</button>' : ''}<a class="btn" href="#/">Home</a></div></div>`;
    const rm = $('[data-r="missed"]', root); if (rm) rm.onclick = () => runSession(root, { title: 'Retry missed', items: shuffle(missed), mode: 'practice' });
    const rv = $('[data-r="review"]', root); if (rv) rv.onclick = () => reviewList(root, items, st);
    window.scrollTo({ top: 0 });
  }
  show();
  return () => clearInterval(timerId);
}
function reviewList(root, items, st) {
  root.innerHTML = `<h2>Answer review</h2><p class="muted">Every item with the explanation.</p>`;
  for (const q of items) { const c = renderQuestion(q, { mode: 'exam', initial: st.resp[q.id], orderDisp: st.order?.[q.id] }); root.append(c); c.reveal(st.resp[q.id] ?? (q.type === 'multi' || q.type === 'order' ? [] : null), { showLesson: false }); }
  root.append(h(`<div class="btn-row"><a class="btn primary" href="#/">Home</a></div>`));
}

// ---------- Rapid fire: 60-second rounds mixing quick MCQs and flashcards ----------
export function runRapid(root) {
  const quick = D.questions.filter(q => q.type === 'mcq' && !q.image && q.stem.length < 140 && q.options.every(o => o.length < 70));
  const cards = D.cards.filter(c => !c.image && c.back.length < 70);
  const makeCardQ = c => { const pool = cards.filter(x => x.area === c.area && x.back !== c.back); const wrong = shuffle(pool).slice(0, 3).map(x => x.back); const opts = shuffle([c.back, ...wrong]);
    return { id: c.id, area: c.area, subtopic: c.topic, type: 'mcq', stem: c.front, options: opts, answer: opts.indexOf(c.back), explanation: c.back, source: 'Flashcard', lesson: '', isCard: true, card: c }; };
  let score = 0, n = 0, end = 0, timer = null;
  root.innerHTML = `<div class="card center"><h2>Rapid fire ⚡</h2><p>60 seconds. Quick questions and flashcards. Tap an answer — it moves on instantly. +1 for each correct answer.</p>
    <p class="muted">Best: ${S.profile().rapid[0]?.score ?? '—'}</p><button class="btn primary block go">Start round</button></div>`;
  $('.go', root).onclick = start;
  function start() { score = 0; n = 0; end = Date.now() + 60000; timer = setInterval(t, 250); next(); }
  function t() { const left = Math.ceil((end - Date.now()) / 1000); const el = $('.timer', root); if (el) el.textContent = `${left}s`; if (left <= 0) stop(); }
  function next() {
    const q = Math.random() < 0.5 ? shuffle(quick)[0] : makeCardQ(shuffle(cards)[0]); n++;
    root.innerHTML = `<div class="progress-top"><b>⚡ Score ${score}</b><span class="muted">#${n}</span><span style="flex:1"></span><span class="timer">60s</span></div>`; t();
    const card = renderQuestion(q, { mode: 'rapid', onSubmit: r => {
      const ok = r === q.answer; if (ok) score++;
      if (q.isCard) S.recordCard(q.card, ok); else S.recordAnswer(q, ok, { conf: 'sure' });
      $$('.opt', card).forEach((b, i) => { if (i === q.answer) b.classList.add('correct'); else if (i === r) b.classList.add('wrong'); });
      setTimeout(() => (Date.now() < end ? next() : stop()), ok ? 250 : 900);
    } });
    root.append(card);
  }
  function stop() { if (!timer) return; clearInterval(timer); timer = null; S.addRapid(score);
    root.innerHTML = `<div class="card center"><h2>Time! ⚡</h2><div class="big-num">${score}</div><p>correct in 60 seconds (${n} seen)</p><p class="muted">Best: ${S.profile().rapid[0]?.score}</p><div class="btn-row stretch"><button class="btn primary again">Play again</button><a class="btn" href="#/">Home</a></div></div>`;
    $('.again', root).onclick = start; }
  return () => clearInterval(timer);
}
