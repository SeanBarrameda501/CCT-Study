// planner.js — the day-by-day study calendar: generates a dated task list from the start date to the exam,
// tracks completion, detects overdue work, re-plans, and adds extra review for weak topics.
// The generated days are stored (not recomputed) so that past days never change silently.
import { D } from './data.js';
import * as S from './store.js';

const DAY = 86400000;
export const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const fmt = d => S.today(d);
export const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return fmt(d); };
export const diffDays = (a, b) => Math.round((parse(b) - parse(a)) / DAY);
export const todayStr = () => S.today();
export const nice = (s, o = { weekday: 'short', month: 'short', day: 'numeric' }) => parse(s).toLocaleDateString(undefined, o);

export const PHASES = {
  learn: { name: 'Learn each content area', short: 'Learn', icon: '📘' },
  mixed: { name: 'Mixed quizzes + spaced review', short: 'Mix', icon: '🔀' },
  exams: { name: 'Full timed practice exams', short: 'Exams', icon: '⏱️' },
  final: { name: 'Light review of weak spots', short: 'Final', icon: '🌙' },
};

// Recommended order for learning: anatomy first, then the procedure domains, then rhythms and 12-lead analysis.
const ORDER = ['C-anatomy-physiology', 'C-chambers-valves', 'C-blood-flow', 'C-coronary-circulation', 'C-conduction-system', 'C-cardiac-cycle-hemodynamics', 'C-electrophysiology',
  'A-orders', 'A-identification', 'A-consent', 'A-communication', 'A-infection-control', 'A-patient-prep', 'A-landmarks', 'A-transfer-transport', 'A-safety', 'A-equipment', 'A-patient-education', 'A-deteriorating-patient', 'A-documentation',
  'B-supplies', 'B-lead-systems', 'B-calibration-paper', 'B-12-lead-procedure', 'B-troubleshooting', 'B-modified-ecg',
  'F-intervals-waveforms', 'F-rate-calculation', 'F-rhythm-method', 'F-sinus-rhythms', 'F-atrial-rhythms', 'F-junctional-rhythms', 'F-ventricular-rhythms', 'F-heart-blocks', 'F-bundle-branch-block', 'F-pacemakers', 'F-artifact', 'F-life-threatening', 'F-report-communicate', 'F-medications',
  'C-reading-lead-groups', 'C-axis', 'C-bundle-branch-block', 'C-hypertrophy', 'C-ischemia-infarction',
  'D-stress-supplies', 'D-stress-equipment', 'D-protocols', 'D-contraindications', 'D-endpoints', 'D-pharmacologic-nuclear', 'D-stress-patient-care',
  'E-holter-basics', 'E-holter-equipment', 'E-holter-application', 'E-holter-education', 'E-holter-troubleshooting', 'E-holter-analysis'];
export function lessonOrder() {
  const ids = D.lessonList.map(l => l.id);
  return [...ORDER.filter(id => ids.includes(id)), ...ids.filter(id => !ORDER.includes(id))];
}

