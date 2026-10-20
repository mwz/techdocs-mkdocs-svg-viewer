import {
  diagramTitle,
  isInteractive,
  openViewer,
  type ViewerHandle,
  type ViewerRoot,
} from './dialog';
import { viewerStyles } from './styles';

export interface SvgViewerOptions {
  /** Query within the TechDocs shadow root. Only outermost SVGs are enhanced. */
  selector?: string;
  /** Skip small icons; data-svg-viewer="on" overrides these thresholds. */
  minWidth?: number;
  minHeight?: number;
  /** Zoom bounds relative to Fit (1 = 100%). Must include 1. */
  minZoom?: number;
  maxZoom?: number;
}

/** Install on a TechDocs shadow root, or a standalone MkDocs content container. */
export function installSvgViewer(
  root: ViewerRoot,
  options: SvgViewerOptions = {},
): () => void {
  const {
    selector = '.md-content__inner svg, article svg',
    minWidth = 80,
    minHeight = 40,
    minZoom = 0.25,
    maxZoom = 16,
  } = options;
  if (
    ![minWidth, minHeight, minZoom, maxZoom].every(Number.isFinite) ||
    minWidth < 0 ||
    minHeight < 0 ||
    minZoom <= 0 ||
    minZoom > 1 ||
    maxZoom < 1
  ) {
    throw new Error(
      'SVG viewer: finite non-negative dimensions and 0 < minZoom <= 1 <= maxZoom are required',
    );
  }
  root.querySelectorAll(selector); // Validate before installing listeners or CSS.
  const doc = root.ownerDocument;
  const win = doc.defaultView!;
  const style = doc.createElement('style');
  style.textContent = viewerStyles;
  root.append(style);
  const entries = new Map<
    SVGSVGElement,
    { button: HTMLButtonElement; marker: string | null }
  >();
  let active: ViewerHandle | undefined;
  let disposed = false;
  let frame = 0;
  const show = (svg: SVGSVGElement) => {
    const entry = entries.get(svg);
    if (!entry || active || disposed) return;
    active = openViewer(root, svg, entry.button, { minZoom, maxZoom }, () => {
      active = undefined;
    });
  };
  const restoreEntry = (svg: SVGSVGElement) => {
    const entry = entries.get(svg);
    if (!entry) return;
    entry.button.remove();
    if (entry.marker === null)
      svg.removeAttribute('data-techdocs-svg-viewer-ready');
    else svg.setAttribute('data-techdocs-svg-viewer-ready', entry.marker);
    entries.delete(svg);
  };
  const scan = () => {
    frame = 0;
    if (disposed) return;
    if (
      active &&
      (!root.contains(active.placeholder) || !root.contains(active.source))
    )
      active.close();
    for (const svg of entries.keys())
      if (!root.contains(svg)) restoreEntry(svg);
    for (const svg of root.querySelectorAll<SVGSVGElement>(selector)) {
      if (
        !(svg instanceof SVGSVGElement) ||
        entries.has(svg) ||
        svg.closest('.tdsv') ||
        svg.ownerSVGElement
      )
        continue;
      if (
        svg.closest(
          '[data-svg-viewer="off"], .md-icon, .twemoji, .emojione, button, [role="button"]',
        )
      )
        continue;
      const rect = svg.getBoundingClientRect();
      if (
        svg.getAttribute('data-svg-viewer') !== 'on' &&
        (rect.width < minWidth || rect.height < minHeight)
      )
        continue;
      const button = doc.createElement('button');
      button.type = 'button';
      button.className = 'tdsv-expand';
      button.textContent = '⤢  Expand diagram';
      button.setAttribute('aria-label', `Expand ${diagramTitle(svg)}`);
      button.setAttribute('aria-haspopup', 'dialog');
      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        show(svg);
      });
      const link = svg.closest('a');
      const anchor = link && root.contains(link) ? link : svg;
      anchor.after(button);
      entries.set(svg, {
        button,
        marker: svg.getAttribute('data-techdocs-svg-viewer-ready'),
      });
      svg.setAttribute('data-techdocs-svg-viewer-ready', '');
    }
  };
  const scheduleScan = () => {
    if (!frame && !disposed) frame = win.requestAnimationFrame(scan);
  };
  const click = (event: Event) => {
    if (
      !(event instanceof MouseEvent) ||
      event.button !== 0 ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.altKey ||
      event.defaultPrevented
    )
      return;
    if (
      !(event.target instanceof Element) ||
      isInteractive(event.target) ||
      event.target.closest('.tdsv')
    )
      return;
    let svg = event.target.closest('svg');
    while (svg?.ownerSVGElement) svg = svg.ownerSVGElement;
    if (svg && entries.has(svg)) {
      event.preventDefault();
      show(svg);
    }
  };
  root.addEventListener('click', click);
  const observer = new MutationObserver(scheduleScan);
  observer.observe(root, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['viewBox', 'width', 'height', 'class', 'data-svg-viewer'],
  });
  win.addEventListener('resize', scheduleScan);
  // Stylesheet loading is not a DOM mutation. Recheck diagrams that had no
  // measurable dimensions before the containing TechDocs styles were ready.
  root.addEventListener('load', scheduleScan, true);
  scan();
  return () => {
    disposed = true;
    observer.disconnect();
    win.cancelAnimationFrame(frame);
    win.removeEventListener('resize', scheduleScan);
    root.removeEventListener('load', scheduleScan, true);
    root.removeEventListener('click', click);
    active?.close();
    for (const svg of entries.keys()) restoreEntry(svg);
    style.remove();
  };
}
