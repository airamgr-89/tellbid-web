// Editor de código que se escribe solo y enciende los sistemas que va conectando.
import { $, $$, reduced, pausableClock } from '../lib.js';

export function codeEditor() {
  $$('[data-tb-code]').forEach(init);
}

function init(root) {
  const lines = $$('.tb-ce-line', root);
  const nodes = $$('.tb-ce-node', root);
  const links = $$('.tb-ce-link', root);
  lines.forEach((l) => l.style.setProperty('--n', l.textContent.length));

  const light = (i) => {
    nodes.forEach((n, k) => n.classList.toggle('is-on', k <= i));
    links.forEach((l, k) => l.classList.toggle('is-on', k < i));
  };
  const allDone = () => { lines.forEach((l) => l.classList.add('is-typed')); light(nodes.length - 1); root.classList.add('is-done'); };

  if (reduced()) return allDone();

  const { tick } = pausableClock(root);
  (async function loop() {
    for (;;) {
      root.classList.remove('is-done');
      lines.forEach((l) => l.classList.remove('is-typed', 'is-typing'));
      light(-1);
      await tick(600);
      for (const [i, l] of lines.entries()) {
        l.classList.add('is-typing', 'is-typed');
        await tick(Math.max(180, l.textContent.length * 26));
        l.classList.remove('is-typing');
        if (i === 1) light(0);
        if (l.dataset.node) light(+l.dataset.node);
        await tick(120);
      }
      root.classList.add('is-done');
      await tick(3800);
    }
  })();
}
