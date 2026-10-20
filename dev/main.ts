import { installSvgViewer } from '../src/viewer';
import diagram from './diagram.svg?raw';
const root = document.querySelector('#docs')!.attachShadow({ mode: 'open' });
// Trusted, repository-owned demo fixture; production never parses SVG strings.
const markup = `<style>
:host{color:#22314d}article{font:16px/1.6 system-ui}article>svg{max-width:100%;height:auto}.node-label{fill:rgb(34,49,77)}article>svg .node-label{font-weight:600}.twemoji svg{width:20px;height:20px}a{color:#2464c4}
</style><article class="md-content__inner"><h2>Service architecture</h2><p>Click any unlinked part of the diagram to expand. Linked nodes retain normal navigation.</p>${diagram}
<p id="queue-note">Queue note: events are delivered at least once.</p>
<p><span class="twemoji"><svg viewBox="0 0 20 20"><circle r="8" cx="10" cy="10"/></svg></span> Small icons should remain untouched.</p>
<svg id="opt-out" data-svg-viewer="off" width="160" height="70"><title>Excluded diagram</title><rect width="160" height="70" fill="#ddd"/></svg>
<a id="wrapped-link" href="/wrapped" target="_blank"><svg id="wrapped" width="180" height="80" viewBox="0 0 180 80"><title>Linked overview</title><rect width="180" height="80" fill="#e6f4ec"/><text x="10" y="44">Whole-image link ↗</text></svg></a>
</article>`;
root.innerHTML = markup;
let dispose = installSvgViewer(root);
document.querySelector('#replace')!.addEventListener('click', () => {
  const article = root.querySelector('article')!;
  article.innerHTML = `<h2>Next documentation page</h2>${diagram.replace('Order processing architecture', 'Next diagram')}`;
});
document.querySelector('#dispose')!.addEventListener('click', () => dispose());
document.querySelector('#install')!.addEventListener('click', () => {
  dispose();
  dispose = installSvgViewer(root);
});
