// guide.js — the guided experience: Today's plan, day and month calendar, catch-up / re-plan, the four hub
// screens (Learn, Practice, Review, Progress), first-launch walkthrough + Help, end-of-day recap,
// final-week mode, exam traps, patient care, anatomy, plan settings and reminders.
import { D, AREAS, AREA_FULL, AREA_PCT, AREA_ICON } from './data.js';
import { $, $$, h, esc, toast, pct, bar, shuffle, accCls } from './ui.js';
import * as S from './store.js';
import * as PL from './planner.js';
import { runRapid } from './quiz.js';
import * as P from './pages.js';
import { startQuiz, weightedMix, unseenFirst, buildExam, gauge, setCleanup, applyTheme } from './app.js';

const Q = () => D.questions;
const daysTo = d => PL.diffDays(PL.todayStr(), d);
const goHash = x => { location.hash = x; };

// ---------- helpers ----------
export function weakest() {
  const st = S.subtopicStats(Q()).filter(s => s.attempts >= 3).sort((a, b) => a.acc - b.acc);
  if (st.length && st[0].acc < 0.85) return { area: st[0].area, sub: st[0].subtopic, acc: st[0].acc };
  // no clear weak spot yet → the least-practised area relative to its exam weight
  const as = S.areaStats(Q()); const a = Object.keys(AREAS).sort((x, y) => (as[x]?.seen || 0) / AREA_PCT[x] - (as[y]?.seen || 0) / AREA_PCT[y])[0];
  return { area: a, sub: null, acc: as[a]?.acc ?? null };
}
const done = (id, label) => { if (PL.complete(id)) { toast(`✓ ${label || 'Task'} checked off`); const added = PL.checkWeak(); if (added.length) setTimeout(() => toast(`Extra review added for: ${added.join(', ')}`, 3500), 2300); } };
const finishHook = id => () => done(id);

// ---------- task launcher: #/task/<id> ----------
export function task(el, [id]) {
  id = decodeURIComponent(id || ''); const t = PL.findTask(id);
  if (!t) { el.innerHTML = `<div class="card"><p>That task is no longer in your plan.</p><a class="btn primary" href="#/">Back to Today</a></div>`; return; }
  const back = t.date === PL.todayStr() ? "#/" : `#/day/${t.date}`, title = t.title, fin = finishHook(id);
  const quiz = (items, ttl = title) => startQuiz(ttl, items, { onFinish: fin, back });
  switch (t.type) {
    case 'review': {
      const dq = S.dueQuestions(Q()), dc = S.dueCards(D.cards);
      if (!dq.length && !dc.length) { done(id, 'Review'); el.innerHTML = `<div class="card center"><h2>Nothing due 🎉</h2><p>No questions or cards are due right now, so this task is done.</p><a class="btn primary" href="#/">Back to Today</a></div>`; return; }
      const cards = () => dc.length ? P.cardSession(el, shuffle(dc), 'Due flashcards', { onFinish: fin }) : fin();
      if (dq.length) return startQuiz('Daily review', shuffle(dq), { onFinish: () => { if (!dc.length) fin(); else setTimeout(() => { toast('Now your due flashcards'); cards(); }, 50); }, back });
      return cards();
    }
    case 'lesson': return goHash(`#/lesson/${t.lesson}?task=${encodeURIComponent(id)}&back=${encodeURIComponent(back)}`);
    case 'quiz': { const set = new Set(t.lessons); let pool = Q().filter(q => set.has(q.lesson)); const areas = new Set(t.lessons.map(l => l[0]));
      if (pool.length < t.n) pool = [...pool, ...Q().filter(q => areas.has(q.area) && !set.has(q.lesson))];
      return quiz(unseenFirst(pool.filter((q, i, a) => a.indexOf(q) === i)).slice(0, t.n).sort(() => Math.random() - 0.5)); }
    case 'extra': { const pool = Q().filter(q => q.area === t.area && q.subtopic === t.sub); const l = pool[0]?.lesson;
      el.innerHTML = `<div class="card"><span class="badge area">Extra review</span><h2>${esc(t.sub)}</h2><p>You scored below 60% here, so the plan added this review. Read the lesson, then answer ${t.n} questions.</p>
        <div class="btn-row">${l && D.lessons[l] ? `<a class="btn" href="#/lesson/${l}?back=${encodeURIComponent('#/task/' + encodeURIComponent(id))}">Read the lesson</a>` : ''}<button class="btn primary" id="go">Start ${t.n} questions</button></div></div>`;
      $('#go', el).onclick = () => quiz(shuffle(pool).slice(0, t.n), 'Extra review: ' + t.sub); return; }
    case 'cards': { const pc = S.profile().c; let cards = D.cards.filter(c => !t.area || (t.area === 'anatomy' ? c.tags?.includes('anatomy') : c.area === t.area)); cards = [...shuffle(cards.filter(c => !pc[c.id])), ...shuffle(cards.filter(c => pc[c.id]))];
      return P.cardSession(el, cards.slice(0, t.n), title, { onFinish: fin }); }
    case 'weak': { const w = weakest(); const pool = Q().filter(q => q.area === w.area && (!w.sub || q.subtopic === w.sub)); const items = unseenFirst(pool.length >= 5 ? pool : Q().filter(q => q.area === w.area)).slice(0, t.n);
      toast(`Weakest: ${w.sub || AREAS[w.area]}${w.acc != null ? ' (' + pct(w.acc) + ')' : ''}`, 3000); return quiz(shuffle(items), `Weak spot: ${w.sub || AREAS[w.area]}`); }
    case 'mixed': return quiz(weightedMix(Q(), t.n));
    case 'traps': return quiz(shuffle(Q().filter(q => q.tags?.includes('trap'))).slice(0, t.n));
    case 'scen': return quiz(shuffle(Q().filter(q => q.tags?.includes('scenario'))).slice(0, t.n));
    case 'smart': { const items = smartItems(t.n); return quiz(items.length >= 5 ? items : weightedMix(Q(), t.n), items.length >= 5 ? title : 'Mixed quiz (not enough history for smart review yet)'); }
    case 'trainer': return P.trainer(el, [], {}, { goal: t.n, onDone: fin });
    case 'calc': return P.calc(el, ['mix'], {}, { goal: t.n, onDone: fin });
    case 'rapid': return setCleanup(runRapid(el, { onEnd: fin }));
    case 'pacing': return startQuiz('Pacing drill', weightedMix(Q(), 30), { mode: 'exam', timeLimit: 26, pace: (110 * 60) / 130, onFinish: fin, back });
    case 'exam': { const { items, pre } = buildExam(); const min = S.settings().examMinutes || 110;
      return startQuiz('Practice exam', items, { mode: 'exam', timeLimit: min, pretest: pre, pace: (min * 60) / 130, onFinish: fin, back }); }
    case 'final': case 'checklist': return goHash(`#/final?task=${encodeURIComponent(id)}${t.type === 'checklist' ? '#checklist' : ''}`);
    case 'recap': return goHash(`#/recap?task=${encodeURIComponent(id)}`);
  }
}
export function smartItems(n = 20) {
  const pr = S.profile().q; const seen = Q().filter(q => pr[q.id]);
  const times = seen.map(q => pr[q.id].ms || 0).filter(Boolean).sort((a, b) => a - b); const med = times[Math.floor(times.length / 2)] || 30000;
  const w = q => { const r = pr[q.id]; return (r.wrong >= 2 ? 3 : 0) + (r.lastOk === false ? 2 : 0) + (r.guessed ? 2 : 0) + (r.unsureRight ? 1.5 : 0) + (r.ms > Math.max(45000, med * 1.5) ? 1.5 : 0) + Math.random() * 0.5; };
  return seen.map(q => [q, w(q)]).filter(([, x]) => x > 0.6).sort((a, b) => b[1] - a[1]).slice(0, n).map(([q]) => q);
}

