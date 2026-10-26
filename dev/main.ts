import { installSvgViewer } from '../src/viewer';
import { overviewContent, processingContent } from './diagrams';

const root = document.querySelector('#docs')!.attachShadow({ mode: 'open' });
// Trusted, repository-owned examples; production never parses SVG strings.
root.innerHTML = `<style>
:host{color:var(--md-default-fg-color)}article{font:16px/1.6 system-ui}article>svg{display:block;max-width:100%;height:auto}a{color:var(--md-accent-fg-color)}
</style><article class="md-content__inner">${overviewContent}</article>`;
let dispose = installSvgViewer(root);
document.querySelector('#replace')!.addEventListener('click', () => {
  root.querySelector('article')!.innerHTML = processingContent;
});
document.querySelector('#dispose')!.addEventListener('click', () => dispose());
document.querySelector('#install')!.addEventListener('click', () => {
  dispose();
  dispose = installSvgViewer(root);
});