// ---------- task catalog ----------
// Each task: {id, date, type, title, desc, min (estimated minutes), important, ...params}
const T = {
  review: () => ({ type: 'review', title: 'Review cards and questions due today', desc: 'Spaced repetition first, every day', min: 10, important: true }),
  lesson: id => ({ type: 'lesson', lesson: id, title: `Study: ${D.lessons[id]?.title || id}`, desc: 'Read the mini-lesson, then tap “Mark studied”', min: 8, important: true }),
  quiz: (lessons, n) => ({ type: 'quiz', lessons, n, title: `${n}-question quiz on today's topics`, desc: 'Quiz yourself right after reading', min: n, important: true }),
  cards: (area, n) => ({ type: 'cards', area, n, title: `${n} flashcards: ${area ? areaName(area) : 'mixed'}`, desc: 'Flip, then mark Got it / Missed it', min: Math.ceil(n / 2.5) }),
  weak: n => ({ type: 'weak', n, title: `Drill your weakest area (${n} questions)`, desc: 'Picked from your lowest-scoring topic at start time', min: n, important: true }),
  mixed: n => ({ type: 'mixed', n, title: `Interleaved mixed quiz (${n} questions)`, desc: 'All topics shuffled, weighted like the real exam', min: n, important: true }),
  traps: n => ({ type: 'traps', n, title: `Exam-traps quiz (${n})`, desc: 'Look-alike rhythms, mixed-up terms and values', min: n }),
  smart: n => ({ type: 'smart', n, title: `Smart review (${n})`, desc: 'Slow, guessed and twice-missed questions', min: n }),
  trainer: n => ({ type: 'trainer', n, title: `Rhythm trainer: measure ${n} strips`, desc: 'Rate, regularity, PR, QRS, then name it', min: n * 2 }),
  calc: n => ({ type: 'calc', n, title: `${n} calculation problems`, desc: '300/1,500 methods, intervals, target HR, QTc', min: n }),
  scen: n => ({ type: 'scen', n, title: `Patient-care scenarios (${n})`, desc: 'What should the technician do first?', min: n }),
  rapid: () => ({ type: 'rapid', title: 'One rapid-fire round (60 s)', desc: 'Fast recall to finish strong', min: 2 }),
  pacing: () => ({ type: 'pacing', n: 30, title: 'Pacing drill: 30 questions in 26 minutes', desc: 'Practice the real exam pace (~51 s per question)', min: 26, important: true }),
  exam: () => ({ type: 'exam', title: 'Full timed practice exam (130 questions)', desc: '1 h 50 min, like the real test. Review misses after.', min: 115, important: true }),
  final: () => ({ type: 'final', title: 'Final-week high-yield review', desc: 'Condensed facts + your most-missed questions', min: 20, important: true }),
  checklist: () => ({ type: 'checklist', title: 'Read the exam-day checklist', desc: 'ID, timing plan, what to bring', min: 5, important: true }),
  recap: () => ({ type: 'recap', title: 'Read the end-of-day recap', desc: 'What you studied and 3 things for tomorrow', min: 3 }),
  extra: (area, sub) => ({ type: 'extra', area, sub, n: 10, title: `Extra review: ${sub}`, desc: `Added because this topic is below 60%. Lesson + 10 questions.`, min: 15, important: true, auto: true }),
};
const ANAT = new Set(['C-anatomy-physiology', 'C-chambers-valves', 'C-blood-flow', 'C-coronary-circulation', 'C-conduction-system', 'C-cardiac-cycle-hemodynamics', 'C-electrophysiology']);
const areaName = a => ({ anatomy: 'Anatomy & blood flow', A: 'Pre-Procedural', B: 'Resting ECG', C: '12-Lead', D: 'Stress', E: 'Ambulatory', F: 'Rhythm' }[a] || a);
export const TYPE_ICON = { review: '🔁', lesson: '📘', quiz: '✏️', cards: '🃏', weak: '📉', mixed: '🔀', traps: '⚠️', smart: '🎯', trainer: '📏', calc: '🧮', scen: '🧑‍⚕️', rapid: '⚡', pacing: '⏲️', exam: '⏱️', final: '🌙', checklist: '✅', recap: '📝', extra: '➕' };

// ---------- state ----------
export function plan() {
  const p = S.profile();
  if (!p.plan) p.plan = { version: 1, start: null, hours: 1.5, restDates: [], restWeekdays: [], days: {}, done: {}, moved: {}, weakAdded: {}, replans: [] };
  p.lessonsRead = p.lessonsRead || {};
  return p.plan;
}
export const isSetUp = () => !!plan().start && Object.keys(plan().days).length > 0;
export const examDate = () => S.settings().examDate;
export const isRest = (d, pl = plan()) => pl.restDates.includes(d) || pl.restWeekdays.includes(parse(d).getDay());

