// Formulario de diagnóstico: 4 pasos, validación, puntaje, envío al webhook de GHL
// y calendario incrustado para quien califica. Basado en la lógica de la web anterior.
import { $, $$ } from '../lib.js';
import { getUtms } from '../core.js';

export const CONFIG = {
  WEBHOOK_URL: 'https://services.leadconnectorhq.com/hooks/356V1gJOBVlJPx16a8iv/webhook-trigger/7cb8d76c-a030-4d92-ac3a-dbc7a2949bf0',
  BOOKING_URL: 'https://api.leadconnectorhq.com/widget/booking/3dc6GJoakmLjvIZRJ7QV',
  BOOKING_SCRIPT: 'https://link.msgsndr.com/js/form_embed.js',
  WHATSAPP: 'https://wa.me/19047806780',
  CRM_URL: '/servicios#crm',
  QUALIFY_MIN: 30,
  SOURCE: 'web-tellbid',
};

// En local (preview) no se envía nada salvo que la URL tenga ?tb_send=1
const isLocal = () => /^(localhost|127\.0\.0\.1|\[::1\])$|\.localhost$|\.test$/.test(location.hostname) && !/[?&]tb_send=1/.test(location.search);

let lastCta = 'directo';

// Calendario incrustado directamente (p. ej. Soporte): <div data-tb-booking="URL_DEL_CALENDARIO" data-tb-title="…">
// Pasa al calendario los datos de contacto y UTMs que vengan en la URL de la página (enlaces desde emails o GHL).
export function booking() {
  $$('[data-tb-booking]').forEach((box) => {
    const base = box.dataset.tbBooking;
    if (!base) return;
    const q = new URLSearchParams(location.search);
    const pass = new URLSearchParams();
    ['first_name', 'last_name', 'full_name', 'name', 'email', 'phone', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']
      .forEach((k) => { if (q.get(k)) pass.set(k, q.get(k)); });
    const loading = document.createElement('p');
    loading.className = 'tb-booking-loading';
    loading.textContent = 'Cargando horarios disponibles…';
    const frame = document.createElement('iframe');
    const id = base.split('?')[0].split('/').pop();
    frame.src = base + (pass.toString() ? (base.includes('?') ? '&' : '?') + pass.toString() : '');
    frame.id = id + '_' + Date.now();
    frame.title = box.dataset.tbTitle || 'Calendario de TellBid';
    frame.setAttribute('scrolling', 'no');
    frame.addEventListener('load', () => { loading.hidden = true; });
    box.replaceChildren(loading, frame);
    if (!document.querySelector(`script[src="${CONFIG.BOOKING_SCRIPT}"]`)) {
      const s = document.createElement('script');
      s.src = CONFIG.BOOKING_SCRIPT; s.async = true;
      document.body.appendChild(s);
    }
  });
}

export function form() {
  // Recuerda qué CTA abrió el formulario y lleva al formulario de la página si existe
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-tb-cta], a[href="/diagnostico"], a[href="#diagnostico"]');
    if (!a) return;
    if (a.dataset.tbCta) lastCta = a.dataset.tbCta;
    const target = document.getElementById('diagnostico');
    if (!target) return; // en otras páginas el enlace /diagnostico navega normal
    e.preventDefault();
    if (a.dataset.tbNeed) {
      const box = $(`input[name="need"][data-tag="${a.dataset.tbNeed}"]`);
      if (box && !box.checked) { box.checked = true; box.dispatchEvent(new Event('change', { bubbles: true })); }
    }
    target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    const legend = $('.tb-fstep.is-on legend', target);
    setTimeout(() => legend && legend.focus({ preventScroll: true }), 600);
    history.replaceState(null, '', '#diagnostico');
  });

  $$('[data-tb-form-card]').forEach(init);
}

