// Utilidades compartidas por todos los módulos.
export const root = () => document.getElementById('tb-site');
export const $ = (sel, ctx) => (ctx || root()).querySelector(sel);
export const $$ = (sel, ctx) => Array.from((ctx || root()).querySelectorAll(sel));
export const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Ejecuta fn cuando el elemento entra en pantalla (una sola vez).
export function onVisible(el, fn, opts) {
  if (!('IntersectionObserver' in window)) return fn(el);
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { io.unobserve(e.target); fn(e.target); }
    });
  }, opts || { rootMargin: '0px 0px -10% 0px', threshold: 0.15 });
  io.observe(el);
}

// Reloj rAF que se pausa cuando el elemento sale de pantalla o la pestaña se oculta.
// Base de las animaciones en bucle (motor del hero, workflow, mini-escenas).
// También se detiene cuando la persona pausa la animación (clase .is-user-paused en el elemento).
export function pausableClock(el) {
  let visible = false;
  let waiters = [];
  const running = () => visible && !document.hidden && !el.classList.contains('is-user-paused');
  const release = () => { if (running()) { const w = waiters; waiters = []; w.forEach((r) => r()); } };
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((es) => { visible = es[0].isIntersecting; release(); }, { threshold: 0.2 }).observe(el);
  } else visible = true;
  document.addEventListener('visibilitychange', release);
  el.addEventListener('tb:resume', release);
  const ready = () => (running() ? Promise.resolve() : new Promise((r) => waiters.push(r)));

  // tick(ms, onFrame?) → Promise que resuelve tras ms de tiempo «visible».
  function tick(ms, onFrame) {
    return new Promise((resolve) => {
      let elapsed = 0;
      let last = null;
      const step = (now) => {
        if (!running()) { last = null; ready().then(() => requestAnimationFrame(step)); return; }
        if (last !== null) elapsed += now - last;
        last = now;
        const t = Math.min(1, elapsed / ms);
        if (onFrame) onFrame(t);
        if (t >= 1) resolve(); else requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }
  return { tick, ready };
}

export const ease = {
  inOut: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  out: (t) => 1 - Math.pow(1 - t, 3),
};
