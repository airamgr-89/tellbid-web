// Componentes de interfaz: tabs, línea de tiempo con progreso, count-up, fachada de video.
import { $, $$, onVisible, reduced } from '../lib.js';

// ---------- Tabs accesibles (patrón WAI-ARIA, activación automática) ----------
export function tabs() {
  $$('[data-tb-tabs]').forEach((wrap) => {
    const list = $('[role="tablist"]', wrap);
    const tabsEls = $$('[role="tab"]', list);
    const select = (tab, focus) => {
      tabsEls.forEach((t) => {
        const on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        const p = document.getElementById(t.getAttribute('aria-controls'));
        if (p) p.hidden = !on;
      });
      if (focus) tab.focus();
      wrap.dispatchEvent(new CustomEvent('tb:tab', { detail: { tab } }));
    };
    tabsEls.forEach((t, i) => {
      t.addEventListener('click', () => select(t));
      t.addEventListener('keydown', (e) => {
        const n = tabsEls.length;
        let j = null;
        if (e.key === 'ArrowRight') j = (i + 1) % n;
        else if (e.key === 'ArrowLeft') j = (i - 1 + n) % n;
        else if (e.key === 'Home') j = 0;
        else if (e.key === 'End') j = n - 1;
        if (j !== null) { e.preventDefault(); select(tabsEls[j], true); tabsEls[j].scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
      });
    });
  });
}

// ---------- Enlaces que abren una pestaña concreta: data-tb-open-tab="id-del-tab" ----------
export function openTabLinks() {
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-tb-open-tab]');
    if (!a) return;
    const tab = document.getElementById(a.dataset.tbOpenTab);
    if (tab) setTimeout(() => tab.click(), 0);
  });
}

// ---------- Sub-navegación con anclas: marca la sección visible (scrollspy) ----------
export function scrollspy() {
  $$('[data-tb-spy]').forEach((nav) => {
    const links = $$('a[href^="#"]', nav);
    const map = new Map();
    links.forEach((a) => { const sec = document.getElementById(a.getAttribute('href').slice(1)); if (sec) map.set(sec, a); });
    if (!map.size || !('IntersectionObserver' in window)) return;
    const visible = new Set();
    const pick = () => {
      // la primera sección visible en el orden del documento
      const first = [...map.keys()].find((s) => visible.has(s));
      links.forEach((a) => a.removeAttribute('aria-current'));
      if (first) {
        const a = map.get(first);
        a.setAttribute('aria-current', 'true');
        const ul = a.closest('ul');
        if (ul) ul.scrollTo({ left: a.offsetLeft - 16, behavior: 'smooth' });
      }
    };
    const io = new IntersectionObserver((es) => { es.forEach((e) => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target))); pick(); }, { rootMargin: '-35% 0px -55% 0px' });
    map.forEach((_, sec) => io.observe(sec));
  });
}

// ---------- Bandeja unificada: los canales se encienden y «llegan» al hub ----------
export function inbox() {
  $$('[data-tb-inbox]').forEach((box) => {
    const chs = $$('.tb-inbox-ch', box);
    const from = $('.tb-inbox-from', box);
    const acts = $$('.tb-inbox-acts li', box);
    if (reduced()) { acts.forEach((a) => a.classList.add('is-on')); return; }
    let i = 0;
    let timer = null;
    let running = false;
    const step = () => {
      chs.forEach((c) => c.classList.remove('is-lit'));
      const c = chs[i % chs.length];
      c.classList.add('is-lit');
      box.style.setProperty('--tb-ch', getComputedStyle(c).getPropertyValue('--tb-ch'));
      from.textContent = 'Llegó por ' + c.textContent.trim();
      acts.forEach((a) => a.classList.remove('is-on'));
      acts.forEach((a, k) => setTimeout(() => running && a.classList.add('is-on'), 350 + k * 260));
      i++;
      timer = setTimeout(step, 2600);
    };
    const start = () => { if (!running) { running = true; step(); } };
    const stop = () => { running = false; clearTimeout(timer); };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => (e.isIntersecting && !document.hidden ? start() : stop()), { threshold: 0.3 }).observe(box);
    } else start();
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : null));
  });
}