// ---------- task list rendering ----------
function taskRow(t, { star = false, overdue = false } = {}) {
  const ok = PL.isDone(t), moved = PL.plan().moved[t.id];
  return `<li class="task ${ok ? 'done' : ''} ${star ? 'start' : ''} ${overdue ? 'over' : ''}">
    <button class="tick" data-tick="${esc(t.id)}" aria-label="${ok ? 'Mark not done' : 'Mark done'}" aria-pressed="${ok}">${ok ? '✓' : ''}</button>
    <button class="task-main" data-go="${esc(t.id)}"><span class="t-ico">${PL.TYPE_ICON[t.type] || '•'}</span><span class="grow"><b>${esc(t.title)}</b>${star ? ' <span class="badge start">Start here</span>' : ''}${t.important && overdue ? ' <span class="badge imp">⭐ important</span>' : ''}${moved ? ' <span class="badge">moved to new plan</span>' : ''}<br>
    <small class="muted">${overdue ? `From ${PL.nice(t.date)} · ` : ''}${esc(t.desc)} · ~${t.min} min</small></span><span class="chev"></span></button></li>`;
}
function bindTasks(el, rerender) {
  $$('[data-go]', el).forEach(b => b.onclick = () => goHash('#/task/' + encodeURIComponent(b.dataset.go)));
  $$('[data-tick]', el).forEach(b => b.onclick = e => { e.stopPropagation(); const id = b.dataset.tick; if (PL.plan().done[id]) PL.uncomplete(id); else done(id); rerender(); });
}
function autoTicks(d) { // tasks that check themselves off
  if (d !== PL.todayStr()) return;
  for (const t of PL.tasksFor(d)) if (t.type === 'review' && !PL.isDone(t) && !S.dueQuestions(Q()).length && !S.dueCards(D.cards).length && (S.dayLog().n || S.dayLog().cards[1] || Object.keys(S.profile().q).length === 0)) PL.complete(t.id);
}

