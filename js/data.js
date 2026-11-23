// data.js — loads the JSON data files once and builds lookup tables.
export const D = { questions: [], qmap: {}, strips: {}, lessons: {}, lessonList: [], cards: [], glossary: [], meds: [], ready: false };
export const AREAS = {
  A: 'Pre-Procedural Activities', B: 'Resting ECG', C: 'Analyzing 12-Lead ECG', D: 'Stress Testing', E: 'Ambulatory Monitoring', F: 'Rhythm Analysis',
};
export const AREA_FULL = {
  A: 'Conducting Pre-Procedural Activities', B: 'Performing Resting ECG (12-Lead, 15-Lead)', C: 'Analyzing 12-Lead ECG', D: 'Performing Stress Tests',
  E: 'Performing Ambulatory Monitoring (Holter, Event, Telemetry)', F: 'Performing Rhythm Analysis',
};
export const AREA_PCT = { A: 10, B: 14, C: 22, D: 10, E: 4, F: 40 };
export const AREA_ICON = { A: '🩺', B: '📈', C: '🫀', D: '🏃', E: '⌚', F: '〰️' };

export async function loadData() {
  const get = f => fetch(f).then(r => { if (!r.ok) throw new Error(f + ' ' + r.status); return r.json(); });
  const [q, s, l, c, g, m] = await Promise.all(['data/questions.json', 'data/strips.json', 'data/lessons.json', 'data/flashcards.json', 'data/glossary.json', 'data/medications.json'].map(get));
  D.questions = q.questions; D.qmap = Object.fromEntries(q.questions.map(x => [x.id, x]));
  D.strips = Object.fromEntries(s.images.map(x => [x.id, x]));
  D.lessonList = l.lessons; D.lessons = Object.fromEntries(l.lessons.map(x => [x.id, x]));
  D.cards = c.cards; D.glossary = g.terms; D.meds = m.classes; D.medNote = m.note; D.ready = true;
}
