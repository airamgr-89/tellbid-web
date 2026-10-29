// Núcleo: ancho completo en GHL, reveal, header (scroll, desplegable, drawer), UTMs, año.
import { root, $, $$, onVisible } from './lib.js';

// ---------- Ancho completo dentro de GHL ----------
// Quita padding/margen/ancho máximo de los contenedores de GHL que envuelven SOLO esta página.
// Se detiene al encontrar un contenedor con otro contenido visible.
export function fullWidth() {
  const site = root();
  if (!site) return;
  const NON_VISUAL = /^(STYLE|SCRIPT|LINK|META|NOSCRIPT|TEMPLATE|BR)$/;
  let child = site;
  let el = site.parentElement;
  while (el && el !== document.documentElement) {
    const other = Array.from(el.children).some((c) => c !== child && !NON_VISUAL.test(c.tagName) && c.offsetHeight > 0);
    if (other) break;
    for (const [k, v] of [['padding', '0'], ['margin', '0'], ['max-width', 'none'], ['width', '100%'], ['overflow', 'visible']]) {
      el.style.setProperty(k, v, 'important');
    }
    if (el === document.body) break;
    child = el;
    el = el.parentElement;
  }
}

// ---------- Aparición al hacer scroll ----------
export function reveal() {
  $$('.tb-rv').forEach((el) => onVisible(el, (t) => t.classList.add('tb-in'), { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }));
}

// ---------- Pausa de animaciones CSS decorativas fuera de pantalla ----------
// Cualquier elemento con [data-tb-pause] recibe .is-paused cuando no se ve o la pestaña se oculta.
export function pauseOffscreen() {
  const els = $$('[data-tb-pause]');
  if (!els.length || !('IntersectionObserver' in window)) return;
  const seen = new Map();
  const apply = (el) => el.classList.toggle('is-paused', document.hidden || !seen.get(el));
  const io = new IntersectionObserver((es) => es.forEach((e) => { seen.set(e.target, e.isIntersecting); apply(e.target); }), { threshold: 0 });
  els.forEach((el) => { seen.set(el, true); io.observe(el); });
  document.addEventListener('visibilitychange', () => els.forEach(apply));
}

// ---------- Header ----------
export function header() {
  const h = $('.tb-header');
  if (!h) return;

  // Si la página abre con una sección oscura, el header arranca transparente encima de ella
  const first = $('.tb-main > :first-child');
  if (first && first.getAttribute('data-tb-theme') === 'dark') h.classList.add('is-overlay');

  // Marca el enlace de la página actual
  $$('.tb-nav-link[href]', h).forEach((a) => { if (a.getAttribute('href') === location.pathname) a.setAttribute('aria-current', 'page'); });

  // Estado de scroll (header transparente sobre hero oscuro → claro)
  const onScroll = () => h.classList.toggle('is-scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Desplegable(s)
  $$('[data-tb-dd]', h).forEach((btn) => {
    const panel = document.getElementById(btn.getAttribute('aria-controls'));
    if (!panel) return;
    const wrap = btn.closest('.tb-dd');
    let closeTimer;
    const set = (open) => { btn.setAttribute('aria-expanded', String(open)); panel.hidden = !open; };
    btn.addEventListener('click', () => set(btn.getAttribute('aria-expanded') !== 'true'));
    // En escritorio también abre al pasar el ratón (con tolerancia al salir)
    wrap.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') { clearTimeout(closeTimer); set(true); } });
    wrap.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') closeTimer = setTimeout(() => set(false), 180); });
    document.addEventListener('click', (e) => { if (!wrap.contains(e.target)) set(false); });
    wrap.addEventListener('keydown', (e) => { if (e.key === 'Escape') { set(false); btn.focus(); } });
    wrap.addEventListener('focusout', (e) => { if (!wrap.contains(e.relatedTarget)) set(false); });
  });

  // Drawer móvil
  const burger = $('.tb-burger', h);
  const drawer = burger && document.getElementById(burger.getAttribute('aria-controls'));
  if (burger && drawer) {
    const focusables = () => $$('a, button', drawer).filter((x) => !x.disabled);
    const set = (open) => {
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      drawer.hidden = !open;
      h.classList.toggle('is-open', open);
      document.documentElement.style.overflow = open ? 'hidden' : '';
      if (open) (focusables()[0] || drawer).focus();
    };
    burger.addEventListener('click', () => set(burger.getAttribute('aria-expanded') !== 'true'));
    drawer.addEventListener('click', (e) => { if (e.target.closest('a')) set(false); });
    document.addEventListener('keydown', (e) => {
      if (drawer.hidden) return;
      if (e.key === 'Escape') { set(false); burger.focus(); }
      if (e.key === 'Tab') {
        const f = [burger, ...focusables()];
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    window.matchMedia('(min-width: 1001px)').addEventListener('change', (m) => { if (m.matches) set(false); });
  }
}

// ---------- UTMs y click IDs (se envían con el formulario) ----------
export function captureUtms() {
  try {
    const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid', 'ttclid'];
    const q = new URLSearchParams(location.search);
    const stored = JSON.parse(sessionStorage.getItem('tb_utms') || '{}');
    let changed = false;
    keys.forEach((k) => { if (q.get(k)) { stored[k] = q.get(k); changed = true; } });
    if (changed) sessionStorage.setItem('tb_utms', JSON.stringify(stored));
  } catch (e) { /* almacenamiento bloqueado: se ignora */ }
}

export function getUtms() {
  try { return JSON.parse(sessionStorage.getItem('tb_utms') || '{}'); } catch (e) { return {}; }
}

// ---------- Año del copyright ----------
export function year() {
  $$('[data-tb-year]').forEach((el) => { el.textContent = String(new Date().getFullYear()); });
}