export function phaseOf(d, pl = plan()) {
  const total = Math.max(1, diffDays(pl.start, examDate())), i = diffDays(pl.start, d);
  const f = i / total;
  return f < 3 / 8 ? 'learn' : f < 6 / 8 ? 'mixed' : f < 7 / 8 ? 'exams' : 'final';
}
export function weekInfo(d = todayStr(), pl = plan()) {
  const total = Math.max(1, diffDays(pl.start, examDate()));
  const weeks = Math.max(1, Math.ceil(total / 7)), i = Math.max(0, diffDays(pl.start, d));
  const w = Math.min(weeks - 1, Math.floor(i / 7));
  const from = addDays(pl.start, w * 7), to = addDays(pl.start, Math.min(total - 1, w * 7 + 6));
  let n = 0, done = 0; for (let x = from; x <= to; x = addDays(x, 1)) for (const t of plan().days[x] || []) { n++; if (pl.done[t.id]) done++; }
  return { week: w + 1, weeks, from, to, n, done };
}

// ---------- generation ----------
function budgetFill(base, optional, minutes) {
  // base tasks are always kept; optional ones are added in order while time allows
  let used = base.reduce((s, t) => s + t.min, 0); const out = [...base];
  for (const t of optional) if (used + t.min <= minutes + 5) { out.push(t); used += t.min; }
  return out;
}
function dayTasks(d, ctx) {
  const pl = ctx.pl, phase = phaseOf(d, pl), m = Math.round(pl.hours * 60), h = pl.hours;
  const exam = examDate(), left = diffDays(d, exam);
  const list = [];
  const lessons = ctx.assign[d] || [];
  if (left === 1) return [T.review(), T.checklist(), T.final(), T.recap()]; // the day before: light
  if (phase === 'learn' || lessons.length) {
    const area = lessons.length ? D.lessons[lessons[0]]?.area : null;
    const deck = lessons.length && lessons.every(l => ANAT.has(l)) ? 'anatomy' : area;
    const n = h < 1 ? 10 : 20;
    const base = [T.review(), ...lessons.map(T.lesson)];
    if (lessons.length) base.push(T.quiz(lessons, n));
    const opt = [];
    if (phase !== 'learn' || !lessons.length) opt.push(phase === 'exams' ? T.traps(15) : T.mixed(h >= 2 ? 30 : 20));
    opt.push(T.cards(deck, 20));
    if (ctx.index >= 6) opt.push(T.weak(15));
    if (area === 'F') opt.push(T.trainer(5)); if (area === 'A') opt.push(T.scen(8)); if (area === 'F' || area === 'D') opt.push(T.calc(8));
    opt.push(T.rapid());
    list.push(...budgetFill(base, opt, m - 3));
  } else if (phase === 'mixed') {
    const rot = ctx.mixIdx++ % 4, weekly = ctx.mixIdx % 7 === 0;
    const base = [T.review(), weekly ? T.pacing() : T.mixed(h >= 2 ? 40 : h >= 1 ? 30 : 20)];
    const opt = [[T.traps(15), T.trainer(5), T.smart(20), T.calc(10)][rot], T.weak(15), rot === 3 ? T.scen(8) : T.cards(null, 20), T.rapid()];
    list.push(...budgetFill(base, opt, m - 3));
  } else if (phase === 'exams') {
    const examDay = ctx.examsLeft > 0 && ctx.exIdx++ % 2 === 0;
    if (examDay) { ctx.examsLeft--; list.push(T.review(), T.exam(), ...budgetFill([], [T.smart(15)], m - 125)); }
    else list.push(...budgetFill([T.review(), T.weak(20)], [T.traps(15), T.cards(null, 20), T.trainer(5), T.rapid()], m - 3));
  } else { // final week: light
    list.push(...budgetFill([T.review(), T.final()], [T.weak(15), T.cards(null, 15), T.rapid()], Math.min(m, 60) - 3));
  }
  list.push(T.recap());
  return list;
}

// Build days [from, exam) using lesson units still to learn. spreadAll = spread remaining lessons over all remaining study days.
function build(from, { spreadAll = false, examsNeeded = 3 } = {}) {
  const pl = plan(), exam = examDate(); const out = {};
  if (from >= exam) return out;
  const dates = []; for (let d = from; d < exam; d = addDays(d, 1)) dates.push(d);
  const study = dates.filter(d => !isRest(d, pl));
  const learned = new Set(Object.keys(S.profile().lessonsRead || {}));
  for (const t of Object.values(pl.days).flat()) if (t.type === 'lesson' && pl.done[t.id]) learned.add(t.lesson);
  const units = lessonOrder().filter(id => !learned.has(id));
  // which days receive lessons?
  const notLast = study.filter(d => diffDays(d, exam) > 1);
  let target = spreadAll ? notLast.filter(d => phaseOf(d, pl) !== 'final') : notLast.filter(d => phaseOf(d, pl) === 'learn');
  if (!target.length) target = notLast.filter(d => phaseOf(d, pl) === 'mixed');
  if (!target.length) target = notLast.filter(d => phaseOf(d, pl) !== 'final');
  if (!target.length) target = notLast.length ? notLast : study;
  const assign = {}; let u = 0;
  target.forEach((d, i) => { const k = Math.ceil((units.length - u) / (target.length - i)); assign[d] = units.slice(u, u + k); u += k; });
  const ctx = { pl, assign, mixIdx: 0, exIdx: 0, examsLeft: examsNeeded, index: Math.max(0, diffDays(pl.start, from)) };
  for (const d of dates) {
    if (isRest(d, pl)) { out[d] = []; continue; }
    out[d] = dayTasks(d, ctx).map((t, i) => ({ ...t, id: `${d}|${t.type}|${t.lesson || t.sub || i}`, date: d }));
    ctx.index++;
  }
  return out;
}

export function setup({ start, exam, hours, restWeekdays = [] }) {
  const pl = plan();
  if (exam) S.setSetting('examDate', exam);
  Object.assign(pl, { start, hours: +hours || 1.5, restWeekdays, days: {}, done: pl.done || {}, moved: {}, weakAdded: {}, replans: [] });
  pl.days = build(start);
  S.save(true);
}
export function examsDone() { return S.profile().exams.length; }

// Recalculate from today forward (settings change). Past days are kept as they were.
export function recalc({ moveOverdue = false } = {}) {
  const pl = plan(), t = todayStr();
  if (moveOverdue) { for (const task of overdue()) pl.moved[task.id] = t; pl.replans.push({ date: t, moved: Object.keys(pl.moved).length }); }
  const keepToday = (pl.days[t] || []).filter(x => pl.done[x.id]);
  const examTasksDone = Object.values(pl.days).flat().filter(x => x.type === 'exam' && pl.done[x.id]).length;
  const fresh = build(t, { spreadAll: moveOverdue, examsNeeded: Math.max(1, 3 - examTasksDone) });
  for (const d of Object.keys(pl.days)) if (d >= t) delete pl.days[d];
  Object.assign(pl.days, fresh);
  if (pl.days[t]) { const ids = new Set(keepToday.map(x => x.id)); pl.days[t] = [...keepToday, ...pl.days[t].filter(x => !ids.has(x.id) && !keepToday.some(k => k.type === x.type && x.type !== 'lesson'))]; }
  S.save(true);
}

