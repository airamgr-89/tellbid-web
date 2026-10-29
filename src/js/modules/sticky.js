// Barra fija con el CTA (solo móvil): visible cuando ya pasaste los botones del hero
// y no estás viendo el formulario de diagnóstico ni el footer.
import { $, $$ } from '../lib.js';

export function sticky() {
  const bar = $('[data-tb-sticky]');
  if (!bar || !('IntersectionObserver' in window)) return;
  const hero = $('[data-tb-hero-ctas]');
  const blockers = [$('#diagnostico'), $('.tb-footer')].filter(Boolean);
  const state = { passed: false, blocked: new Set() };
  const mq = matchMedia('(max-width: 760px)');

  const render = () => {
    const show = mq.matches && state.passed && state.blocked.size === 0;
    bar.classList.toggle('is-on', show);
    bar.setAttribute('aria-hidden', String(!show));
    $$('a', bar).forEach((a) => (a.tabIndex = show ? 0 : -1));
  };

  if (hero) {
    new IntersectionObserver(([e]) => {
      // pasado = ya no se ve y quedó por encima del viewport
      state.passed = !e.isIntersecting && e.boundingClientRect.top < 0;
      render();
    }).observe(hero);
  } else state.passed = true;

  const io = new IntersectionObserver((es) => {
    es.forEach((e) => (e.isIntersecting ? state.blocked.add(e.target) : state.blocked.delete(e.target)));
    render();
  });
  blockers.forEach((b) => io.observe(b));
  mq.addEventListener('change', render);
  render();
}
