// Workflow «piloto automático»: nodos que se ejecutan en orden, pulso por las conexiones,
// rama Sí/No alternada en cada ciclo y contador de ejecuciones. Portado y modernizado
// de la web anterior (legacy/tellbid-home.html).
import { $, $$, reduced, pausableClock, ease } from '../lib.js';

const NS = 'http://www.w3.org/2000/svg';
const EDGES = [['1', '2'], ['2', '3'], ['3', '4', 'Sí'], ['4', '5'], ['3', '6', 'No'], ['6', '7']];
const NAMES = ['María R.', 'Carlos P.', 'Ana G.', 'Luis M.', 'Sofía T.', 'Jorge V.', 'Daniela C.', 'Andrés L.'];

export function workflow() {
  $$('[data-tb-wf]').forEach(init);
}

function init(wf) {
  const grid = $('.tb-wf-grid', wf);
  const svg = $('.tb-wf-lines', wf);
  const runsEl = $('.tb-wf-runs', wf);
  const msgEl = $('.tb-wf-msg', wf);
  const node = (n) => $(`[data-wf="${n}"]`, wf);
  const edgeEls = {};
  const edgeState = {};
  let pulse = null;
  let pulseOn = false;

  const mk = (tag, attrs) => {
    const el = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    return el;
  };
  const setEdge = (key, cls = '') => {
    edgeState[key] = cls;
    if (edgeEls[key]) edgeEls[key].setAttribute('class', 'tb-wf-edge ' + cls);
  };

  function draw() {
    const g = grid.getBoundingClientRect();
    if (!g.width) return;
    svg.setAttribute('width', g.width);
    svg.setAttribute('height', g.height);
    svg.setAttribute('viewBox', `0 0 ${g.width} ${g.height}`);
    svg.replaceChildren();
    const ports = [];
    const labels = [];
    EDGES.forEach(([from, to, label]) => {
      const a = node(from).getBoundingClientRect();
      const b = node(to).getBoundingClientRect();
      let d;
      let x1; let y1; let x2; let y2;
      if (b.left >= a.right - 2) { // horizontal
        x1 = a.right - g.left; y1 = a.top + a.height / 2 - g.top;
        x2 = b.left - g.left; y2 = b.top + b.height / 2 - g.top;
        const c = (x2 - x1) / 2;
        d = `M${x1} ${y1} C${x1 + c} ${y1} ${x2 - c} ${y2} ${x2} ${y2}`;
      } else { // vertical
        x1 = a.left + a.width / 2 - g.left; y1 = a.bottom - g.top;
        x2 = b.left + b.width / 2 - g.left; y2 = b.top - g.top;
        const c = (y2 - y1) / 2;
        d = `M${x1} ${y1} C${x1} ${y1 + c} ${x2} ${y2 - c} ${x2} ${y2}`;
      }
      const key = from + '-' + to;
      const p = mk('path', { d, class: 'tb-wf-edge ' + (edgeState[key] || '') });
      svg.appendChild(p);
      edgeEls[key] = p;
      ports.push([x1, y1], [x2, y2]);
      if (label) labels.push([p, label]);
    });
    ports.forEach(([cx, cy]) => svg.appendChild(mk('circle', { cx, cy, r: 3.5, class: 'tb-wf-port' })));
    labels.forEach(([p, text]) => {
      const m = p.getPointAtLength(p.getTotalLength() * 0.5);
      const bg = mk('rect', { x: m.x - 14, y: m.y - 10, width: 28, height: 20, rx: 10, class: 'tb-wf-label-bg' });
      const t = mk('text', { x: m.x, y: m.y + 4, 'text-anchor': 'middle', class: 'tb-wf-label' });
      t.textContent = text;
      svg.append(bg, t);
    });
    pulse = mk('circle', { r: 5, class: 'tb-wf-pulse' + (pulseOn ? ' is-on' : '') });
    svg.appendChild(pulse);
  }

  let queued = false;
  const redraw = () => { if (queued) return; queued = true; requestAnimationFrame(() => { queued = false; draw(); }); };
  if ('ResizeObserver' in window) new ResizeObserver(redraw).observe(grid);
  else window.addEventListener('resize', redraw);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(redraw);
  draw();

  if (reduced()) { // estático: muestra la rama «Sí» completada
    ['1', '2', '3', '4', '5'].forEach((n) => node(n).classList.add('is-done'));
    ['6', '7'].forEach((n) => node(n).classList.add('is-skip'));
    ['1-2', '2-3', '3-4', '4-5'].forEach((k) => setEdge(k, 'is-done'));
    msgEl.textContent = 'Cita confirmada y recordatorio programado';
    return;
  }

  const { tick } = pausableClock(wf);
  let runs = 1284;
  let cycle = 0;

  const runNode = async (n) => {
    const el = node(n);
    el.classList.add('is-run');
    await tick(n === '6' ? 1100 : 700);
    el.classList.remove('is-run');
    el.classList.add('is-done');
  };
  const travel = async (key) => {
    setEdge(key, 'is-live');
    pulseOn = true;
    pulse && pulse.setAttribute('class', 'tb-wf-pulse is-on');
    await tick(800, (t) => {
      const p = edgeEls[key];
      const pt = p.getPointAtLength(p.getTotalLength() * ease.inOut(t));
      pulse.setAttribute('cx', pt.x);
      pulse.setAttribute('cy', pt.y);
    });
    setEdge(key, 'is-done');
    pulseOn = false;
    pulse && pulse.setAttribute('class', 'tb-wf-pulse');
  };
  const say = (text) => {
    msgEl.style.opacity = 0;
    setTimeout(() => { msgEl.textContent = text; msgEl.style.opacity = 1; }, 250);
  };
  const reset = () => {
    $$('.tb-wf-node', wf).forEach((el) => el.classList.remove('is-run', 'is-done', 'is-skip'));
    Object.keys(edgeEls).forEach((k) => setEdge(k, ''));
  };

  (async function loop() {
    for (;;) {
      const yes = cycle % 2 === 0;
      const name = NAMES[cycle % NAMES.length];
      cycle++;
      const branch = yes ? ['4', '5'] : ['6', '7'];
      const other = yes ? ['6', '7'] : ['4', '5'];
      await tick(400);
      say(`Evento: ${name} envió un mensaje`);
      await runNode('1');
      await travel('1-2');
      await runNode('2');
      await travel('2-3');
      await runNode('3');
      other.forEach((n) => node(n).classList.add('is-skip'));
      await travel('3-' + branch[0]);
      await runNode(branch[0]);
      await travel(branch[0] + '-' + branch[1]);
      await runNode(branch[1]);
      runs++;
      runsEl.textContent = runs.toLocaleString('en-US');
      say(yes ? `Cita confirmada y recordatorio programado: ${name}` : `Seguimiento por SMS enviado a ${name}`);
      await tick(2200);
      reset();
      await tick(600);
    }
  })();
}
