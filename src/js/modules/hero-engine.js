// Motor de crecimiento del hero: 5 escenas en bucle.
// Flujo automatizado → Chat con IA → Calendario → Recordatorios → Pipeline (cerrado ganado)
// - Se pausa fuera de pantalla y con la pestaña oculta (pausableClock).
// - El riel de pasos permite saltar a cualquier escena.
// - Con movimiento reducido muestra el estado final de cada escena, sin bucle.
import { $, $$, reduced, pausableClock, ease } from '../lib.js';

const W = 500;
// Duración de cada escena (ms). Deben cubrir la suma de esperas de cada una.
const D = [5600, 7600, 4000, 5800, 5000];
const CANCEL = Symbol('cancel');

export function heroEngine() {
  $$('[data-tb-engine]').forEach(init);
}

function init(root) {
  const stage = $('.tb-he-stage', root);
  const canvas = $('.tb-he-canvas', root);
  const scenes = $$('.tb-he-scene', root);
  const steps = $$('.tb-he-step', root);
  const title = $('.tb-he-title', root);
  const clock = pausableClock(root);
  let scale = 1;

  // Escala el lienzo fijo al ancho disponible
  const fit = () => { scale = stage.clientWidth / W || 1; canvas.style.transform = `scale(${scale})`; };
  fit();
  if ('ResizeObserver' in window) new ResizeObserver(fit).observe(stage);

  // Pausa de animaciones CSS (relleno del riel, puntos de escritura) fuera de pantalla
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((es) => root.classList.toggle('is-paused', !es[0].isIntersecting), { threshold: 0.2 }).observe(root);
  }
  document.addEventListener('visibilitychange', () => root.classList.toggle('is-paused', document.hidden));

  // Posición de un elemento en coordenadas del lienzo (sin escala)
  const at = (el, dx = 0.5, dy = 0.5) => {
    const c = canvas.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return [(r.left - c.left + r.width * dx) / scale, (r.top - c.top + r.height * dy) / scale];
  };
  const moveCursor = (cur, x, y) => { cur.style.setProperty('--cx', x - 4 + 'px'); cur.style.setProperty('--cy', y - 3 + 'px'); };

  // ---------- Reinicio y estados finales ----------
  const STATE = /^s\d+$/;
  function reset(sc) {
    sc.classList.remove(...[...sc.classList].filter((c) => STATE.test(c)));
    $$('.is-run, .is-ok, .is-lit, .is-on, .is-press', sc).forEach((el) => el.classList.remove('is-run', 'is-ok', 'is-lit', 'is-on', 'is-press'));
    $$('.tb-he-pulse', sc).forEach((p) => { p.style.opacity = 0; });
    $$('[data-from]', sc).forEach((el) => { el.textContent = fmt(el, +el.dataset.from); });
    const runs = $('.tb-he-runs', sc);
    if (runs) runs.textContent = '1,284';
    $$('.tb-he-cursor', sc).forEach((c) => { c.style.removeProperty('--cx'); c.style.removeProperty('--cy'); });
  }
  function final(sc) {
    reset(sc);
    for (let k = 1; k <= 7; k++) sc.classList.add('s' + k);
    $$('.tb-he-node', sc).forEach((n) => n.classList.add('is-ok'));
    $$('.tb-he-edge', sc).forEach((e) => e.classList.add('is-lit'));
    $$('[data-to]', sc).forEach((el) => { el.textContent = fmt(el, +el.dataset.to); });
    const runs = $('.tb-he-runs', sc);
    if (runs) runs.textContent = '1,285';
  }

  // ---------- Activación de escena, título y riel ----------
  let current = -1;
  function activate(i, animateRail = true) {
    scenes.forEach((s, k) => {
      if (k === i) { s.classList.remove('is-leaving'); s.classList.add('is-active'); }
      else if (s.classList.contains('is-active')) {
        s.classList.add('is-leaving'); s.classList.remove('is-active');
        setTimeout(() => s.classList.remove('is-leaving'), 550);
      }
    });
    if (title && current !== i) {
      title.classList.add('is-swap');
      setTimeout(() => { title.textContent = scenes[i].dataset.title || ''; title.classList.remove('is-swap'); }, 220);
    }
    steps.forEach((st, k) => {
      st.classList.toggle('is-done', k < i);
      st.classList.remove('is-active');
      st.removeAttribute('aria-current');
    });
    const st = steps[i];
    if (st) {
      void st.offsetWidth; // reinicia la animación del relleno
      st.style.setProperty('--d', D[i] + 'ms');
      st.classList.add('is-active');
      st.classList.toggle('is-static', !animateRail);
      st.setAttribute('aria-current', 'step');
    }
    current = i;
  }

  // ---------- Escenas ----------
  const PLAYS = [
    // 1 · Flujo: los nodos aparecen, el pulso recorre las conexiones y cada nodo se marca ✓
    async ({ sc, wait, add }) => {
      const nodes = $$('.tb-he-node', sc);
      const edges = $$('.tb-he-edge', sc);
      const pulses = $$('.tb-he-pulse', sc);
      const travel = (idx) => wait(700, (t) => {
        const e = ease.inOut(t);
        idx.forEach((k) => {
          const p = edges[k];
          const pt = p.getPointAtLength(p.getTotalLength() * e);
          pulses[k].setAttribute('cx', pt.x);
          pulses[k].setAttribute('cy', pt.y);
          pulses[k].style.opacity = t < 0.96 ? 1 : 0;
        });
      });
      add('s1'); await wait(800);
      add('s2'); await wait(650);
      nodes[0].classList.add('is-run'); await wait(380);
      nodes[0].classList.replace('is-run', 'is-ok');
      await travel([0]); edges[0].classList.add('is-lit');
      nodes[1].classList.add('is-run'); await wait(900);
      nodes[1].classList.replace('is-run', 'is-ok');
      [2, 3, 4].forEach((k) => nodes[k].classList.add('is-run'));
      await travel([1, 2, 3]);
      [1, 2, 3].forEach((k) => edges[k].classList.add('is-lit'));
      for (const k of [2, 3, 4]) { nodes[k].classList.replace('is-run', 'is-ok'); await wait(160); }
      add('s3');
      const runs = $('.tb-he-runs', sc);
      if (runs) runs.textContent = '1,285';
    },
    // 2 · Chat: la clienta escribe, la IA ofrece horarios y agenda
    async ({ wait, add }) => {
      add('s1'); await wait(1000);
      add('s2'); await wait(900);
      add('s3'); await wait(1500);
      add('s4'); await wait(900);
      add('s5'); await wait(800);
      add('s6'); await wait(1200);
      add('s7');
    },
    // 3 · Calendario: la cita cae en el jueves y se activan los recordatorios
    async ({ wait, add }) => {
      add('s1'); await wait(700);
      add('s2'); await wait(1000);
      add('s3'); await wait(700);
      add('s4');
    },
    // 4 · Recordatorios: email, 24 h antes, WhatsApp y la clienta confirma
    async ({ sc, wait, add }) => {
      const cur = $('.tb-he-cursor', sc);
      add('s1'); await wait(500);
      add('s2'); await wait(900);
      add('s3'); await wait(700);
      add('s4'); await wait(50);
      cur.classList.add('is-on');
      const [x, y] = at($('.tb-he-yes', sc), 0.45, 0.55);
      moveCursor(cur, x, y);
      await wait(950);
      cur.classList.add('is-press'); add('s6'); await wait(500);
      add('s7'); await wait(400);
      cur.classList.remove('is-on');
    },
    // 5 · Pipeline: la oportunidad se arrastra a «Cerrado ganado»
    async ({ sc, wait, add }) => {
      const cur = $('.tb-he-cursor', sc);
      const counters = $$('[data-from]', sc);
      add('s1'); await wait(400);
      cur.classList.add('is-on'); moveCursor(cur, 92, 100); await wait(900);
      cur.classList.add('is-press'); add('s3'); await wait(450);
      cur.classList.remove('is-press');
      add('s4'); moveCursor(cur, 420, 322);
      await wait(1000, (t) => {
        const e = ease.out(t);
        counters.forEach((el) => { el.textContent = fmt(el, +el.dataset.from + (+el.dataset.to - +el.dataset.from) * e); });
      });
      add('s5'); cur.classList.remove('is-on'); await wait(400);
      add('s6');
    },
  ];

  // ---------- Bucle ----------
  let gen = 0;
  async function playScene(i, g) {
    const sc = scenes[i];
    reset(sc);
    activate(i);
    let acc = 0;
    const wait = async (ms, onFrame) => { acc += ms; await clock.tick(ms, onFrame); if (g !== gen) throw CANCEL; };
    await wait(350);
    await PLAYS[i]({ sc, wait, add: (c) => sc.classList.add(c) });
    await wait(Math.max(700, D[i] - acc));
  }
  async function run(start) {
    const g = ++gen;
    let i = start;
    try {
      for (;;) { await playScene(i, g); i = (i + 1) % scenes.length; }
    } catch (e) { if (e !== CANCEL) console.warn('[tellbid] hero', e); }
  }

  const still = (i) => { gen++; final(scenes[i]); activate(i, false); };
  const userPaused = () => root.classList.contains('is-user-paused');

  // En pausa, el riel muestra la escena completa sin animarla; al reanudar sigue desde ahí
  steps.forEach((st, i) => st.addEventListener('click', () => (reduced() || userPaused() ? still(i) : run(i))));
  root.addEventListener('tb:resume', () => { if (!reduced() && steps[current] && steps[current].classList.contains('is-static')) run(current); });

  if (reduced()) still(0);
  else run(0);
}

function fmt(el, v) {
  const n = Math.round(v);
  return el.classList.contains('tb-he-v') ? '$' + n.toLocaleString('en-US') : String(n);
}
