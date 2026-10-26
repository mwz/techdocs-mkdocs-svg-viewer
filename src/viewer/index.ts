import {
  diagramTitle,
  isInteractive,
  openViewer,
  type ViewerHandle,
  type ViewerRoot,
} from './dialog';
import { viewerStyles } from './styles';

export interface SvgViewerOptions {
  /** Query within the supplied container. Only outermost SVGs are enhanced. */
  selector?: string;
  /** Skip small icons; data-svg-viewer="on" overrides these thresholds. */
  minWidth?: number;
  minHeight?: number;
  /** Zoom bounds relative to Fit (1 = 100%). Must include 1. */
  minZoom?: number;
  maxZoom?: number;
  /**
   * Copy legacy `xlink:href` links into `href`, resolved like TechDocs resolves
   * document links, so TechDocs routes them in-app. The addon enables this.
   */
  resolveXlinkHref?: boolean;
}

const XLINK = 'http://www.w3.org/1999/xlink';

// Mirrors TechDocs' rewriteDocLinks: pages resolve as directories unless *.html.
function pageBase(href: string): URL {
  const url = new URL(href);
  if (!url.pathname.endsWith('/') && !url.pathname.endsWith('.html'))
    url.pathname += '/';
  return url;
}

/** Install on an HTML container or a TechDocs shadow root. */
export function installSvgViewer(
  root: ViewerRoot,
  options: SvgViewerOptions = {},
): () => void {
  const {
    selector = 'svg',
    minWidth = 80,
    minHeight = 40,
    minZoom = 0.25,
    maxZoom = 16,
    resolveXlinkHref = false,
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
    {
      button: HTMLButtonElement;
      marker: string | null;
      resizeTargets: Element[];
    }
  >();
  const resizeTargets = new Map<Element, number>();
  const resize = new ResizeObserver(() => scheduleScan());
  const observeSize = (element: Element) => {
    const count = resizeTargets.get(element) ?? 0;
    if (!count) resize.observe(element);
    resizeTargets.set(element, count + 1);
  };
  const unobserveSize = (element: Element) => {
    const count = resizeTargets.get(element)! - 1;
    if (count) resizeTargets.set(element, count);
    else {
      resize.unobserve(element);
      resizeTargets.delete(element);
    }
  };
  const addedHrefs = new Set<Element>();
  const resolveLinks = (svg: SVGSVGElement) => {
    let base: URL | undefined;
    for (const link of svg.querySelectorAll('a')) {
      const value = link.getAttributeNS(XLINK, 'href');
      if (value === null || link.hasAttribute('href')) continue;
      try {
        base ??= pageBase(win.location.href);
        link.setAttribute('href', new URL(value, base).toString());
        addedHrefs.add(link);
      } catch {
        // Leave unparsable values to the browser's native xlink handling.
      }
    }
  };
  let active: ViewerHandle | undefined;
  let disposed = false;
  let frame = 0;
  const show = (svg: SVGSVGElement) => {
    const entry = entries.get(svg);
    if (!entry || active || disposed) return;
    active = openViewer(root, svg, entry.button, { minZoom, maxZoom }, () => {
      active = undefined;
      scheduleScan();
    });
  };
  const restoreEntry = (svg: SVGSVGElement) => {
    const entry = entries.get(svg);
    if (!entry) return;
    entry.resizeTargets.forEach(unobserveSize);
    entry.button.remove();
    if (entry.marker === null)
      svg.removeAttribute('data-techdocs-svg-viewer-ready');
    else svg.setAttribute('data-techdocs-svg-viewer-ready', entry.marker);
    entries.delete(svg);
  };
  const alignButton = (svg: SVGSVGElement, button: HTMLButtonElement) => {
    // The source is temporarily in the dialog. Keep the page button in place
    // until the source returns, then measure its restored layout.
    if (active?.source === svg) return;
    const diagram = svg.getBoundingClientRect();
    const control = button.getBoundingClientRect();
    if (!diagram.width || !control.width) return;
    const computed = win.getComputedStyle(button);
    const borderBoxWidth =
      parseFloat(computed.width) +
      (computed.boxSizing === 'border-box'
        ? 0
        : parseFloat(computed.paddingLeft) +
          parseFloat(computed.paddingRight) +
          parseFloat(computed.borderLeftWidth) +
          parseFloat(computed.borderRightWidth));
    // Rectangles include ancestor scaling, while margins use local CSS pixels.
    const scale = control.width / borderBoxWidth;
    const rtl = computed.direction === 'rtl';
    const delta =
      diagram.left + diagram.width / 2 - control.left - control.width / 2;
    const offset =
      (parseFloat(rtl ? computed.marginRight : computed.marginLeft) || 0) +
      (rtl ? -delta : delta) / scale;
    const previous = parseFloat(
      button.style.getPropertyValue('--tdsv-expand-offset'),
    );
    if (
      Number.isFinite(offset) &&
      (!Number.isFinite(previous) || Math.abs(offset - previous) > 0.01)
    ) {
      // Only expose a measurement. A host's margin rule remains in control.
      button.style.setProperty('--tdsv-expand-offset', `${offset}px`);
    }
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
          '[data-svg-viewer="off"], .md-icon, .twemoji, .emojione, .mermaid, button, [role="button"]',
        ) ||
        svg.id.startsWith('mermaid')
      )
        continue;
      if (resolveXlinkHref) resolveLinks(svg);
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
      const targets = [svg, button, button.parentElement!];
      targets.forEach(observeSize);
      entries.set(svg, {
        button,
        marker: svg.getAttribute('data-techdocs-svg-viewer-ready'),
        resizeTargets: targets,
      });
      svg.setAttribute('data-techdocs-svg-viewer-ready', '');
    }
    for (const [svg, { button }] of entries) alignButton(svg, button);
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
    attributeFilter: [
      'viewBox',
      'width',
      'height',
      'class',
      'style',
      'data-svg-viewer',
    ],
  });
  win.addEventListener('resize', scheduleScan);
  // Stylesheet loading is not a DOM mutation. Recheck diagrams that had no
  // measurable dimensions before the containing TechDocs styles were ready.
  root.addEventListener('load', scheduleScan, true);
  scan();
  return () => {
    disposed = true;
    observer.disconnect();
    resize.disconnect();
    win.cancelAnimationFrame(frame);
    win.removeEventListener('resize', scheduleScan);
    root.removeEventListener('load', scheduleScan, true);
    root.removeEventListener('click', click);
    active?.close();
    for (const svg of entries.keys()) restoreEntry(svg);
    for (const link of addedHrefs) link.removeAttribute('href');
    style.remove();
  };
}