// ---------- status ----------
export const tasksFor = d => plan().days[d] || [];
export const isDone = t => !!plan().done[t.id];
export function findTask(id) { const d = id.split('|')[0]; return tasksFor(d).find(t => t.id === id); }
export function complete(id) {
  const pl = plan(); if (!id || pl.done[id]) return false;
  pl.done[id] = Date.now(); const t = findTask(id); if (t?.type === 'lesson') S.profile().lessonsRead[t.lesson] = Date.now();
  S.save(true); window.dispatchEvent(new CustomEvent('cct:task', { detail: { id } })); return true;
}
export function uncomplete(id) { delete plan().done[id]; S.save(true); }
const TIMEBOUND = new Set(['recap', 'rapid', 'checklist']);
export function overdue() {
  const pl = plan(), t = todayStr(); const out = [];
  for (const d of Object.keys(pl.days).sort()) { if (d >= t) break; for (const x of pl.days[d]) if (!pl.done[x.id] && !pl.moved[x.id] && !TIMEBOUND.has(x.type)) out.push(x); }
  // Daily review is cumulative: only today's review matters, so older review tasks are not counted as overdue.
  return out.filter(x => x.type !== 'review');
}
export function dayStatus(d) {
  const ts = tasksFor(d), t = todayStr(), pl = plan();
  if (isRest(d) && !ts.length) return 'rest';
  if (!ts.length) return d >= examDate() ? (d === examDate() ? 'exam' : 'none') : 'none';
  // Past days: daily review is cumulative and time-bound tasks expire, so they are not required. Moved work does NOT count as done.
  const done = ts.filter(x => pl.done[x.id]).length, req = ts.filter(x => !TIMEBOUND.has(x.type) && !(d < t && x.type === 'review'));
  const reqDone = req.filter(x => pl.done[x.id]).length;
  if (done === ts.length || (reqDone === req.length && d < t)) return 'done';
  if (d < t) return reqDone || done ? 'partial' : 'missed';
  if (d === t) return done ? 'partial' : 'today';
  return done ? 'partial' : 'upcoming';
}

// ---------- weak-topic boost ----------
// When a subtopic falls below 60% (≥ 8 attempts), add an extra review task to the next 2 study days (once per week per topic).
export function checkWeak() {
  if (!isSetUp()) return [];
  const pl = plan(), t = todayStr(), added = [];
  const st = S.subtopicStats(D.questions).filter(s => s.attempts >= 8 && s.acc < 0.6).sort((a, b) => a.acc - b.acc).slice(0, 2);
  for (const s of st) {
    const key = s.area + '|' + s.subtopic; if (pl.weakAdded[key] && diffDays(pl.weakAdded[key], t) < 7) continue;
    let placed = 0;
    for (let d = addDays(t, 1); d < examDate() && placed < 2; d = addDays(d, 1)) {
      if (isRest(d)) continue; const list = pl.days[d] || (pl.days[d] = []);
      const task = { ...T.extra(s.area, s.subtopic) }; task.id = `${d}|extra|${s.subtopic}`; task.date = d;
      if (!list.some(x => x.id === task.id)) { list.splice(Math.max(1, list.length - 1), 0, task); placed++; }
    }
    if (placed) { pl.weakAdded[key] = t; added.push(s.subtopic); }
  }
  if (added.length) S.save(true);
  return added;
}

// ---------- reminders ----------
export function reminderDue() {
  const r = S.settings().remindTime; if (!r) return false;
  const [hh, mm] = r.split(':').map(Number); const now = new Date();
  if (now.getHours() * 60 + now.getMinutes() < hh * 60 + mm) return false;
  return tasksFor(todayStr()).some(x => !isDone(x));
}
export function icsReminder() {
  const r = S.settings().remindTime || '19:00'; const [hh, mm] = r.split(':');
  const start = (plan().start || todayStr()).replace(/-/g, ''), until = examDate().replace(/-/g, '');
  const url = location.href.split('#')[0];
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//CCT Study//EN', 'BEGIN:VEVENT', `UID:cct-study-${start}@local`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`,
    `DTSTART:${start}T${hh}${mm}00`, `DURATION:PT30M`, `RRULE:FREQ=DAILY;UNTIL=${until}T235959`, 'SUMMARY:CCT study session', `DESCRIPTION:Open CCT Study and do today's plan: ${url}`,
    'BEGIN:VALARM', 'TRIGGER:PT0M', 'ACTION:DISPLAY', 'DESCRIPTION:CCT study time', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
}