// ---------- Línea de tiempo: el progreso sigue al scroll ----------
export function steps() {
  $$('.tb-steps').forEach((el) => {
    const items = $$('.tb-step', el);
    const vertical = () => window.matchMedia('(max-width: 860px)').matches;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 cuando el bloque entra por abajo (70% del viewport), 1 cuando su final llega al 45%
      const start = vh * 0.75;
      const end = vh * 0.45;
      const span = vertical() ? r.height : r.height + 120;
      const p = Math.max(0, Math.min(1, (start - r.top) / (span + start - end)));
      el.style.setProperty('--tb-progress', (p * 100).toFixed(1) + '%');
      items.forEach((it, i) => it.classList.toggle('is-on', p >= (i / Math.max(1, items.length - 1)) * 0.98 || p >= 0.999));
    };
    if (reduced()) { el.style.setProperty('--tb-progress', '100%'); items.forEach((it) => it.classList.add('is-on')); return; }
    const req = () => { if (!raf) raf = requestAnimationFrame(update); };
    window.addEventListener('scroll', req, { passive: true });
    window.addEventListener('resize', req);
    update();
  });
}

// ---------- Count-up de cifras: data-tb-count="38" data-tb-prefix="+" data-tb-suffix="%" ----------
export function countUp() {
  const fmt = new Intl.NumberFormat('es-US');
  $$('[data-tb-count]').forEach((el) => {
    const to = parseFloat(el.dataset.tbCount);
    const dec = (el.dataset.tbCount.split('.')[1] || '').length;
    const pre = el.dataset.tbPrefix || '';
    const suf = el.dataset.tbSuffix || '';
    const out = (v) => { el.textContent = pre + (dec ? v.toFixed(dec) : fmt.format(Math.round(v))) + suf; };
    if (reduced()) return out(to);
    out(0);
    onVisible(el, () => {
      const t0 = performance.now();
      const dur = 1400;
      const step = (now) => {
        const t = Math.min(1, (now - t0) / dur);
        out(to * (1 - Math.pow(1 - t, 3)));
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  });
}

// ---------- Fachada de video: el iframe solo se carga al hacer clic ----------
// <div class="tb-video" data-tb-video="YOUTUBE_ID" style="background-image:url(poster)"> <button class="tb-video-btn">…</button></div>
export function videos() {
  $$('[data-tb-video]').forEach((box) => {
    const btn = $('.tb-video-btn', box);
    if (!btn) return;
    if (!box.dataset.tbVideo) { // sin ID todavía: se muestra como «próximamente»
      box.classList.add('is-pending');
      btn.disabled = true;
      const label = $('.tb-video-label', btn);
      if (label) label.textContent = 'Video disponible pronto';
      const name = (btn.getAttribute('aria-label') || '').replace(/^Ver video:s*/, '');
      btn.setAttribute('aria-label', 'Video disponible pronto: ' + name);
      return;
    }
    btn.addEventListener('click', () => {
      const id = box.dataset.tbVideo;
      const f = document.createElement('iframe');
      f.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
      f.title = btn.getAttribute('aria-label') || 'Video';
      f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      f.allowFullscreen = true;
      box.replaceChildren(f);
      f.focus();
    });
  });
}

// ---------- Botón para pausar/reanudar animaciones en bucle (WCAG 2.2.2) ----------
// <button data-tb-pause-btn> dentro de [data-tb-engine], [data-tb-wf] o [data-tb-code]
export function pauseButtons() {
  $$('[data-tb-pause-btn]').forEach((btn) => {
    const host = btn.closest('[data-tb-engine], [data-tb-wf], [data-tb-code]');
    if (!host) return;
    if (reduced()) { btn.hidden = true; return; }
    btn.addEventListener('click', () => {
      const paused = !host.classList.contains('is-user-paused');
      host.classList.toggle('is-user-paused', paused);
      btn.setAttribute('aria-pressed', String(paused));
      if (!paused) host.dispatchEvent(new CustomEvent('tb:resume'));
    });
  });
}