function init(card) {
  const f = $('[data-tb-form]', card);
  const steps = $$('.tb-fstep', f);
  const names = $$('.tb-form-names li', card);
  const bar = $('.tb-form-bar', card);
  const prog = $('.tb-form-progress', card);
  const live = $('[data-tb-step-live]', card);
  const result = $('[data-tb-result]', card);
  const project = $('[data-tb-project]', f);
  let cur = 1;

  const radio = (n) => $(`input[name="${n}"]:checked`, f);
  const checks = (n) => $$(`input[name="${n}"]:checked`, f);
  const setErr = (id, msg, input) => {
    const el = $('#' + id, card);
    if (el) el.textContent = msg || '';
    if (input) input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    return !msg;
  };

  // «No estoy seguro» es excluyente con las demás opciones
  f.addEventListener('change', (e) => {
    const t = e.target;
    if (t.name === 'need') {
      const unsure = t.dataset.tag === 'interes-asesoria';
      if (t.checked) $$('input[name="need"]', f).forEach((i) => { if (i !== t && (unsure || i.dataset.tag === 'interes-asesoria')) i.checked = false; });
      if (project) project.hidden = !$('input[name="need"][data-tag="interes-software"]:checked', f);
      setErr('tb-f-err-need', '');
    }
    if (t.type === 'radio') {
      const map = { team: 'tb-f-err-team', invest: 'tb-f-err-inv', urgency: 'tb-f-err-urg' };
      if (map[t.name]) setErr(map[t.name], '');
    }
  });

  // ---------- Validación por paso ----------
  const fName = $('#tb-f-name', f);
  const fEmail = $('#tb-f-email', f);
  const fPhone = $('#tb-f-phone', f);
  const fWeb = $('#tb-f-web', f);
  const fSector = $('#tb-f-sector', f);
  const digits = () => fPhone.value.replace(/\D/g, '');

  const v = {
    name() {
      const s = fName.value.trim().replace(/\s+/g, ' ');
      if (!s) return setErr('tb-f-err-name', 'Escribe tu nombre completo.', fName);
      if (s.split(' ').length < 2 || s.length < 4) return setErr('tb-f-err-name', 'Escribe tu nombre y apellido.', fName);
      return setErr('tb-f-err-name', '', fName);
    },
    email() {
      const s = fEmail.value.trim();
      if (!s) return setErr('tb-f-err-email', 'Escribe tu email.', fEmail);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s)) return setErr('tb-f-err-email', 'Revisa tu email, parece incompleto.', fEmail);
      return setErr('tb-f-err-email', '', fEmail);
    },
    phone() {
      const d = digits();
      if (!d) return setErr('tb-f-err-phone', 'Escribe tu WhatsApp.', fPhone);
      if (d.length < 10 || d.length > 15) return setErr('tb-f-err-phone', 'Escribe un número válido de 10 dígitos o con código de país.', fPhone);
      return setErr('tb-f-err-phone', '', fPhone);
    },
    web() {
      const s = fWeb.value.trim();
      if (s && s[0] !== '@' && !/\.[a-z]{2,}/i.test(s)) return setErr('tb-f-err-web', 'Revisa la dirección (ej. www.tunegocio.com) o déjala en blanco.', fWeb);
      return setErr('tb-f-err-web', '', fWeb);
    },
  };
  [['name', fName], ['email', fEmail], ['phone', fPhone], ['web', fWeb]].forEach(([k, el]) => el.addEventListener('blur', v[k]));
  fSector.addEventListener('change', () => setErr('tb-f-err-sector', '', fSector));

  const validate = (n) => {
    if (n === 1) return checks('need').length ? true : setErr('tb-f-err-need', 'Elige al menos una opción para continuar.');
    if (n === 2) {
      const a = fSector.value ? setErr('tb-f-err-sector', '', fSector) : setErr('tb-f-err-sector', 'Elige tu sector.', fSector);
      const b = radio('team') ? true : setErr('tb-f-err-team', 'Elige el tamaño de tu equipo.');
      return a && b;
    }
    if (n === 3) {
      const a = radio('invest') ? true : setErr('tb-f-err-inv', 'Elige un rango.');
      const b = radio('urgency') ? true : setErr('tb-f-err-urg', 'Dinos cuándo quieres empezar.');
      return a && b;
    }
    const ok = [v.name(), v.email(), v.phone(), v.web()];
    const first = [fName, fEmail, fPhone, fWeb][ok.indexOf(false)];
    if (first) first.focus();
    return ok.every(Boolean);
  };

  // ---------- Navegación ----------
  const goTo = (n, quiet) => {
    cur = n;
    steps.forEach((s) => s.classList.toggle('is-on', +s.dataset.step === n));
    names.forEach((li, i) => { li.classList.toggle('is-on', i === n - 1); li.classList.toggle('is-done', i < n - 1); });
    bar.style.width = (n / steps.length) * 100 + '%';
    prog.setAttribute('aria-valuenow', n);
    live.textContent = `Paso ${n} de ${steps.length}`;
    if (quiet) return;
    const lg = $('.tb-fstep.is-on legend', f);
    if (lg) lg.focus({ preventScroll: true });
    const top = card.getBoundingClientRect().top;
    if (top < 60 || top > innerHeight * 0.6) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  f.addEventListener('click', (e) => {
    if (e.target.closest('[data-next]')) { if (validate(cur)) goTo(cur + 1); }
    if (e.target.closest('[data-prev]')) goTo(cur - 1);
  });
  goTo(1, true);

  // Necesidad preseleccionada por la página (p. ej. Software a la medida)
  const preset = card.closest('[data-tb-preset-need]');
  if (preset) {
    const box = $(`input[name="need"][data-tag="${preset.dataset.tbPresetNeed}"]`, f);
    if (box) { box.checked = true; box.dispatchEvent(new Event('change', { bubbles: true })); }
  }

  // ---------- Puntaje ----------
  const score = () => {
    const needs = checks('need').map((i) => i.dataset.tag);
    let s = 0;
    if (needs.includes('interes-software') || needs.includes('interes-automatizacion')) s += 20;
    ['team', 'invest', 'urgency'].forEach((n) => { const r = radio(n); if (r) s += +r.dataset.score; });
    return Math.min(100, s);
  };

  const normUrl = (s) => {
    s = s.trim();
    if (!s) return '';
    if (s[0] === '@') return 'https://instagram.com/' + s.slice(1);
    return /^https?:\/\//i.test(s) ? s : 'https://' + s;
  };
  const e164 = (d) => (d.length === 10 ? '+1' + d : '+' + d);

  const payload = () => {
    const full = fName.value.trim().replace(/\s+/g, ' ');
    const [first, ...rest] = full.split(' ');
    const sc = score();
    const qualified = sc >= CONFIG.QUALIFY_MIN;
    const needTags = checks('need').map((i) => i.dataset.tag);
    return {
      qualified,
      data: {
        first_name: first, last_name: rest.join(' '), full_name: full,
        email: fEmail.value.trim(), phone: e164(digits()), website: normUrl(fWeb.value),
        necesidades: checks('need').map((i) => i.value).join(', '),
        sector: fSector.value, tamano_equipo: (radio('team') || {}).value || '',
        inversion: (radio('invest') || {}).value || '', urgencia: (radio('urgency') || {}).value || '',
        proyecto: ($('#tb-f-project', f) || {}).value || '',
        lead_score: sc, calificacion: qualified ? 'califica' : 'no-califica',
        tags: ['web-diagnostico', qualified ? 'califica' : 'no-califica', ...needTags].join(', '),
        source: CONFIG.SOURCE, cta_origen: lastCta, page_url: location.href, submitted_at: new Date().toISOString(),
        ...getUtms(),
      },
    };
  };

  const send = async (data) => {
    if (isLocal()) { console.info('[tellbid] Modo prueba (localhost): no se envía. Payload:', data); return; }
    const body = new URLSearchParams();
    Object.entries(data).forEach(([k, val]) => body.append(k, val == null ? '' : String(val)));
    await fetch(CONFIG.WEBHOOK_URL, { method: 'POST', mode: 'no-cors', body, keepalive: true });
  };

  // ---------- Resultado ----------
  const withContact = (url, d) => {
    const q = new URLSearchParams({ first_name: d.first_name, last_name: d.last_name, full_name: d.full_name, email: d.email, phone: d.phone });
    return url + (url.includes('?') ? '&' : '?') + q.toString();
  };
  const btn = (href, text, cls) => { const a = document.createElement('a'); a.href = href; a.className = 'tb-btn ' + cls; a.textContent = text; return a; };
  const h = (tag, cls, text) => { const el = document.createElement(tag); if (cls) el.className = cls; if (text) el.textContent = text; return el; };

  function showResult(qualified, d) {
    result.replaceChildren();
    if (qualified) {
      result.append(
        h('p', 'tb-result-ok', 'Solicitud recibida'),
        h('h3', 'tb-h3', `¡Listo, ${d.first_name}! Elige el horario de tu diagnóstico.`),
        h('p', 'tb-body', 'Son 30 minutos con un especialista. Ya precargamos tus datos.'),
      );
      const wrap = h('div', 'tb-booking');
      const loading = h('p', 'tb-booking-loading', 'Cargando horarios disponibles…');
      const frame = document.createElement('iframe');
      const calId = CONFIG.BOOKING_URL.split('?')[0].split('/').pop();
      frame.src = withContact(CONFIG.BOOKING_URL, d);
      frame.id = calId + '_' + Date.now(); // formato que espera form_embed.js
      frame.title = 'Calendario para agendar tu diagnóstico con TellBid';
      frame.setAttribute('scrolling', 'no');
      frame.addEventListener('load', () => { loading.hidden = true; });
      wrap.append(loading, frame);
      result.append(wrap);
      if (!document.querySelector(`script[src="${CONFIG.BOOKING_SCRIPT}"]`)) {
        const s = document.createElement('script');
        s.src = CONFIG.BOOKING_SCRIPT; s.async = true;
        document.body.appendChild(s);
      }
    } else {
      const row = h('div', 'tb-ctas');
      row.append(btn(CONFIG.WHATSAPP, 'Escríbenos por WhatsApp', 'tb-btn-primary'), btn(CONFIG.CRM_URL, 'Ver el CRM gestionado', 'tb-btn-secondary'));
      result.append(
        h('p', 'tb-result-ok', 'Solicitud recibida'),
        h('h3', 'tb-h3', `Gracias, ${d.first_name}.`),
        h('p', 'tb-body', 'Por lo que nos cuentas, te conviene empezar con nuestro CRM gestionado desde $99/mes, o escribirnos por WhatsApp para orientarte.'),
        row,
      );
    }
    f.hidden = true;
    $('.tb-form-top', card).hidden = true;
    result.hidden = false;
    result.focus({ preventScroll: true });
    card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ---------- Envío ----------
  const submitBtn = $('[data-submit]', f);
  const submitErr = $('[data-tb-submit-err]', f);
  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validate(4)) return;
    const { qualified, data } = payload();
    submitBtn.disabled = true;
    submitBtn.classList.add('is-loading');
    $('.tb-submit-tx', submitBtn).textContent = 'Preparando tu diagnóstico…';
    submitErr.textContent = '';
    try {
      await send(data);
      showResult(qualified, data);
    } catch (err) {
      submitErr.textContent = 'No pudimos enviar tu solicitud. Revisa tu conexión e inténtalo de nuevo, o escríbenos por WhatsApp.';
      submitBtn.disabled = false;
    } finally {
      submitBtn.classList.remove('is-loading');
      $('.tb-submit-tx', submitBtn).textContent = 'Ver horarios disponibles';
    }
  });
}
