// TellBid · JS compartido (entrada de esbuild → dist/tb.min.js)
// Cada módulo busca sus propios elementos; si no existen en la página, no hace nada.
import { root } from './lib.js';
import { fullWidth, reveal, header, captureUtms, year, pauseOffscreen } from './core.js';
import { tabs, steps, countUp, videos, videoModal, openTabLinks, inbox, scrollspy, pauseButtons } from './modules/ui.js';
import { heroEngine } from './modules/hero-engine.js';
import { workflow } from './modules/workflow.js';
import { codeEditor } from './modules/code-editor.js';
import { form, booking } from './modules/form.js';
import { sticky } from './modules/sticky.js';

function init() {
  const site = root();
  if (!site || site.dataset.tbReady) return;
  site.dataset.tbReady = '1';
  site.classList.add('tb-js');

  fullWidth();
  window.addEventListener('load', fullWidth); // GHL puede terminar de montar después

  const mods = { captureUtms, year, header, reveal, pauseOffscreen, tabs, openTabLinks, scrollspy, steps, countUp, videos, videoModal, inbox, pauseButtons, heroEngine, workflow, codeEditor, form, booking, sticky };
  Object.entries(mods).forEach(([name, fn]) => { try { fn(); } catch (e) { console.warn('[tellbid]', name, e); } });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
