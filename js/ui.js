// ui.js — small DOM helpers and the shared ECG image component.
import { D } from './data.js';

export const $ = (s, el = document) => el.querySelector(s);
export const $$ = (s, el = document) => [...el.querySelectorAll(s)];
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export function h(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }
export function toast(msg, ms = 2200) { const t = h(`<div class="toast" role="status">${esc(msg)}</div>`); document.body.append(t); setTimeout(() => t.remove(), ms); }
export const pct = x => (x == null ? '—' : Math.round(x * 100) + '%');
export const shuffle = a => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
export const sample = (a, n) => shuffle(a).slice(0, n);
export function bar(v, cls = '') { return `<div class="bar ${cls}"><i style="width:${Math.max(0, Math.min(100, Math.round((v || 0) * 100)))}%"></i></div>`; }
export const accCls = a => (a == null ? '' : a >= 0.75 ? 'ok' : a >= 0.6 ? 'warn' : 'bad');

// ECG image with optional hot-spot regions and caliper overlay.
// opts: {regions:[[x,y,w,h]], onPick(i), caliper:true}
export function ecgImage(id, opts = {}) {
  const s = D.strips[id]; if (!s) return h('<div></div>');
  const minW = s.kind === '12lead' ? 760 : s.kind === 'strip' ? 560 : 0;
  const wrap = h(`<div><div class="ecg-wrap"><div class="ecg-inner" style="${minW ? `min-width:${minW}px` : ''}"><img alt="${esc(s.real ? 'Real ECG recording' : 'Generated ECG tracing')}" loading="lazy" src="${esc(s.file)}"></div></div><div class="ecg-tools"><button class="btn small ghost zoom-btn" type="button" aria-label="Zoom image">⤢ Full screen</button>${minW ? '<small class="muted scroll-hint">← swipe to scroll →</small>' : ''}</div>
    <div class="ecg-cap">${s.real ? `<span><span class="badge real">REAL</span> ${esc(s.caption || '')}</span><span>© ${esc(s.author)} · <a href="${esc(s.licenseUrl || s.source)}" target="_blank" rel="noopener">${esc(s.license)}</a> · <a href="${esc(s.source)}" target="_blank" rel="noopener">source</a></span>`
      : `<span><span class="badge gen">GENERATED</span> ${s.kind === '12lead' ? '12-lead' : 'Lead ' + esc(s.lead)} · 25 mm/s · 10 mm/mV</span><span>Synthetic teaching tracing</span>`}</div></div>`);
  const box = wrap.querySelector('.ecg-inner');
  $('.zoom-btn', wrap).onclick = () => zoom(s.file);
  if (!s.real && (opts.regions || opts.caliper)) {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg'); svg.setAttribute('viewBox', `0 0 ${s.width} ${s.height}`); svg.setAttribute('class', 'overlay'); svg.setAttribute('preserveAspectRatio', 'none');
    if (opts.regions) opts.regions.forEach((r, i) => {
      const rect = document.createElementNS(ns, 'rect'); rect.setAttribute('x', r[0]); rect.setAttribute('y', r[1]); rect.setAttribute('width', r[2]); rect.setAttribute('height', r[3]);
      rect.setAttribute('class', 'hs'); rect.setAttribute('data-i', i); rect.setAttribute('tabindex', '0'); rect.setAttribute('role', 'button');
      rect.setAttribute('aria-label', opts.labels ? `Lead ${opts.labels[i]}` : `Region ${i + 1}`);
      const pick = () => opts.onPick && opts.onPick(i); rect.addEventListener('click', pick); rect.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
      svg.append(rect);
    });
    if (opts.caliper) svg.append(caliper(s, ns));
    box.append(svg); wrap.overlay = svg;
  }
  return wrap;
}
function caliper(s, ns) {
  const g = document.createElementNS(ns, 'g'); g.setAttribute('class', 'cal'); g.style.display = 'none';
  const qs = s.beats.filter(b => b.q && !b.w).map(b => b.q[0]); const all = s.beats.filter(b => b.q).map(b => b.q[0]);
  const pair = (qs.length > 2 ? qs : all).slice(1, 3);
  const add = (tag, attrs, text) => { const e = document.createElementNS(ns, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); if (text) e.textContent = text; g.append(e); };
  if (pair.length === 2) {
    const [a, b] = pair; const boxes = Math.round(b - a);
    add('line', { x1: a, x2: a, y1: 2, y2: s.height - 2 }); add('line', { x1: b, x2: b, y1: 2, y2: s.height - 2 });
    add('line', { x1: a, x2: b, y1: 6, y2: 6 }); add('text', { x: (a + b) / 2 - 12, y: 5 }, `R–R ≈ ${boxes} small boxes`);
  }
  const pb = s.beats.find(b => b.p && b.q && b.q[0] - b.p[0] < 9 && b.q[0] > b.p[0]);
  if (pb) { add('line', { x1: pb.p[0], x2: pb.p[0], y1: s.height - 10, y2: s.height - 3 }); add('line', { x1: pb.q[0], x2: pb.q[0], y1: s.height - 10, y2: s.height - 3 }); add('text', { x: pb.p[0], y: s.height - 1 }, `PR ≈ ${Math.round(pb.q[0] - pb.p[0])} boxes`); }
  return g;
}
export function zoom(src) {
  const z = h(`<div class="zoom-layer" role="dialog" aria-label="Zoomed ECG"><button class="btn primary close" type="button">Close ✕</button><img src="${esc(src)}" alt="Zoomed ECG"></div>`);
  $('.close', z).onclick = () => z.remove(); document.body.append(z);
}
export function download(name, text) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }
