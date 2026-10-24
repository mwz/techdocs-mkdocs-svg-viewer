import { installSvgViewer } from '../src/viewer';
import diagram from './diagram.svg?raw';
const root = document.querySelector('#docs')!.attachShadow({ mode: 'open' });
// Trusted, repository-owned demo fixture; production never parses SVG strings.
const markup = `<style>
:host{color:var(--md-default-fg-color)}article{font:16px/1.6 system-ui}article>svg{max-width:100%;height:auto}.node-label{fill:rgb(34,49,77)}article>svg .node-label{font-weight:600}.twemoji svg{width:20px;height:20px}a{color:var(--md-accent-fg-color)}
</style><article class="md-content__inner"><h2>Service architecture</h2><p>Click any unlinked part of the diagram to expand. Linked nodes retain normal navigation.</p>${diagram}
<p id="queue-note">Queue note: events are delivered at least once.</p>
<p><span class="twemoji"><svg viewBox="0 0 20 20"><circle r="8" cx="10" cy="10"/></svg></span> Small icons should remain untouched.</p>
<svg id="opt-out" data-svg-viewer="off" width="160" height="70"><title>Excluded diagram</title><rect width="160" height="70" fill="#ddd"/></svg>
<div class="mermaid"><svg id="mermaid-1" width="200" height="90"><title>Mermaid diagram</title><rect width="200" height="90" fill="#eee"/></svg></div>
<a id="wrapped-link" href="/wrapped" target="_blank"><svg id="wrapped" width="180" height="80" viewBox="0 0 180 80"><title>Linked overview</title><rect width="180" height="80" fill="#e6f4ec"/><text x="10" y="44">Whole-image link ↗</text></svg></a>
</article>`;
// `?techdocs` mimics TechDocs' rewriteDocLinks and addLinkClickListener
// transformers, which run before addons mount: plain `href` links are made
// absolute and same-site clicks are routed with history.pushState.
const techdocs = new URLSearchParams(location.search).has('techdocs');
const navigations: string[] = ((window as any).techdocsNavigations = []);
const transform = (content: Element) => {
  if (!techdocs) return;
  const base = new URL(location.href);
  if (!base.pathname.endsWith('/') && !base.pathname.endsWith('.html'))
    base.pathname += '/';
  for (const link of content.getElementsByTagName('a')) {
    const href = link.getAttribute('href');
    if (href) link.setAttribute('href', new URL(href, base).toString());
    link.addEventListener('click', (event) => {
      const url = link.getAttribute('href');
      if (!url?.startsWith(location.origin)) return;
      event.preventDefault();
      const parsed = new URL(url);
      navigations.push(url);
      if (parsed.hash && parsed.pathname === location.pathname) {
        history.pushState(null, document.title, parsed.hash);
        root.querySelector(`[id="${parsed.hash.slice(1)}"]`)?.scrollIntoView();
      } else history.pushState(null, document.title, url);
    });
  }
};
const install = () => installSvgViewer(root, { resolveXlinkHref: techdocs });
root.innerHTML = markup;
transform(root.querySelector('article')!);
let dispose = install();
document.querySelector('#replace')!.addEventListener('click', () => {
  const article = root.querySelector('article')!;
  article.innerHTML = `<h2>Next documentation page</h2>${diagram.replace('Order processing architecture', 'Next diagram')}`;
  transform(article);
});
document.querySelector('#dispose')!.addEventListener('click', () => dispose());
document.querySelector('#install')!.addEventListener('click', () => {
  dispose();
  dispose = install();
});