// ---------- Today ----------
export function today(el) {
  if (!PL.isSetUp()) return setupCard(el);
  const t = PL.todayStr(), s = S.settings(); autoTicks(t);
  const list = PL.tasksFor(t), over = PL.overdue(), wk = PL.weekInfo(t), phase = PL.phaseOf(t);
  const left = daysTo(s.examDate), rd = S.readiness(Q()), allDone = list.length && list.every(PL.isDone);
  const tomorrow = PL.addDays(t, 1), tl = PL.tasksFor(tomorrow);
  const firstOpen = [...over.slice(0, 3), ...list].find(x => !PL.isDone(x));
  const st = S.areaStats(Q()), todayN = S.profile().days[t] || 0;
  el.innerHTML = `
  ${PL.reminderDue() && !allDone ? `<div class="notice">⏰ It's past your study reminder time (${esc(s.remindTime)}). Today's plan is below.</div>` : ''}
  ${over.length ? `<div class="behind"><b>⚠ Behind schedule:</b> ${over.length} task${over.length > 1 ? 's' : ''} overdue from earlier days (${over.filter(x => x.important).length} important).
    <div class="btn-row"><a class="btn primary small" href="#/catchup">Catch up now</a><button class="btn small" id="replan">Re-plan</button></div></div>` : ''}
  ${left < 0 ? `<div class="notice">Your exam date (${esc(s.examDate)}) has passed. Update it in <a href="#/plansettings">Plan settings</a>.</div>` : ''}
  <div class="card plan-card">
    <div class="plan-head"><div><h2 style="margin:0">Today's plan</h2><small class="muted">${PL.nice(t, { weekday: 'long', month: 'long', day: 'numeric' })} · ${PL.PHASES[phase].icon} ${PL.PHASES[phase].name}</small></div>
      <div class="countdown"><b>${Math.max(0, left)}</b><small>days left</small></div></div>
    <div class="wk"><small>Week ${wk.week} of ${wk.weeks} · ${wk.done}/${wk.n} tasks this week</small>${bar(wk.n ? wk.done / wk.n : 0, 'ok')}</div>
    ${PL.isRest(t) && !list.length ? `<p>🛋️ <b>Rest day.</b> Nothing scheduled. If you want, do a 5-minute flashcard round or look at your weak spots — or just rest.</p><div class="btn-row"><a class="btn small" href="#/flashcards?deck=due">Due flashcards</a><a class="btn small" href="#/weak">Weak spots</a><a class="btn small" href="#/day/${tomorrow}">Work ahead</a></div>` : ''}
    ${over.length ? `<h3 class="sub">Overdue first</h3><ol class="tasks">${over.slice(0, 3).map(x => taskRow(x, { overdue: true, star: x === firstOpen })).join('')}</ol>${over.length > 3 ? `<a class="small-link" href="#/catchup">+ ${over.length - 3} more overdue →</a>` : ''}<h3 class="sub">Today</h3>` : ''}
    <ol class="tasks">${list.map(x => taskRow(x, { star: x === firstOpen })).join('')}</ol>
    ${allDone ? `<div class="done-today">✅ <b>Done for today!</b> You finished every task. Stop here, do something relaxing, and sleep 7–9 hours — that is when memory consolidates.<div class="btn-row"><a class="btn small" href="#/recap">See today's recap</a><a class="btn small ghost" href="#/day/${tomorrow}">Work ahead on tomorrow</a></div></div>` : ''}
  </div>
  ${tl.length ? `<div class="card"><h3 style="margin-top:0">Tomorrow · ${PL.nice(tomorrow)}</h3><ul class="mini">${tl.map(x => `<li>${PL.TYPE_ICON[x.type]} ${esc(x.title)}${PL.isDone(x) ? ' ✓' : ''}</li>`).join('')}</ul><div class="btn-row"><a class="btn small" href="#/day/${tomorrow}">Open tomorrow →</a><a class="btn small ghost" href="#/calendar">Month view</a></div></div>` : `<div class="card"><a class="btn small" href="#/calendar">Open the study calendar</a></div>`}
  <div class="card"><div class="gauge">${gauge(rd.prob, rd.evidence)}<div><b>Readiness</b><br><small class="muted">${rd.evidence < 0.15 ? 'Answer some questions to see your estimate.' : `Estimated chance of passing <b>${Math.round(rd.prob * 100)}%</b> (expected ≈ ${pct(rd.est)} correct)`}</small><br><small class="muted">🔥 ${S.streak()}-day streak · ${todayN}/${s.goal} answered today</small></div></div>${bar(todayN / s.goal, todayN >= s.goal ? 'ok' : '')}
    <small class="muted">An estimate from your recent accuracy (weighted by the CCI exam matrix) and practice exams — not a CCI score.</small></div>
  <div class="card"><h3 style="margin-top:0">Content areas</h3>${Object.keys(AREAS).map(a => { const x = st[a] || {}; return `<a class="area-row" href="#/drill/${a}"><span>${AREA_ICON[a]}</span><span class="grow"><b>${esc(AREAS[a])}</b> <small class="muted">${AREA_PCT[a]}%</small><br><small class="muted">Seen ${x.seen || 0}/${x.total || 0} · accuracy ${pct(x.acc)}</small>${bar(x.acc, accCls(x.acc))}</span></a>`; }).join('')}</div>
  <p class="disclaimer">Study aid only. <b>Not an official CCI product</b>; not affiliated with or endorsed by Cardiovascular Credentialing International. <a href="#/about">About & sources</a></p>`;
  bindTasks(el, () => today(el));
  const rp = $('#replan', el); if (rp) rp.onclick = () => replanDialog(el);
}
function replanDialog(el) {
  const over = PL.overdue(), remaining = PL.diffDays(PL.todayStr(), S.settings().examDate);
  if (!confirm(`Re-plan spreads your remaining lessons evenly across the ${remaining} days left before the exam.\n\n${over.length} overdue task(s) will be marked "moved to new plan" (they stay visible on their original days), and any unfinished lessons are rescheduled. Completed work is kept.\n\nRe-plan now?`)) return;
  PL.recalc({ moveOverdue: true }); toast('Plan updated from today'); today(el);
}
function setupCard(el) {
  el.innerHTML = `<div class="card plan-card"><h2>Let's build your study plan</h2><p>Tell the app your exam date and when you're starting. It will make a day-by-day checklist through exam day.</p><button class="btn primary block" id="setup">Set up my plan (1 minute)</button></div>
    <div class="grid two"><a class="btn" href="#/practice">Just practice for now</a><a class="btn" href="#/help">How this app works</a></div>`;
  $('#setup', el).onclick = () => walkthrough(4);
}

// ---------- Catch up ----------
export function catchup(el) {
  const over = PL.overdue(); const imp = over.filter(x => x.important);
  el.innerHTML = `<div class="card"><h2>Catch up</h2><p>${over.length ? `These ${over.length} tasks from earlier days are not done yet, oldest first. ⭐ marks the most important ones (${imp.length}) — do those first if time is short. Finishing a task here counts toward its original day.` : 'Nothing overdue — you are on schedule. 🎉'}</p>
    ${over.length ? `<div class="btn-row"><button class="btn" id="imp">${location.hash.includes('imp=1') ? 'Show all' : 'Show only ⭐ important'}</button><button class="btn" id="replan">Re-plan instead</button></div>` : '<a class="btn primary" href="#/">Back to Today</a>'}</div>
    <ol class="tasks card">${(location.hash.includes('imp=1') ? imp : over).map(x => taskRow(x, { overdue: true })).join('')}</ol>`;
  bindTasks(el, () => catchup(el));
  const i = $('#imp', el); if (i) i.onclick = () => goHash(location.hash.includes('imp=1') ? '#/catchup' : '#/catchup?imp=1');
  const r = $('#replan', el); if (r) r.onclick = () => { replanDialog(el); goHash('#/'); };
}

// ---------- Day view (swipe between days) ----------
export function day(el, [d]) {
  if (!PL.isSetUp()) return setupCard(el);
  d = d || PL.todayStr(); const exam = S.settings().examDate, pl = PL.plan();
  const prev = PL.addDays(d, -1), next = PL.addDays(d, 1), list = PL.tasksFor(d), stt = PL.dayStatus(d), t = PL.todayStr();
  const label = d === t ? 'Today' : d === PL.addDays(t, 1) ? 'Tomorrow' : d === PL.addDays(t, -1) ? 'Yesterday' : '';
  const est = list.reduce((s, x) => s + x.min, 0);
  el.innerHTML = `<div class="day-nav"><button class="btn small" data-d="${prev}" ${d <= pl.start ? 'disabled' : ''}>‹ ${PL.nice(prev, { month: 'short', day: 'numeric' })}</button><div class="center"><b>${label || PL.nice(d, { weekday: 'long' })}</b><br><small class="muted">${PL.nice(d, { month: 'long', day: 'numeric', year: 'numeric' })}</small></div><button class="btn small" data-d="${next}" ${d >= exam ? 'disabled' : ''}>${PL.nice(next, { month: 'short', day: 'numeric' })} ›</button></div>
    <div class="card">${d === exam ? `<h2>🎓 Exam day</h2><p>Good luck! Bring two original, unexpired IDs whose names match your registration exactly.</p><a class="btn primary" href="#/final#checklist">Exam-day checklist</a>` :
      `<p><span class="status ${stt}">${{ done: '✓ Done', partial: '◐ Partly done', missed: '✗ Missed', upcoming: 'Upcoming', today: 'Today', rest: '🛋️ Rest day', none: '' }[stt] || ''}</span> ${list.length ? `<small class="muted">${PL.PHASES[PL.phaseOf(d)].icon} ${PL.PHASES[PL.phaseOf(d)].name} · about ${Math.round(est / 5) * 5} min</small>` : ''}</p>
      ${d > t && list.length ? '<p class="muted">Working ahead? Start any task now — it will count toward this day.</p>' : ''}
      ${list.length ? `<ol class="tasks">${list.map(x => taskRow(x)).join('')}</ol>` : `<p>${PL.isRest(d) ? 'Rest day — nothing scheduled.' : 'No tasks on this day.'}</p>`}`}</div>
    <div class="btn-row"><a class="btn" href="#/">Today</a><a class="btn" href="#/calendar?m=${d.slice(0, 7)}">Month view</a><button class="btn ghost" id="rest">${PL.isRest(d) ? 'Make this a study day' : 'Mark as rest day'}</button></div>
    <p class="muted center"><small>Swipe left or right to change days.</small></p>`;
  $$('[data-d]', el).forEach(b => b.onclick = () => goHash('#/day/' + b.dataset.d));
  bindTasks(el, () => day(el, [d]));
  $('#rest', el).onclick = () => {
    if (d < t) return toast('You can only change today or future days');
    const r = pl.restDates; const i = r.indexOf(d); i >= 0 ? r.splice(i, 1) : r.push(d);
    PL.recalc(); toast(i >= 0 ? 'Study day restored; plan recalculated' : 'Rest day set; plan recalculated'); day(el, [d]);
  };
  let x0 = null; el.ontouchstart = e => { x0 = e.touches[0].clientX; };
  el.ontouchend = e => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; x0 = null; if (Math.abs(dx) > 70) { const target = dx < 0 ? next : prev; if (target >= pl.start && target <= exam) goHash('#/day/' + target); } };
  return () => { el.ontouchstart = el.ontouchend = null; };
}

// ---------- Month view ----------
export function calendar(el, a, p) {
  if (!PL.isSetUp()) return setupCard(el);
  const pl = PL.plan(), t = PL.todayStr(), exam = S.settings().examDate;
  const m = p.m || t.slice(0, 7); const [y, mo] = m.split('-').map(Number);
  const first = new Date(y, mo - 1, 1), daysIn = new Date(y, mo, 0).getDate();
  const prevM = PL.fmt(new Date(y, mo - 2, 1)).slice(0, 7), nextM = PL.fmt(new Date(y, mo, 1)).slice(0, 7);
  const cells = []; for (let i = 0; i < first.getDay(); i++) cells.push('<div></div>');
  for (let dd = 1; dd <= daysIn; dd++) {
    const d = `${m}-${String(dd).padStart(2, '0')}`; const inPlan = d >= pl.start && d <= exam;
    const st = !inPlan ? 'out' : d === exam ? 'exam' : PL.dayStatus(d);
    cells.push(`<button class="cal-day ${st} ${d === t ? 'is-today' : ''}" ${inPlan ? `data-d="${d}"` : 'disabled'} aria-label="${PL.nice(d)} ${st}"><span>${dd}</span><i></i></button>`);
  }
  el.innerHTML = `<div class="card"><div class="day-nav"><button class="btn small" data-m="${prevM}">‹</button><b>${first.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</b><button class="btn small" data-m="${nextM}">›</button></div>
    <div class="cal">${['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(x => `<div class="cal-h">${x}</div>`).join('')}${cells.join('')}</div>
    <div class="legend"><span><i class="done"></i>Done</span><span><i class="partial"></i>Partly done</span><span><i class="missed"></i>Missed</span><span><i class="upcoming"></i>Upcoming</span><span><i class="rest"></i>Rest</span><span><i class="exam"></i>Exam</span></div></div>
    <div class="card"><h3 style="margin-top:0">Your 8-week shape</h3>${Object.entries(PL.PHASES).map(([k, v]) => `<p>${v.icon} <b>${v.name}</b></p>`).join('')}<p class="muted">Weeks 1–3 learn each content area · weeks 4–6 daily mixed quizzes and spaced review · week 7 full timed practice exams · last week light review of weak spots.</p><a class="btn" href="#/plansettings">Plan settings</a></div>`;
  $$('[data-d]', el).forEach(b => b.onclick = () => goHash('#/day/' + b.dataset.d));
  $$('[data-m]', el).forEach(b => b.onclick = () => goHash('#/calendar?m=' + b.dataset.m));
}

// ---------- Plan settings ----------
export function planSettings(el) {
  const pl = PL.plan(), s = S.settings();
  const wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  el.innerHTML = `<div class="card"><h2>Plan settings</h2>
    <label class="field"><span>Exam date</span><input type="date" id="ex" value="${esc(s.examDate)}"></label>
    <label class="field"><span>Start date</span><input type="date" id="st" value="${esc(pl.start || PL.todayStr())}"></label>
    <label class="field"><span>Study time per day: <b id="hv">${pl.hours}</b> h</span><input type="range" id="hr" min="0.5" max="4" step="0.5" value="${pl.hours}"></label>
    <fieldset class="field"><legend>Weekly rest days</legend><div class="pill-list">${wd.map((n, i) => `<label class="chk"><input type="checkbox" value="${i}" ${pl.restWeekdays.includes(i) ? 'checked' : ''}> ${n}</label>`).join('')}</div></fieldset>
    <p class="muted">You can also mark single rest days from any day in the calendar. Changing these recalculates the plan from today; past days and finished work are kept.</p>
    <div class="btn-row"><button class="btn primary" id="save">${PL.isSetUp() ? 'Save & recalculate' : 'Create my plan'}</button>${PL.isSetUp() ? '<button class="btn" id="rebuild">Start over from the start date</button>' : ''}</div></div>
    <div class="card"><h2>Daily reminder</h2>
    <label class="field"><span>Reminder time</span><input type="time" id="rt" value="${esc(s.remindTime || '')}"></label>
    <div class="btn-row"><button class="btn" id="notif">${'Notification' in window && Notification.permission === 'granted' ? '🔔 Notifications on' : 'Allow notifications'}</button><button class="btn" id="ics">📅 Add daily reminder to my calendar</button></div>
    <p class="muted">Notifications only appear if you allow them, and on most phones only while the app is open or in the background. For a reminder that always works, add the calendar event (it repeats daily until exam day). When you open the app after your reminder time, Today also shows a banner.</p></div>`;
  $('#hr', el).oninput = e => { $('#hv', el).textContent = e.target.value; };
  const vals = () => ({ exam: $('#ex', el).value, start: $('#st', el).value, hours: +$('#hr', el).value, restWeekdays: $$('fieldset input:checked', el).map(x => +x.value) });
  const valid = v => { if (!v.exam || !v.start) { toast('Pick both dates'); return false; } if (v.start >= v.exam) { toast('Start date must be before the exam date'); return false; } return true; };
  $('#save', el).onclick = () => {
    const v = vals(); if (!valid(v)) return;
    if (!PL.isSetUp()) { PL.setup(v); toast('Plan created'); return goHash('#/'); }
    const startChanged = v.start !== pl.start;
    S.setSetting('examDate', v.exam); Object.assign(pl, { hours: v.hours, restWeekdays: v.restWeekdays });
    if (startChanged && confirm('Changing the start date rebuilds the whole calendar (finished tasks stay counted). Continue?')) { PL.setup(v); } else PL.recalc();
    toast('Plan recalculated from today'); goHash('#/');
  };
  const rb = $('#rebuild', el); if (rb) rb.onclick = () => { const v = vals(); if (valid(v) && confirm('Rebuild the calendar from the start date? Finished tasks stay counted, but overdue markers are reset.')) { PL.setup(v); toast('Plan rebuilt'); goHash('#/'); } };
  $('#rt', el).onchange = e => { S.setSetting('remindTime', e.target.value); scheduleReminder(); toast(e.target.value ? 'Reminder time saved' : 'Reminder off'); };
  $('#notif', el).onclick = async () => {
    if (!('Notification' in window)) return toast('This browser does not support notifications — use the calendar reminder');
    const r = await Notification.requestPermission(); toast(r === 'granted' ? 'Notifications allowed' : 'Notifications not allowed — the calendar reminder still works'); planSettings(el);
  };
  $('#ics', el).onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([PL.icsReminder()], { type: 'text/calendar' })); a.download = 'cct-study-reminder.ics'; a.click(); };
}
let remindTimer = null;
export function scheduleReminder() {
  clearTimeout(remindTimer); const r = S.settings().remindTime; if (!r || !('Notification' in window) || Notification.permission !== 'granted') return;
  const [hh, mm] = r.split(':').map(Number); const at = new Date(); at.setHours(hh, mm, 0, 0); if (at <= new Date()) return;
  remindTimer = setTimeout(async () => {
    if (!PL.tasksFor(PL.todayStr()).some(t => !PL.isDone(t))) return;
    const body = 'Time to study — open Today\'s plan.';
    try { const reg = await navigator.serviceWorker?.getRegistration(); if (reg) reg.showNotification('CCT Study', { body, icon: 'icons/icon-192.png', tag: 'cct-daily' }); else new Notification('CCT Study', { body }); } catch (e) { /* ignore */ }
  }, at - new Date());
}

// ---------- Walkthrough & Help ----------
const SLIDES = [
  ['👋 Welcome to CCT Study', `<p>A free, offline study app for the CCI <b>Certified Cardiographic Technician</b> exam. It works without internet once installed, and all progress stays on this device.</p><p class="notice">Study aid only — <b>not an official CCI product</b>.</p>`],
  ['📅 Today: your daily plan', `<p>The <b>Today</b> tab opens with one card that lists exactly what to do, in order. Tap an item to start it; it checks itself off when you finish.</p><p>Overdue tasks appear first. When everything is ticked you'll see <b>Done for today</b> — that's your signal to stop.</p>`],
  ['📘 Learn and ✏️ Practice', `<p><b>Learn</b>: lessons for every topic, anatomy & blood flow, patient care, lead placement, exam traps, memory aids, medications, glossary and printable cheat sheets.</p><p><b>Practice</b>: quizzes, topic drills, the timed 130-question exam, rhythm trainer, calculations, scenarios and rapid fire. Each mode says when to use it.</p>`],
  ['🔁 Review and 📊 Progress', `<p><b>Review</b>: spaced repetition (missed items return after 1, 3, 7 and 14 days), flashcards, weak spots, final-week mode and your end-of-day recap.</p><p><b>Progress</b>: readiness meter, calendar, practice exam history, plan settings, profiles and backup.</p>`],
];
const ROUTINE = `<ol class="routine"><li><b>Review</b> what's due (10 min)</li><li><b>Learn</b> today's lesson(s)</li><li><b>Quiz yourself</b> on them right away</li><li><b>Drill</b> your weakest area</li><li><b>Recap</b> before bed — then sleep</li></ol>`;
export function walkthrough(startAt = 0) {
  const pl = PL.plan(), s = S.settings(), setUp = PL.isSetUp();
  const ov = h(`<div class="wt" role="dialog" aria-modal="true" aria-label="How CCT Study works"><div class="wt-card"><div class="wt-body"></div><div class="wt-dots"></div><div class="btn-row stretch wt-nav"></div></div></div>`);
  document.body.append(ov); let i = startAt;
  const close = () => { S.profile().seenIntro = true; S.save(true); ov.remove(); };
  const draw = () => {
    const last = i === SLIDES.length;
    $('.wt-body', ov).innerHTML = last ? `<h2>🗓️ ${setUp ? 'Your daily routine' : 'Set up your plan'}</h2>${ROUTINE}
      ${setUp ? `<p class="muted">Change dates, hours or rest days any time in Progress → Plan settings.</p>` : `
      <label class="field"><span>Your name (for your profile)</span><input id="w-name" value="${esc(S.profile().name === 'Me' ? '' : S.profile().name)}" placeholder="e.g. Sam" autocomplete="off"></label>
      <div class="grid two"><label class="field"><span>Exam date</span><input type="date" id="w-ex" value="${esc(s.examDate)}"></label><label class="field"><span>Start date</span><input type="date" id="w-st" value="${esc(pl.start || PL.todayStr())}"></label></div>
      <label class="field"><span>Study time per day: <b id="w-hv">1.5</b> h</span><input type="range" id="w-hr" min="0.5" max="4" step="0.5" value="1.5"></label>
      <p class="muted"><small>Sharing this phone? Each person adds a profile with the 👤 button, and each profile gets its own plan.</small></p>`}`
      : `<h2>${SLIDES[i][0]}</h2>${SLIDES[i][1]}`;
    $('.wt-dots', ov).innerHTML = [...SLIDES, 0].map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('');
    $('.wt-nav', ov).innerHTML = `${i ? '<button class="btn" data-w="back">Back</button>' : '<button class="btn ghost" data-w="skip">Skip</button>'}<button class="btn primary" data-w="next">${last ? (setUp ? 'Done' : 'Create my plan') : 'Next'}</button>`;
    const hr = $('#w-hr', ov); if (hr) hr.oninput = e => { $('#w-hv', ov).textContent = e.target.value; };
    $$('[data-w]', ov).forEach(b => b.onclick = () => {
      const w = b.dataset.w;
      if (w === 'skip') return close();
      if (w === 'back') { i--; return draw(); }
      if (!last) { i++; return draw(); }
      if (!setUp) {
        const ex = $('#w-ex', ov).value, st = $('#w-st', ov).value, name = $('#w-name', ov).value.trim();
        if (!ex || !st || st >= ex) return toast('Pick a start date before the exam date');
        if (name) S.renameProfile(S.profile().id, name);
        PL.setup({ start: st, exam: ex, hours: +$('#w-hr', ov).value });
      }
      close(); goHash('#/'); window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
  };
  draw();
}
export function help(el) {
  el.innerHTML = `<div class="card"><h2>Help</h2><button class="btn primary block" id="wt">▶ Replay the walkthrough</button></div>
  <div class="card"><h3>Recommended daily routine</h3>${ROUTINE}<p class="muted">Today's plan already puts these in order for you. Short daily sessions beat long cramming sessions.</p></div>
  <div class="card"><h3>Recommended weekly rhythm</h3><table class="simple">
    <tr><td><b>Early in the week</b></td><td>Learn new material: lessons + a quiz right after each one.</td></tr>
    <tr><td><b>Midweek</b></td><td>Mixed (interleaved) quizzes and the rhythm trainer.</td></tr>
    <tr><td><b>End of the week</b></td><td>A timed practice exam or pacing drill.</td></tr>
    <tr><td><b>Rest days</b></td><td>Optional 10 minutes on weak spots or due flashcards — or real rest.</td></tr></table></div>
  <div class="card"><h3>The five tabs</h3><ul class="list plain">
    <li>📅 <b>Today</b> — the plan for today, overdue work first, and tomorrow's preview.</li>
    <li>📘 <b>Learn</b> — lessons and reference material. Use it when a topic is new or you keep missing it.</li>
    <li>✏️ <b>Practice</b> — every quiz mode. Use it when you want questions.</li>
    <li>🔁 <b>Review</b> — what's due, flashcards, weak spots, final-week mode, recap.</li>
    <li>📊 <b>Progress</b> — readiness, calendar, exam history, settings, profiles, backup.</li></ul></div>
  <div class="card"><h3>Falling behind?</h3><p>If you miss a day, Today shows a <b>Behind schedule</b> banner. <b>Catch up now</b> lists the missed tasks (⭐ = most important). <b>Re-plan</b> spreads the remaining lessons evenly over the days left. Missed work is never deleted silently.</p></div>
  <div class="card"><h3>How to study well</h3><p>Quiz yourself before rereading, space your sessions, mix topics, be honest with Sure/Unsure/Guess, sleep 7–9 hours, and do a brief low-stakes recap before bed.</p><a class="btn" href="#/guide">Read the full study guide</a></div>
  <p class="disclaimer">Not an official CCI product. Confirm exam details at cci-online.org.</p>`;
  $('#wt', el).onclick = () => walkthrough(0);
}

// ---------- Hubs ----------
const item = (href, ico, t, use) => `<li><a href="${href}"><span class="hub-ico">${ico}</span><span class="grow"><b>${t}</b><br><small class="muted">${use}</small></span><span class="chev"></span></a></li>`;
export function learn(el) {
  el.innerHTML = `<div class="card"><ul class="list">
    ${item('#/library', '📚', 'Lesson library', `Use when a topic is new or keeps tripping you up. ${D.lessonList.length} mini-lessons.`)}
    ${item('#/anatomy', '🫀', 'Anatomy & blood flow', 'Use first — chambers, valves, coronaries, conduction and the full path of blood.')}
    ${item('#/care', '🧑‍⚕️', 'Patient care & communication', 'Use for "what should the tech do FIRST" questions.')}
    ${item('#/leads', '📍', 'Lead placement & lead groups', 'Use when you mix up V1–V6, limb leads or which wall each lead sees.')}
    ${item('#/traps', '⚠️', 'Common mistakes & exam traps', 'Use the week before a practice exam to avoid easy losses.')}
    ${item('#/mnemonics', '💡', 'Memory aids', 'Use when a list will not stick (valve order, blocks, drug classes).')}
    ${item('#/meds', '💊', 'Medication quick reference', 'Use for drug class, ECG effect and exam traps.')}
    ${item('#/glossary', '📖', 'Glossary & normal values', `Use for fast look-ups and drilling terms. ${D.glossary.length} terms.`)}
    ${item('#/cheat', '🖨️', 'Printable cheat sheets', 'Use when you want to review away from the screen.')}
    ${item('#/images', '🖼️', 'ECG gallery', 'Use to browse real and generated tracings.')}
    ${item('#/guide', '🧠', 'How to study with this app', 'Read once at the start — then trust the plan.')}
  </ul></div>`;
}
export function practice(el) {
  el.innerHTML = `<div class="card"><ul class="list">
    ${item('#/quick', '⚡', 'Quick quiz (10–20)', 'Use when you have 10–15 minutes.')}
    ${item('#/drill', '📚', 'Topic drill', 'Use right after learning a topic, or to target one area.')}
    ${item('#/mixed', '🔀', 'Interleaved mixed practice', 'Use from week 4 on — mixing topics improves long-term retention.')}
    ${item('#/smart', '🎯', 'Smart review', 'Use when you have history — targets slow, guessed and twice-missed questions.')}
    ${item('#/exam', '⏱️', 'Full practice exam (130 Q)', 'Use in week 7 under real timing, with a pacing coach.')}
    ${item('#/exam?pacing=1', '⏲️', 'Pacing drill (30 Q, 26 min)', 'Use when you tend to run out of time.')}
    ${item('#/trainer', '📏', 'Rhythm trainer', 'Use daily for rhythm analysis — measure before you name.')}
    ${item('#/calc', '🧮', 'Calculation practice', 'Use for heart rate, intervals, target HR and QTc.')}
    ${item('#/scenarios', '🧑‍⚕️', 'Patient scenarios', 'Use for prep, infection control, emergencies and symptomatic patients.')}
    ${item('#/traps?quiz=all', '⚠️', 'Exam-traps quiz', 'Use to drill look-alike rhythms and easily confused values.')}
    ${item('#/rapid', '⏲️', 'Rapid fire (60 s)', 'Use when you have five minutes.')}
    ${item('#/search', '🔎', 'Search questions', 'Use to find a topic or a question you remember.')}
    ${item('#/bookmarks', '★', 'Bookmarks', `Use for questions you saved for later (${S.profile().bookmarks.length}).`)}
  </ul></div>`;
}
export function reviewHub(el) {
  const dq = S.dueQuestions(Q()).length, dc = S.dueCards(D.cards).length, left = daysTo(S.settings().examDate);
  el.innerHTML = `<div class="card"><div class="stats"><div class="stat"><b>${dq}</b><small>questions due</small></div><div class="stat"><b>${dc}</b><small>cards due</small></div><div class="stat"><b>${S.queuedCount()}</b><small>in the queue</small></div></div></div>
    <div class="card"><ul class="list">
    ${item('#/review', '🔁', 'Daily review (due today)', 'Use first thing every day — missed items return after 1, 3, 7 and 14 days.')}
    ${item('#/flashcards', '🃏', 'Flashcards', `Use for rapid drilling. ${D.cards.length} cards; feeds the same schedule.`)}
    ${item('#/weak', '📉', 'Weak spots', 'Use when you want the one-tap drill on your lowest-scoring topics.')}
    ${item('#/final', '🌙', 'Final-week mode', left <= 8 ? 'This is your week: high-yield facts, most-missed questions, exam-day checklist.' : 'Use in the last 7 days: high-yield facts and exam-day checklist.')}
    ${item('#/recap', '📝', 'End-of-day recap', 'Use before bed: what you studied, accuracy and 3 things for tomorrow.')}
    ${item('#/glossary?drill=1', '📖', 'Glossary drill', 'Use for terms, abbreviations and normal values.')}
    ${item('#/bookmarks', '★', 'Bookmarked questions', 'Use for the tricky ones you saved.')}
  </ul></div>`;
}
export function progress(el) {
  const s = S.settings(), rd = S.readiness(Q()), st = S.areaStats(Q()), ex = S.profile().exams.slice(-6).reverse(), left = daysTo(s.examDate);
  const wk = PL.isSetUp() ? PL.weekInfo() : null;
  el.innerHTML = `<div class="card"><div class="gauge">${gauge(rd.prob, rd.evidence)}<div><h2 style="margin:0">Readiness</h2><p class="muted" style="margin:.2em 0">${rd.evidence < 0.15 ? 'Answer some questions to see your estimate.' : `Estimated chance of passing <b>${Math.round(rd.prob * 100)}%</b> · expected ≈ ${pct(rd.est)}`}</p><p style="margin:0"><b>${Math.max(0, left)}</b> days to your exam (${esc(s.examDate)})</p></div></div>
    <small class="muted">Blends recent accuracy per area (weighted by the CCI matrix) with your last three practice exams. Pass line used: about ${Math.round(S.PASS_PCT * 100)}% correct — CCI's real cut is a scaled 650/900.</small></div>
    <div class="card tight"><div class="stats"><div class="stat"><b>🔥 ${S.streak()}</b><small>day streak</small></div><div class="stat"><b>${S.profile().days[S.today()] || 0}/${s.goal}</b><small>daily goal</small></div>${wk ? `<div class="stat"><b>${wk.done}/${wk.n}</b><small>week ${wk.week} tasks</small></div>` : ''}</div></div>
    <div class="card"><h3 style="margin-top:0">Accuracy by area</h3><table class="simple">${Object.keys(AREAS).map(a => { const x = st[a] || {}; return `<tr><td>${AREA_ICON[a]} ${esc(AREAS[a])}</td><td><small>${x.seen || 0}/${x.total || 0}</small></td><td><b>${pct(x.acc)}</b></td><td style="width:30%">${bar(x.acc, accCls(x.acc))}</td></tr>`; }).join('')}</table></div>
    ${ex.length ? `<div class="card"><h3 style="margin-top:0">Practice exams</h3><table class="simple">${ex.map(e => `<tr><td>${new Date(e.date).toLocaleDateString()}</td><td>${e.correct}/${e.scored}</td><td><b>${pct(e.pct)}</b></td><td>${e.minutes} min</td></tr>`).join('')}</table></div>` : ''}
    <div class="card"><ul class="list">
      ${item('#/calendar', '🗓️', 'Study calendar', 'Month view: done, partly done, missed and upcoming days.')}
      ${item('#/plansettings', '⚙️', 'Plan settings & reminder', 'Exam date, start date, hours per day, rest days, daily reminder.')}
      ${item('#/settings', '🎨', 'App settings', 'Dark mode, text size, daily goal, confidence buttons, backup.')}
      ${item('#/profiles', '👥', 'Profiles', 'Separate progress for each person on this device.')}
      ${item('#/help', '❓', 'Help & walkthrough', 'How the app works, daily routine and weekly rhythm.')}
      ${item('#/about', 'ℹ️', 'About & sources', 'Exam blueprint, image credits, privacy.')}
    </ul><button class="btn block" id="share">🔗 Share the app link</button></div>`;
  $('#share', el).onclick = async () => { const url = location.href.split('#')[0]; try { if (navigator.share) await navigator.share({ title: 'CCT Study', text: 'Free offline CCT exam study app (not an official CCI product)', url }); else { await navigator.clipboard.writeText(url); toast('Link copied'); } } catch (e) { /* cancelled */ } };
}

// ---------- End-of-day recap ----------
export function recap(el, a, p) {
  const t = S.today(), L = S.dayLog(t), list = PL.isSetUp() ? PL.tasksFor(t) : [];
  const doneT = list.filter(PL.isDone), acc = L.n ? L.c / L.n : null;
  const subs = Object.entries(L.subs).map(([k, [c, n]]) => ({ k, area: k[0], sub: k.slice(2), c, n, w: n - c })).filter(x => x.w > 0).sort((x, y) => y.w - x.w || x.c / x.n - y.c / y.n);
  const fill = S.subtopicStats(Q()).filter(s => s.attempts >= 3 && !subs.some(x => x.sub === s.subtopic)).sort((x, y) => x.acc - y.acc).map(s => ({ area: s.area, sub: s.subtopic, overall: s.acc }));
  const three = [...subs, ...fill].slice(0, 3);
  const lessonFor = (area, sub) => Q().find(q => q.area === area && q.subtopic === sub)?.lesson;
  el.innerHTML = `<div class="card"><h2>📝 Today's recap</h2><p class="muted">${PL.nice(t, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
    <div class="stats"><div class="stat"><b>${L.n}</b><small>questions</small></div><div class="stat"><b>${pct(acc)}</b><small>accuracy</small></div><div class="stat"><b>${L.cards[1]}</b><small>flashcards</small></div><div class="stat"><b>${Math.round(L.ms / 60000)}</b><small>min on questions</small></div></div>
    ${Object.keys(L.areas).length ? `<h3>What you studied</h3><table class="simple">${Object.entries(L.areas).map(([ar, [c, n]]) => `<tr><td>${AREA_ICON[ar]} ${esc(AREAS[ar])}</td><td>${c}/${n}</td><td style="width:35%">${bar(c / n, accCls(c / n))}</td></tr>`).join('')}</table>` : '<p>No questions answered yet today.</p>'}
    ${list.length ? `<p>Plan tasks finished: <b>${doneT.length}/${list.length}</b></p>` : ''}</div>
    <div class="card"><h3 style="margin-top:0">3 things to review tomorrow</h3>${three.length ? `<ol>${three.map(x => { const l = lessonFor(x.area, x.sub); return `<li><b>${esc(x.sub)}</b> <small class="muted">(${esc(AREAS[x.area])}${x.w ? ` · missed ${x.w} today` : x.overall != null ? ` · ${pct(x.overall)} overall` : ''})</small>${l && D.lessons[l] ? ` — <a href="#/lesson/${l}">lesson</a>` : ''}</li>`; }).join('')}</ol><p class="muted">Missed questions are already scheduled for tomorrow's review.</p>` : '<p>Answer a few questions and your recap will suggest what to review.</p>'}</div>
    <div class="card"><h3 style="margin-top:0">🌙 Before bed: a 2-minute low-stakes recap</h3><p class="muted">Relaxed, no pressure — just a few cards, then sleep.</p><button class="btn" id="bed">5 quick flashcards</button></div>
    <button class="btn primary block" id="fin">${p.task && PL.plan().done[p.task] ? '✓ Recap done' : '✓ Done for today'}</button>`;
  $('#bed', el).onclick = () => { const miss = L.missed.map(id => D.qmap[id]?.area); const pool = D.cards.filter(c => !c.image && (!miss.length || miss.includes(c.area))); P.cardSession(el, shuffle(pool).slice(0, 5), 'Bedtime recap'); };
  $('#fin', el).onclick = () => {
    const id = p.task || list.find(x => x.type === 'recap')?.id; if (id) done(id, 'Recap');
    const all = list.length && list.every(PL.isDone);
    toast(all ? '✅ Done for today — sleep well!' : 'Recap done'); goHash('#/');
  };
}

// ---------- Final-week mode ----------
const CHECK = [
  'Two ORIGINAL, unexpired IDs (no photocopies). Primary: government-issued with photo and signature (e.g., driver\'s license, passport, state ID, military ID).',
  'Secondary ID with your name and signature (or name and a recent recognizable photo).',
  'First and last name on both IDs match your exam registration EXACTLY.',
  'Confirm the Pearson VUE test center address and appointment time (see your confirmation email), and plan to arrive early.',
  'Expect to store your phone, watch and bag outside the testing room — check the Pearson VUE rules in your confirmation.',
  'Timing plan: 2 hours total = 10 min tutorial/survey + 1 h 50 min for 130 questions (≈ 50 seconds each).',
  'Answer every question — a blank is always wrong, and there is no penalty for changing answers. Flag hard items and come back.',
  'The night before: light review only, then 7–9 hours of sleep. Eat a normal breakfast; avoid an unusual amount of caffeine.',
];
export function finalWeek(el, a, p) {
  const left = daysTo(S.settings().examDate), pr = S.profile().q;
  const most = Q().filter(q => pr[q.id]?.wrong).sort((x, y) => (pr[y.id].wrong - pr[y.id].correct * 0.5) - (pr[x.id].wrong - pr[x.id].correct * 0.5)).slice(0, 20);
  const chk = S.profile().checklist || (S.profile().checklist = {});
  const hy = Object.keys(AREAS).map(ar => [ar, D.lessonList.filter(l => l.area === ar).flatMap(l => l.keyPoints.slice(0, 3))]);
  el.innerHTML = `<div class="card plan-card"><h2>🌙 Final-week mode</h2><p>${left > 7 ? `Your exam is ${left} days away — this page is built for the last 7 days, but you can preview it.` : left >= 0 ? `<b>${left}</b> day${left === 1 ? '' : 's'} to go. Light review only: no cramming, sleep well.` : 'Exam date passed.'}</p>
    <div class="btn-row"><button class="btn primary" id="most" ${most.length ? '' : 'disabled'}>Quiz my ${most.length || ''} most-missed questions</button><a class="btn" href="#/traps?quiz=all">Exam-traps quiz</a><a class="btn" href="#/weak">Weak spots</a></div></div>
    <div class="card"><h3 style="margin-top:0">High-yield facts by area</h3>${hy.map(([ar, pts]) => `<details><summary>${AREA_ICON[ar]} ${esc(AREA_FULL[ar])} <small class="muted">(${AREA_PCT[ar]}%)</small></summary><ul>${pts.map(x => `<li>${esc(x)}</li>`).join('')}</ul></details>`).join('')}</div>
    <div class="card" id="checklist"><h3 style="margin-top:0">✅ Exam-day checklist</h3>${CHECK.map((c, i) => `<label class="chk-row"><input type="checkbox" data-c="${i}" ${chk[i] ? 'checked' : ''}> <span>${esc(c)}</span></label>`).join('')}
      <p class="src">ID and timing rules from CCI's CCT credential page (re-checked Nov 2026). Always confirm with CCI and Pearson VUE before test day.</p></div>
    <div class="card"><h3 style="margin-top:0">⏲️ Pacing the 1 h 50 min</h3><table class="simple"><tr><th>Question</th><th>Time used (about)</th></tr><tr><td>33</td><td>28 min</td></tr><tr><td>65 (halfway)</td><td>55 min</td></tr><tr><td>98</td><td>83 min</td></tr><tr><td>130</td><td>~100 min — leaves ~10 min for flagged items</td></tr></table>
      <p class="muted">Stuck for more than about 1½ minutes? Pick your best answer, flag it, and move on. Practice this with the pacing drill.</p><a class="btn" href="#/exam?pacing=1">Pacing drill</a></div>
    ${p.task ? `<button class="btn primary block" id="fin">✓ Mark this task done</button>` : ''}`;
  $$('[data-c]', el).forEach(c => c.onchange = () => { chk[c.dataset.c] = c.checked; S.save(); });
  $('#most', el).onclick = () => startQuiz('Most-missed questions', shuffle(most));
  const f = $('#fin', el); if (f) f.onclick = () => { done(p.task, 'Final review'); goHash('#/'); };
  if (location.hash.includes('#checklist')) setTimeout(() => $('#checklist', el)?.scrollIntoView(), 50);
}

// ---------- Exam traps ----------
export function traps(el, a, p) {
  if (p.quiz) { const pool = Q().filter(q => q.tags?.includes('trap') && (p.quiz === 'all' || q.area === p.quiz)); return startQuiz('Exam-traps quiz', shuffle(pool).slice(0, +p.n || 15)); }
  const T = D.traps || {}; const ar = p.a || 'F';
  el.innerHTML = `<div class="card"><h2>⚠️ Common mistakes & exam traps</h2><p class="muted">Look-alike rhythms, easily confused terms and values people mix up. Read the list, then drill it.</p>
    <div class="seg wrap">${Object.keys(AREAS).map(x => `<button class="${x === ar ? 'on' : ''}" data-a="${x}">${AREA_ICON[x]} ${esc(AREAS[x])}</button>`).join('')}</div></div>
    <div class="card"><h3 style="margin-top:0">${esc(AREA_FULL[ar])}</h3><ul class="traps">${(T[ar] || []).map(x => `<li><b>${esc(x.trap)}</b><br>${esc(x.fix)}</li>`).join('')}</ul>
    <div class="btn-row"><a class="btn primary" href="#/traps?quiz=${ar}">Drill ${esc(AREAS[ar])} traps (${Q().filter(q => q.tags?.includes('trap') && q.area === ar).length})</a><a class="btn" href="#/traps?quiz=all">Drill all traps</a></div></div>`;
  $$('[data-a]', el).forEach(b => b.onclick = () => goHash('#/traps?a=' + b.dataset.a));
}

// ---------- Patient care & communication ----------
export function care(el, a, p) {
  const pool = Q().filter(q => q.tags?.includes('communication') || (q.tags?.includes('scenario') && ['A', 'D', 'E'].includes(q.area)));
  if (p.quiz) return startQuiz('Patient care scenarios', shuffle(pool).slice(0, +p.n || 12));
  const L = ['A-communication', 'A-identification', 'A-consent', 'A-patient-prep', 'A-infection-control', 'A-transfer-transport', 'A-deteriorating-patient', 'A-documentation', 'A-patient-education', 'A-safety', 'D-stress-patient-care', 'E-holter-education'].filter(id => D.lessons[id]);
  el.innerHTML = `<div class="card"><h2>🧑‍⚕️ Patient care & communication</h2><p>Introductions and identity checks, plain-language explanations, consent and the right to refuse, privacy and HIPAA, modesty and draping, positioning, mobility, hearing and language barriers, anxiety and pain, deteriorating patients, difficult patients, documentation and infection control.</p>
    <p class="muted">Exam scenarios usually ask what the technician should do <b>first</b> or <b>best</b>: safety and the patient come before the machine.</p>
    <div class="btn-row"><a class="btn primary" href="#/care?quiz=1&n=12">12 scenario questions</a><a class="btn" href="#/care?quiz=1&n=${pool.length}">All ${pool.length}</a><a class="btn" href="#/flashcards?deck=A">Flashcards</a></div></div>
    <div class="card"><h3 style="margin-top:0">Lessons</h3><ul class="list">${L.map(id => `<li><a href="#/lesson/${id}"><span class="grow">${esc(D.lessons[id].title)}</span><span class="chev"></span></a></li>`).join('')}</ul></div>
    <div class="card"><h3 style="margin-top:0">First-or-best rules of thumb</h3><ul><li>Check the <b>patient</b> before the monitor.</li><li>Stay with a patient who may be deteriorating; call for help.</li><li>Two identifiers, every time.</li><li>Explain, then ask permission. A competent adult may refuse.</li><li>Qualified interpreter, not family or children.</li><li>Expose only what you need; drape and close the curtain.</li><li>Don't interpret results for the patient.</li></ul></div>`;
}

// ---------- Anatomy ----------
export function anatomy(el, a, p) {
  const pool = Q().filter(q => q.tags?.includes('anatomy') || q.subtopic === 'Anatomy & physiology');
  if (p.quiz) return startQuiz('Anatomy & blood flow', shuffle(pool).slice(0, +p.n || 15));
  const L = ['C-anatomy-physiology', 'C-chambers-valves', 'C-blood-flow', 'C-coronary-circulation', 'C-conduction-system', 'C-cardiac-cycle-hemodynamics', 'C-electrophysiology'].filter(id => D.lessons[id]);
  const flow = ['Superior & inferior vena cava', 'Right atrium', 'Tricuspid valve', 'Right ventricle', 'Pulmonic valve', 'Pulmonary artery', 'Lungs (gas exchange)', 'Pulmonary veins', 'Left atrium', 'Mitral valve', 'Left ventricle', 'Aortic valve', 'Aorta → body'];
  el.innerHTML = `<div class="card"><h2>🫀 Anatomy, physiology & blood flow</h2><p class="muted">Recent test-takers report heavy testing here, so this app adds extra questions, cards and lessons on it.</p>
    <div class="btn-row"><a class="btn primary" href="#/anatomy?quiz=1&n=15">15-question quiz</a><a class="btn" href="#/anatomy?quiz=1&n=${pool.length}">All ${pool.length}</a></div></div>
    <div class="card"><h3 style="margin-top:0">The path of blood</h3><ol class="flow">${flow.map((s, i) => `<li class="${i < 6 ? 'blue' : i === 6 ? 'lung' : 'red'}">${esc(s)}</li>`).join('')}</ol><small class="muted">Blue = deoxygenated (right heart), red = oxygenated (left heart).</small></div>
    <div class="card"><h3 style="margin-top:0">Lessons</h3><ul class="list">${L.map(id => `<li><a href="#/lesson/${id}"><span class="grow">${esc(D.lessons[id].title)}</span><span class="chev"></span></a></li>`).join('')}</ul></div>`;
}
