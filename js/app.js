// app.js — shell, router, home, study modes, review, flashcards, settings and profiles.
import { D, loadData, AREAS, AREA_FULL, AREA_PCT, AREA_ICON } from './data.js';
import { $, $$, h, esc, toast, pct, bar, shuffle, sample, accCls, download, ecgImage } from './ui.js';
import * as S from './store.js';
import { runSession, runRapid } from './quiz.js';
import * as P from './pages.js';

const main = () => $('#main');
let cleanup = null;

// ---------- theme & text size ----------
export function applyTheme() {
  const s = S.settings(); const r = document.documentElement;
  if (s.theme === 'auto') r.removeAttribute('data-theme'); else r.setAttribute('data-theme', s.theme);
  r.setAttribute('data-size', s.size || 'm');
}

// ---------- routing ----------
const routes = {
  '': home, study, quick, drill, mixed, smart, review, exam, flashcards, rapid: () => { cleanup = runRapid(main()); }, bookmarks, search, scenarios, weak,
  settings, profiles, trainer: P.trainer, calc: P.calc, plan: P.plan, library: P.library, lesson: P.lesson, leads: P.leads, glossary: P.glossary,
  mnemonics: P.mnemonics, meds: P.meds, cheat: P.cheat, guide: P.guide, about: P.about, images: P.images,
};
function route() {
  if (cleanup) { try { cleanup(); } catch (e) { /* ignore */ } cleanup = null; }
  const [path, qs] = location.hash.replace(/^#\/?/, '').split('?');
  const [name, ...args] = path.split('/');
  const params = Object.fromEntries(new URLSearchParams(qs || ''));
  const fn = routes[name] || home;
  $$('.tabbar a').forEach(a => a.classList.toggle('active', a.dataset.tab === tabFor(name)));
  $('.topbar .title').textContent = titles[name] || 'CCT Study';
  $('.profile-chip').textContent = '👤 ' + S.profile().name;
  main().innerHTML = '';
  const r = fn(main(), args, params); if (typeof r === 'function') cleanup = r;
  window.scrollTo({ top: 0 });
}
const titles = { '': 'CCT Study', study: 'Study modes', review: 'Daily review', flashcards: 'Flashcards', library: 'Library', settings: 'Settings', exam: 'Practice exam', trainer: 'Rhythm trainer', calc: 'Calculations', plan: 'Study plan', weak: 'Weak spots', glossary: 'Glossary', mnemonics: 'Memory aids', meds: 'Medications', cheat: 'Cheat sheets', guide: 'How to study', leads: 'Lead placement', scenarios: 'Patient scenarios', bookmarks: 'Bookmarks', search: 'Search', profiles: 'Profiles', rapid: 'Rapid fire', lesson: 'Lesson', about: 'About', images: 'Image gallery' };
const tabFor = n => (['', 'about'].includes(n) ? 'home' : ['review', 'flashcards'].includes(n) ? 'review' : ['library', 'lesson', 'leads', 'glossary', 'mnemonics', 'meds', 'cheat', 'images'].includes(n) ? 'library' : ['settings', 'profiles', 'guide', 'plan'].includes(n) ? 'more' : 'study');

// ---------- helpers ----------
const Q = () => D.questions;
const daysTo = d => Math.ceil((new Date(d + 'T09:00:00') - new Date()) / 86400000);
function gauge(prob, evidence) {
  const ang = Math.PI * prob, x = 55 - 45 * Math.cos(ang), y = 60 - 45 * Math.sin(ang);
  const col = prob >= 0.7 ? 'var(--ok)' : prob >= 0.45 ? 'var(--warn)' : 'var(--bad)';
  return `<svg viewBox="0 0 110 70" aria-hidden="true"><path d="M10 60 A45 45 0 0 1 100 60" fill="none" stroke="var(--surface-2)" stroke-width="10" stroke-linecap="round"/>
    <path d="M10 60 A45 45 0 0 1 ${x.toFixed(1)} ${y.toFixed(1)}" fill="none" stroke="${col}" stroke-width="10" stroke-linecap="round"/>
    <text x="55" y="56" text-anchor="middle" font-size="18" font-weight="800" fill="var(--text)">${evidence < 0.15 ? '—' : Math.round(prob * 100) + '%'}</text></svg>`;
}
export function startQuiz(title, items, extra = {}) { cleanup = runSession(main(), { title, items, ...extra }); }
function weightedMix(pool, n) { // proportional to CCI weights, interleaved so consecutive items change topic
  const by = {}; for (const q of shuffle(pool)) (by[q.area] = by[q.area] || []).push(q);
  const out = []; const want = Object.fromEntries(Object.keys(AREA_PCT).map(a => [a, Math.round(n * AREA_PCT[a] / 100)]));
  let guard = 0; while (out.length < n && guard++ < n * 10) {
    for (const a of shuffle(Object.keys(want))) { if (out.length >= n) break; if (want[a] > 0 && by[a]?.length) { const idx = by[a].findIndex(q => q.subtopic !== out[out.length - 1]?.subtopic); out.push(by[a].splice(Math.max(0, idx), 1)[0]); want[a]--; } }
    if (Object.values(want).every(v => v <= 0)) for (const a in want) want[a] = 1;
  }
  return out;
}
const unseenFirst = pool => { const p = S.profile().q; return [...shuffle(pool.filter(q => !p[q.id])), ...shuffle(pool.filter(q => p[q.id]))]; };

// ---------- Home ----------
function home(el) {
  const s = S.settings(), st = S.areaStats(Q()), rd = S.readiness(Q()), dleft = daysTo(s.examDate);
  const todayN = S.profile().days[S.today()] || 0, due = S.dueQuestions(Q()).length + S.dueCards(D.cards).length;
  el.innerHTML = `
  <div class="card"><div class="gauge">${gauge(rd.prob, rd.evidence)}<div><h2 style="margin:0">Readiness</h2>
    <p class="muted" style="margin:.2em 0">${rd.evidence < 0.15 ? 'Answer some questions to see your estimate.' : `Estimated chance of passing: <b>${Math.round(rd.prob * 100)}%</b> (expected score ≈ ${pct(rd.est)})`}</p>
    <p style="margin:.2em 0"><b>${dleft >= 0 ? dleft : 0}</b> day${dleft === 1 ? '' : 's'} to your exam <small class="muted">(${esc(s.examDate)} · <a href="#/settings">change</a>)</small></p></div></div>
    <small class="muted">Estimate blends recent accuracy per area (weighted by the CCI exam matrix) with your last practice exams. It is not a CCI score.</small></div>
  <div class="card tight"><div class="stats"><div class="stat"><b>🔥 ${S.streak()}</b><small>day streak</small></div><div class="stat"><b>${todayN}/${s.goal}</b><small>today's goal</small></div><div class="stat"><b>${due}</b><small>due for review</small></div></div>
    <div style="margin-top:10px">${bar(todayN / s.goal, todayN >= s.goal ? 'ok' : '')}</div></div>
  <div class="grid tiles">
    <a class="tile" href="#/review"><span class="ico">🔁</span><b>Daily review</b><small>${due} due today</small></a>
    <a class="tile" href="#/quick"><span class="ico">⚡</span><b>Quick quiz</b><small>10–20 questions</small></a>
    <a class="tile" href="#/exam"><span class="ico">⏱️</span><b>Practice exam</b><small>130 Q · 2 h</small></a>
    <a class="tile" href="#/trainer"><span class="ico">📏</span><b>Rhythm trainer</b><small>measure & name</small></a>
    <a class="tile" href="#/flashcards"><span class="ico">🃏</span><b>Flashcards</b><small>${D.cards.length} cards</small></a>
    <a class="tile" href="#/rapid"><span class="ico">⏲️</span><b>Rapid fire</b><small>60-second rounds</small></a>
  </div>
  <h2 style="margin-top:18px">Content areas</h2>
  ${Object.keys(AREAS).map(a => { const x = st[a] || {}; return `<a class="card tight" style="display:block;text-decoration:none;color:inherit" href="#/drill/${a}">
    <div style="display:flex;gap:10px;align-items:center"><span style="font-size:1.4em">${AREA_ICON[a]}</span><div class="grow" style="flex:1;min-width:0"><b>${esc(AREAS[a])}</b> <small class="muted">${AREA_PCT[a]}% of exam</small><br>
    <small class="muted">Seen ${x.seen || 0}/${x.total || 0} · Accuracy ${pct(x.acc)}</small></div><span class="chev"></span></div><div style="margin-top:8px">${bar(x.acc, accCls(x.acc))}</div></a>`; }).join('')}
  <div class="grid two"><a class="btn" href="#/weak">📉 Weak spots</a><a class="btn" href="#/plan">🗓️ Study plan</a><a class="btn" href="#/guide">🧠 How to study</a><a class="btn" href="#/search">🔎 Search</a></div>
  <p class="disclaimer">Study aid only. <b>Not an official CCI product</b>; not affiliated with or endorsed by Cardiovascular Credentialing International. <a href="#/about">About & sources</a></p>`;
}

// ---------- Study modes menu ----------
function study(el) {
  const item = (href, ico, t, d) => `<li><a href="${href}"><span style="font-size:1.3em">${ico}</span><span class="grow"><b>${t}</b><br><small class="muted">${d}</small></span><span class="chev"></span></a></li>`;
  el.innerHTML = `<div class="card"><ul class="list">
    ${item('#/quick', '⚡', 'Quick quiz', '10–20 mixed questions with instant feedback')}
    ${item('#/mixed', '🔀', 'Interleaved practice', 'Topics shuffled together, weighted like the real exam')}
    ${item('#/smart', '🎯', 'Smart review', 'Extra weight on slow, guessed and twice-missed questions')}
    ${item('#/drill', '📚', 'Topic drill', 'One content area or subtopic')}
    ${item('#/exam', '⏱️', 'Full practice exam', '130 questions · 2 hours · pass estimate')}
    ${item('#/trainer', '📏', 'Rhythm trainer', 'Measure rate & intervals, then name the rhythm')}
    ${item('#/calc', '🧮', 'Calculation practice', '300/1,500 methods, intervals, target HR, QTc')}
    ${item('#/scenarios', '🧑‍⚕️', 'Patient scenarios', 'Prep, infection control, emergencies, symptomatic patients')}
    ${item('#/rapid', '⏲️', 'Rapid fire', '60-second rounds with a running score')}
    ${item('#/flashcards', '🃏', 'Flashcards', 'Flip cards that feed the spaced-repetition schedule')}
    ${item('#/weak', '📉', 'Weak spots', 'Your lowest-scoring topics, one tap to drill')}
    ${item('#/bookmarks', '★', 'Bookmarks', `${S.profile().bookmarks.length} saved questions`)}
    ${item('#/search', '🔎', 'Search questions', 'Find questions by keyword')}
  </ul></div>`;
}
function quick(el, a, p) {
  const n = +p.n || 0;
  if (!n) { el.innerHTML = `<div class="card"><h2>Quick quiz</h2><p>How many questions?</p><div class="seg">${[10, 15, 20].map(x => `<button data-n="${x}">${x}</button>`).join('')}</div>
    <p class="muted" style="margin-top:12px">Mixed across all areas in exam proportions, unseen questions first.</p></div>`;
    $$('[data-n]', el).forEach(b => b.onclick = () => (location.hash = `#/quick?n=${b.dataset.n}`)); return; }
  startQuiz(`Quick quiz`, weightedMix(unseenFirst(Q()).slice(0, 400), Math.min(20, Math.max(10, n))));
}
function drill(el, [area], p) {
  if (!area) { el.innerHTML = `<h2>Topic drill</h2>` + Object.keys(AREAS).map(a => `<a class="card tight" style="display:block;color:inherit;text-decoration:none" href="#/drill/${a}"><b>${AREA_ICON[a]} ${esc(AREA_FULL[a])}</b><br><small class="muted">${Q().filter(q => q.area === a).length} questions · ${AREA_PCT[a]}% of exam</small></a>`).join(''); return; }
  const pool = Q().filter(q => q.area === area);
  if (p.sub || p.go) { const items = p.sub ? pool.filter(q => q.subtopic === p.sub) : pool; startQuiz(p.sub || AREAS[area], unseenFirst(items).slice(0, +p.n || 15)); return; }
  const subs = [...new Set(pool.map(q => q.subtopic))]; const sst = S.subtopicStats(pool);
  el.innerHTML = `<div class="card"><h2>${AREA_ICON[area]} ${esc(AREA_FULL[area])}</h2><p class="muted">${pool.length} questions · ${AREA_PCT[area]}% of the CCI exam</p>
    <div class="btn-row"><a class="btn primary" href="#/drill/${area}?go=1&n=15">Drill 15 from this area</a><a class="btn" href="#/drill/${area}?go=1&n=30">Drill 30</a></div></div>
    <div class="card"><h3>Subtopics</h3><ul class="list">${subs.map(s => { const x = sst.find(y => y.subtopic === s); return `<li><a href="#/drill/${area}?sub=${encodeURIComponent(s)}&n=15"><span class="grow"><b>${esc(s)}</b><br><small class="muted">${x.total} questions · accuracy ${pct(x.acc)}</small></span><span class="chev"></span></a></li>`; }).join('')}</ul></div>
    <div class="card"><h3>Lessons for this area</h3><ul class="list">${D.lessonList.filter(l => l.area === area).map(l => `<li><a href="#/lesson/${l.id}"><span class="grow">${esc(l.title)}</span><span class="chev"></span></a></li>`).join('')}</ul></div>`;
}
function mixed(el, a, p) {
  if (!p.n) { el.innerHTML = `<div class="card"><h2>Interleaved practice</h2><p>Mixing topics forces you to choose the right strategy for each question, which improves long-term retention compared with studying one topic at a time.</p><div class="seg">${[20, 30, 50].map(x => `<button data-n="${x}">${x} questions</button>`).join('')}</div></div>`;
    $$('[data-n]', el).forEach(b => b.onclick = () => (location.hash = `#/mixed?n=${b.dataset.n}`)); return; }
  startQuiz('Interleaved practice', weightedMix(Q(), +p.n));
}
function smart(el) {
  const pr = S.profile().q; const seen = Q().filter(q => pr[q.id]);
  if (seen.length < 10) { el.innerHTML = `<div class="card"><h2>Smart review</h2><p>Smart review needs some history. Answer at least 10 questions first (try a quick quiz).</p><a class="btn primary" href="#/quick?n=15">Quick quiz</a></div>`; return; }
  const times = seen.map(q => pr[q.id].ms || 0).filter(Boolean).sort((a, b) => a - b); const med = times[Math.floor(times.length / 2)] || 30000;
  const w = q => { const r = pr[q.id]; return (r.wrong >= 2 ? 3 : 0) + (r.lastOk === false ? 2 : 0) + (r.guessed ? 2 : 0) + (r.unsureRight ? 1.5 : 0) + (r.ms > Math.max(45000, med * 1.5) ? 1.5 : 0) + Math.random() * 0.5; };
  const items = seen.map(q => [q, w(q)]).filter(([, x]) => x > 0.6).sort((a, b) => b[1] - a[1]).slice(0, 20).map(([q]) => q);
  if (!items.length) { el.innerHTML = `<div class="card"><h2>Smart review</h2><p>Nothing flagged — no slow, guessed or repeatedly missed questions. Nice work! Try interleaved practice.</p><a class="btn primary" href="#/mixed?n=20">Interleaved practice</a></div>`; return; }
  startQuiz('Smart review', shuffle(items));
}
function review(el, a, p) {
  const dq = S.dueQuestions(Q()), dc = S.dueCards(D.cards);
  if (p.go === 'q') return startQuiz('Daily review', shuffle(dq));
  if (p.go === 'c') return P.cardSession(el, shuffle(dc), 'Due flashcards');
  const upcoming = Object.values(S.profile().q).concat(Object.values(S.profile().c)).filter(r => r.queued && r.due > Date.now()).length;
  el.innerHTML = `<div class="card"><h2>Due today</h2><div class="stats"><div class="stat"><b>${dq.length}</b><small>questions</small></div><div class="stat"><b>${dc.length}</b><small>flashcards</small></div><div class="stat"><b>${upcoming}</b><small>scheduled later</small></div></div>
    <div class="btn-row"><a class="btn primary" href="#/review?go=q" ${dq.length ? '' : 'style="pointer-events:none;opacity:.5"'}>Review questions</a><a class="btn" href="#/review?go=c" ${dc.length ? '' : 'style="pointer-events:none;opacity:.5"'}>Review flashcards</a></div></div>
    <div class="card"><h3>How the schedule works</h3><p>Missed items come back after <b>1 day</b>, then <b>3 days</b>, <b>1 week</b> and <b>2 weeks</b>. After ${S.RETIRE_AFTER} correct answers in a row they drop out of the queue. Questions you got right but marked <i>unsure</i> or <i>guess</i> also come back tomorrow.</p></div>
    ${dq.length ? `<div class="card"><h3>Due questions by area</h3>${Object.keys(AREAS).map(x => { const n = dq.filter(q => q.area === x).length; return n ? `<p>${esc(AREAS[x])}: <b>${n}</b></p>` : ''; }).join('')}</div>` : '<div class="card"><p>Nothing due right now 🎉 Keep learning new material with a quick quiz.</p><a class="btn primary" href="#/quick?n=15">Quick quiz</a></div>'}`;
}
function exam(el, a, p) {
  if (!p.start) {
    const past = S.profile().exams.slice(-5).reverse();
    el.innerHTML = `<div class="card"><h2>Full practice exam</h2><p>Mirrors the CCI CCT format: <b>130 questions in 2 hours</b> (on test day you get 1 h 50 min for questions plus 10 min for the tutorial and survey). Questions are drawn in the official proportions:</p>
      <table class="simple">${Object.keys(AREAS).map(x => `<tr><td>${esc(AREA_FULL[x])}</td><td>${AREA_PCT[x]}%</td><td>${Math.round(130 * AREA_PCT[x] / 100)}</td></tr>`).join('')}</table>
      <p class="muted">No feedback until the end. You can skip, flag and go back (there is no penalty for changing answers). 20 random items are treated as unscored pretest items; the score uses the other 110. Pass estimate: ≥ 70% correct (CCI uses a scaled score of 650/900, which is not a percentage).</p>
      <a class="btn primary block" href="#/exam?start=1">Start the exam</a></div>
      ${past.length ? `<div class="card"><h3>Previous exams</h3><table class="simple">${past.map(e => `<tr><td>${new Date(e.date).toLocaleDateString()}</td><td>${e.correct}/${e.scored}</td><td><b>${pct(e.pct)}</b></td><td>${e.minutes} min</td></tr>`).join('')}</table></div>` : ''}`;
    return;
  }
  const counts = { A: 13, B: 18, C: 29, D: 13, E: 5, F: 52 }; const items = [];
  for (const [ar, n] of Object.entries(counts)) items.push(...unseenFirst(Q().filter(q => q.area === ar)).slice(0, n * 3).sort(() => Math.random() - 0.5).slice(0, n));
  const mixedItems = shuffle(items); const pre = new Set(sample([...mixedItems.keys()], 20));
  startQuiz('Practice exam', mixedItems, { mode: 'exam', timeLimit: 120, pretest: pre });
}
function flashcards(el, a, p) {
  if (p.deck) {
    let cards = D.cards; if (p.deck === 'due') cards = S.dueCards(cards); else if (p.deck === 'images') cards = cards.filter(c => c.image); else if (AREAS[p.deck]) cards = cards.filter(c => c.area === p.deck);
    const pc = S.profile().c; const ordered = [...shuffle(cards.filter(c => !pc[c.id])), ...shuffle(cards.filter(c => pc[c.id]))];
    return P.cardSession(el, ordered.slice(0, +p.n || 25), 'Flashcards');
  }
  const due = S.dueCards(D.cards).length;
  el.innerHTML = `<div class="card"><h2>Flashcards</h2><p class="muted">Tap a card to flip it, then mark <b>Got it</b> or <b>Missed it</b>. Missed cards return on the spaced-repetition schedule.</p>
    <ul class="list"><li><a href="#/flashcards?deck=all"><span class="grow"><b>All cards (mixed)</b><br><small class="muted">${D.cards.length} cards</small></span><span class="chev"></span></a></li>
    <li><a href="#/flashcards?deck=due"><span class="grow"><b>Due today</b><br><small class="muted">${due} cards</small></span><span class="chev"></span></a></li>
    <li><a href="#/flashcards?deck=images"><span class="grow"><b>Rhythm & 12-lead images</b><br><small class="muted">${D.cards.filter(c => c.image).length} cards</small></span><span class="chev"></span></a></li>
    ${Object.keys(AREAS).map(x => `<li><a href="#/flashcards?deck=${x}"><span class="grow"><b>${AREA_ICON[x]} ${esc(AREAS[x])}</b><br><small class="muted">${D.cards.filter(c => c.area === x).length} cards</small></span><span class="chev"></span></a></li>`).join('')}</ul></div>`;
}
function bookmarks(el) {
  const items = S.profile().bookmarks.map(id => D.qmap[id]).filter(Boolean);
  el.innerHTML = `<div class="card"><h2>★ Bookmarks</h2>${items.length ? `<button class="btn primary go">Practice all ${items.length}</button>` : '<p>No bookmarks yet. Tap ☆ on any question to save it for later.</p>'}</div>` + qList(items);
  const g = $('.go', el); if (g) g.onclick = () => startQuiz('Bookmarks', shuffle(items));
  bindList(el);
}
function qList(items) { return items.length ? `<div class="card"><ul class="list">${items.slice(0, 200).map(q => `<li><button class="row" data-q="${q.id}"><span class="grow"><small class="muted">${q.id} · ${esc(AREAS[q.area])}</small><br>${esc(q.stem)}</span><span class="chev"></span></button></li>`).join('')}</ul>${items.length > 200 ? `<p class="muted">Showing first 200 of ${items.length}.</p>` : ''}</div>` : ''; }
function bindList(el) { $$('[data-q]', el).forEach(b => b.onclick = () => startQuiz('Question ' + b.dataset.q, [D.qmap[b.dataset.q]])); }
function search(el, a, p) {
  el.innerHTML = `<div class="card"><h2>Search</h2><input type="search" id="sq" placeholder="e.g. Mobitz, V4, caffeine, Bruce" value="${esc(p.q || '')}" aria-label="Search questions"><div class="btn-row"><button class="btn primary go">Search</button></div></div><div class="res"></div>`;
  const run = () => { const t = $('#sq', el).value.trim().toLowerCase(); if (!t) return;
    const words = t.split(/\s+/); const items = Q().filter(q => { const hay = (q.stem + ' ' + (q.options || q.items || []).join(' ') + ' ' + q.explanation + ' ' + q.subtopic + ' ' + q.id).toLowerCase(); return words.every(w => hay.includes(w)); });
    const gl = D.glossary.filter(g => (g.term + ' ' + g.def).toLowerCase().includes(t)).slice(0, 8);
    $('.res', el).innerHTML = (gl.length ? `<div class="card"><h3>Glossary</h3>${gl.map(g => `<p><b>${esc(g.term)}</b> — ${esc(g.def)}</p>`).join('')}</div>` : '') +
      `<div class="card"><b>${items.length}</b> question${items.length === 1 ? '' : 's'} found ${items.length ? '<button class="btn small primary pa">Practice these</button>' : ''}</div>` + qList(items);
    const pa = $('.pa', el); if (pa) pa.onclick = () => startQuiz(`Search: ${t}`, shuffle(items).slice(0, 30)); bindList(el); history.replaceState(null, '', `#/search?q=${encodeURIComponent(t)}`); };
  $('.go', el).onclick = run; $('#sq', el).addEventListener('keydown', e => { if (e.key === 'Enter') run(); }); if (p.q) run(); else $('#sq', el).focus();
}
function scenarios(el, a, p) {
  const items = Q().filter(q => q.tags?.includes('scenario'));
  if (p.area) return startQuiz('Patient scenarios', shuffle(p.area === 'all' ? items : items.filter(q => q.area === p.area)).slice(0, 20));
  el.innerHTML = `<div class="card"><h2>🧑‍⚕️ Patient scenarios</h2><p>Short patient cases: identification, consent, skin prep and electrode placement, infection control, emergencies, and what to do when a patient becomes symptomatic during a stress test or Holter hook-up.</p><a class="btn primary block" href="#/scenarios?area=all">Mixed scenarios (20)</a></div>
    <div class="card"><ul class="list">${Object.keys(AREAS).map(x => { const n = items.filter(q => q.area === x).length; return n ? `<li><a href="#/scenarios?area=${x}"><span class="grow"><b>${esc(AREAS[x])}</b><br><small class="muted">${n} cases</small></span><span class="chev"></span></a></li>` : ''; }).join('')}</ul></div>`;
}
function weak(el) {
  const st = S.subtopicStats(Q()).filter(s => s.attempts >= 3).sort((a, b) => a.acc - b.acc);
  el.innerHTML = `<div class="card"><h2>📉 Weak spots</h2><p class="muted">Subtopics ranked by your accuracy (minimum 3 attempts). Tap Drill to practice one.</p>
    ${st.length ? `<button class="btn primary block all">Drill my 3 weakest topics</button>` : '<p>Not enough data yet — answer a few quizzes first.</p><a class="btn primary" href="#/quick?n=20">Quick quiz</a>'}</div>
    ${st.length ? `<div class="card"><ul class="list">${st.slice(0, 15).map((s, i) => `<li style="padding:8px 0"><div style="display:flex;align-items:center;gap:10px"><span class="grow" style="flex:1"><b>${i + 1}. ${esc(s.subtopic)}</b><br><small class="muted">${esc(AREAS[s.area])} · ${pct(s.acc)} of ${s.attempts}</small>${bar(s.acc, accCls(s.acc))}</span>
      <button class="btn small" data-d="${esc(s.area + '|' + s.subtopic)}">Drill</button></div></li>`).join('')}</ul></div>` : ''}`;
  const pr = S.profile().q;
  const pick = (area, sub, n) => { const pool = Q().filter(q => q.area === area && q.subtopic === sub); return [...shuffle(pool.filter(q => pr[q.id] && pr[q.id].lastOk === false)), ...shuffle(pool.filter(q => !pr[q.id])), ...shuffle(pool.filter(q => pr[q.id]?.lastOk))].slice(0, n); };
  $$('[data-d]', el).forEach(b => b.onclick = () => { const [ar, sub] = b.dataset.d.split('|'); startQuiz(`Weak spot: ${sub}`, pick(ar, sub, 12)); });
  const all = $('.all', el); if (all) all.onclick = () => startQuiz('Weakest topics', shuffle(st.slice(0, 3).flatMap(s => pick(s.area, s.subtopic, 7))));
}

// ---------- Settings & profiles ----------
function settings(el) {
  const s = S.settings();
  el.innerHTML = `<div class="grid tiles" style="margin-bottom:14px"><a class="tile" href="#/plan"><span class="ico">🗓️</span><b>Study plan</b></a><a class="tile" href="#/guide"><span class="ico">🧠</span><b>How to study</b></a><a class="tile" href="#/profiles"><span class="ico">👥</span><b>Profiles</b></a><a class="tile" href="#/weak"><span class="ico">📉</span><b>Weak spots</b></a><a class="tile" href="#/bookmarks"><span class="ico">★</span><b>Bookmarks</b></a><a class="tile" href="#/about"><span class="ico">ℹ️</span><b>About</b></a></div><div class="card"><h2>Settings</h2>
    <label class="field"><span>Exam date</span><input type="date" id="ed" value="${esc(s.examDate)}"></label>
    <label class="field"><span>Daily goal (questions + cards)</span><input type="number" id="goal" min="5" max="300" value="${s.goal}"></label>
    <div class="field"><span><b>Theme</b></span><div class="seg" id="theme">${['auto', 'light', 'dark'].map(t => `<button data-v="${t}" class="${s.theme === t ? 'on' : ''}">${t === 'auto' ? 'System' : t[0].toUpperCase() + t.slice(1)}</button>`).join('')}</div></div>
    <div class="field"><span><b>Text size</b></span><div class="seg" id="size">${[['s', 'Small'], ['m', 'Normal'], ['l', 'Large'], ['xl', 'Extra large']].map(([k, t]) => `<button data-v="${k}" class="${s.size === k ? 'on' : ''}">${t}</button>`).join('')}</div></div>
    <label class="field" style="display:flex;gap:10px;align-items:center"><input type="checkbox" id="conf" ${s.confidence ? 'checked' : ''} style="width:24px;height:24px"> <span style="margin:0">Ask confidence (sure / unsure / guess) before revealing answers</span></label></div>
    <div class="card"><h3>Profiles</h3><p>Active: <b>${esc(S.profile().name)}</b></p><a class="btn" href="#/profiles">Manage profiles</a></div>
    <div class="card"><h3>Back up or move progress</h3><p class="muted">Progress is stored only on this device. Export a file to back it up or to move it to another phone, then import it there.</p>
      <div class="btn-row"><button class="btn" id="exp">Export my progress</button><button class="btn" id="expall">Export all profiles</button><label class="btn">Import file<input type="file" id="imp" accept="application/json,.json" class="sr-only"></label></div>
      <details><summary>Danger zone</summary><button class="btn" id="reset">Reset my progress</button></details></div>
    <div class="card"><h3>Offline</h3><p id="offline" class="muted">Checking offline status…</p><button class="btn small" id="recache">Re-download for offline use</button></div>
    <div class="card"><h3>Share</h3><p>Send this link to a study partner — each phone keeps its own progress.</p><p><span class="kbd" id="link">${esc(location.origin + location.pathname)}</span></p><div class="btn-row"><button class="btn" id="share">Share link</button></div></div>
    <p class="disclaimer">Not an official CCI product. <a href="#/about">About, sources & image credits</a></p>`;
  $('#ed', el).onchange = e => { S.setSetting('examDate', e.target.value); toast('Exam date saved'); };
  $('#goal', el).onchange = e => { S.setSetting('goal', Math.max(5, +e.target.value || 30)); toast('Daily goal saved'); };
  $$('#theme button', el).forEach(b => b.onclick = () => { S.setSetting('theme', b.dataset.v); applyTheme(); settings(el); });
  $$('#size button', el).forEach(b => b.onclick = () => { S.setSetting('size', b.dataset.v); applyTheme(); settings(el); });
  $('#conf', el).onchange = e => S.setSetting('confidence', e.target.checked);
  $('#exp', el).onclick = () => download(`cct-study-${S.profile().name.replace(/\W+/g, '-')}-${S.today()}.json`, S.exportData(false));
  $('#expall', el).onclick = () => download(`cct-study-all-${S.today()}.json`, S.exportData(true));
  $('#imp', el).onchange = async e => { const f = e.target.files[0]; if (!f) return; try { S.importData(await f.text()); applyTheme(); toast('Progress imported'); route(); } catch (err) { toast('Import failed: ' + err.message); } };
  $('#reset', el).onclick = () => { if (confirm(`Erase all progress for ${S.profile().name}? This cannot be undone.`)) { S.resetProgress(); toast('Progress reset'); route(); } };
  $('#share', el).onclick = async () => { const url = location.origin + location.pathname; try { if (navigator.share) await navigator.share({ title: 'CCT Study', text: 'Free CCT exam study app', url }); else { await navigator.clipboard.writeText(url); toast('Link copied'); } } catch (e) { /* cancelled */ } };
  $('#recache', el).onclick = () => { navigator.serviceWorker?.controller?.postMessage('recache'); toast('Downloading files for offline use…'); };
  offlineStatus($('#offline', el));
}
async function offlineStatus(node) {
  try {
    if (!('caches' in window)) { node.textContent = 'This browser does not support offline storage.'; return; }
    const names = await caches.keys(); let n = 0; for (const k of names) n += (await (await caches.open(k)).keys()).length;
    node.textContent = navigator.serviceWorker?.controller ? `Offline ready: ${n} files cached on this device.` : `${n} files cached. Reload once to finish enabling offline mode.`;
  } catch (e) { node.textContent = 'Offline status unavailable.'; }
}
function profiles(el) {
  el.innerHTML = `<div class="card"><h2>Profiles</h2><p class="muted">Each person gets separate progress on this device. Use a first name or nickname — no personal data is needed.</p>
    <ul class="list">${S.profiles().map(p => `<li style="display:flex;align-items:center;gap:8px;padding:6px 0"><span class="grow" style="flex:1"><b>${esc(p.name)}</b>${p.id === S.profile().id ? ' <span class="badge area">active</span>' : ''}<br><small class="muted">${Object.keys(p.q).length} questions seen</small></span>
      ${p.id !== S.profile().id ? `<button class="btn small" data-use="${p.id}">Use</button>` : ''}<button class="btn small ghost" data-ren="${p.id}">Rename</button><button class="btn small ghost" data-del="${p.id}" aria-label="Delete profile">🗑</button></li>`).join('')}</ul>
    <label class="field"><span>Add a profile</span><input type="text" id="pn" maxlength="24" placeholder="Name"></label><button class="btn primary" id="add">Add & switch</button></div>`;
  $('#add', el).onclick = () => { const n = $('#pn', el).value; if (!n.trim()) return toast('Enter a name'); S.addProfile(n); applyTheme(); toast('Switched to ' + n); location.hash = '#/'; };
  $$('[data-use]', el).forEach(b => b.onclick = () => { S.switchProfile(b.dataset.use); applyTheme(); toast('Switched to ' + S.profile().name); location.hash = '#/'; });
  $$('[data-ren]', el).forEach(b => b.onclick = () => { const n = prompt('New name'); if (n) { S.renameProfile(b.dataset.ren, n); profiles(el); route(); } });
  $$('[data-del]', el).forEach(b => b.onclick = () => { const p = S.profiles().find(x => x.id === b.dataset.del); if (confirm(`Delete profile "${p.name}" and all its progress?`)) { S.deleteProfile(p.id); applyTheme(); route(); } });
}

// ---------- boot ----------
async function boot() {
  applyTheme();
  $('.profile-chip').onclick = () => (location.hash = '#/profiles');
  try { await loadData(); } catch (e) { main().innerHTML = `<div class="card"><h2>Could not load study data</h2><p>${esc(e.message)}</p><p>If you opened index.html directly from disk, serve the folder over http (see README) or use the GitHub Pages link.</p></div>`; return; }
  window.addEventListener('hashchange', route); route();
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(e => console.warn('SW registration failed', e));
}
boot();
