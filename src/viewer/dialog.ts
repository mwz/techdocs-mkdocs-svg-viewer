import {
  clamp,
  fitCamera,
  transformAt,
  type Camera,
  type Point,
  type Size,
} from './geometry';

export type ViewerRoot = ShadowRoot | HTMLElement;
export interface DialogOptions {
  minZoom: number;
  maxZoom: number;
}
export interface ViewerHandle {
  close: () => void;
  source: SVGSVGElement;
  placeholder: HTMLElement;
}

// Freeze context-dependent presentation before moving the SAME node. This keeps
// IDs, definitions, DOM listeners and native links without cloning/reparsing HTML.
const presentation = [
  'color',
  'fill',
  'fill-opacity',
  'fill-rule',
  'stroke',
  'stroke-width',
  'stroke-opacity',
  'stroke-dasharray',
  'stroke-dashoffset',
  'stroke-linecap',
  'stroke-linejoin',
  'stroke-miterlimit',
  'font-family',
  'font-size',
  'font-weight',
  'font-style',
  'letter-spacing',
  'word-spacing',
  'text-anchor',
  'text-decoration',
  'dominant-baseline',
  'visibility',
  'opacity',
  'paint-order',
  'vector-effect',
  'marker-start',
  'marker-mid',
  'marker-end',
  'clip-path',
  'mask',
  'filter',
  'stop-color',
  'stop-opacity',
  'flood-color',
  'flood-opacity',
  'lighting-color',
] as const;

export function diagramTitle(svg: SVGSVGElement): string {
  return (
    svg.getAttribute('aria-label') ||
    svg.querySelector(':scope > title')?.textContent?.trim() ||
    'SVG diagram'
  );
}

function contentSize(svg: SVGSVGElement): Size {
  const vb = svg.viewBox.baseVal;
  if (vb.width > 0 && vb.height > 0)
    return { width: vb.width, height: vb.height };
  const rect = svg.getBoundingClientRect();
  return { width: Math.max(1, rect.width), height: Math.max(1, rect.height) };
}

export function isInteractive(target: EventTarget | null): boolean {
  return (
    target instanceof Element &&
    !!target.closest(
      'a, button, input, textarea, select, summary, [contenteditable="true"], [role="button"]',
    )
  );
}

export function openViewer(
  root: ViewerRoot,
  source: SVGSVGElement,
  opener: HTMLElement,
  options: DialogOptions,
  onClose: () => void,
): ViewerHandle {
  const doc = source.ownerDocument;
  const win = doc.defaultView!;
  const size = contentSize(source);
  const sourceRect = source.getBoundingClientRect();
  const savedStyles = new Map<SVGElement, string | null>();
  const snapshots: Array<[SVGElement, Array<[string, string]>]> = [];
  for (const node of [source, ...source.querySelectorAll<SVGElement>('*')]) {
    if (!(node instanceof SVGElement)) continue;
    savedStyles.set(node, node.getAttribute('style'));
    const computed = win.getComputedStyle(node);
    snapshots.push([
      node,
      presentation.map((key) => [key, computed.getPropertyValue(key)]),
    ]);
  }
  for (const [node, properties] of snapshots) {
    for (const [key, value] of properties)
      if (value) node.style.setProperty(key, value, 'important');
  }
  const placeholder = doc.createElement('span');
  placeholder.setAttribute('aria-hidden', 'true');
  placeholder.style.cssText = `display:inline-block;width:${sourceRect.width}px;height:${sourceRect.height}px;visibility:hidden`;
  source.before(placeholder);
  const dialog = doc.createElement('dialog');
  dialog.className = 'tdsv';
  dialog.setAttribute(
    'aria-label',
    `${diagramTitle(source)} — expanded viewer`,
  );
  // A <dialog> itself is not an eligible Fullscreen API target. Its child
  // shell contains both the canvas and controls and can enter fullscreen.
  const shell = doc.createElement('div');
  shell.className = 'tdsv-shell';
  const toolbar = doc.createElement('div');
  toolbar.className = 'tdsv-toolbar';
  const title = doc.createElement('h2');
  title.className = 'tdsv-title';
  title.textContent = diagramTitle(source);
  toolbar.append(title);
  const button = (label: string, text: string, action: () => void) => {
    const el = doc.createElement('button');
    el.type = 'button';
    el.setAttribute('aria-label', label);
    el.title = label;
    el.textContent = text;
    el.addEventListener('click', action);
    toolbar.append(el);
    return el;
  };
  const stage = doc.createElement('div');
  stage.className = 'tdsv-stage';
  stage.setAttribute('aria-label', 'Diagram canvas');
  const canvas = doc.createElement('div');
  canvas.className = 'tdsv-canvas';
  canvas.style.width = `${size.width}px`;
  canvas.style.height = `${size.height}px`;
  let camera: Camera = { x: 0, y: 0, scale: 1 };
  let fittedScale = 1;
  let followingFit = true;
  let closed = false;
  let resize: ResizeObserver | undefined;
  const viewport = () => ({
    width: stage.clientWidth,
    height: stage.clientHeight,
  });
  const centre = () => ({
    x: stage.clientWidth / 2,
    y: stage.clientHeight / 2,
  });
  const local = (event: { clientX: number; clientY: number }): Point => {
    const rect = stage.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };
  const paint = () => {
    canvas.style.transform = `translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})`;
    const zoom = camera.scale / fittedScale;
    zoomLabel.textContent = `${Math.round(zoom * 100)}%`;
    zoomOut.disabled = zoom <= options.minZoom + 0.00001;
    zoomIn.disabled = zoom >= options.maxZoom - 0.00001;
  };
  const zoomAt = (factor: number, point = centre()) => {
    const scale = clamp(
      camera.scale * factor,
      fittedScale * options.minZoom,
      fittedScale * options.maxZoom,
    );
    camera = transformAt(camera, point, point, scale);
    followingFit = false;
    paint();
  };
  const fit = () => {
    camera = fitCamera(size, viewport());
    fittedScale = camera.scale;
    followingFit = true;
    paint();
  };
  const pan = (x: number, y: number) => {
    camera = { ...camera, x: camera.x + x, y: camera.y + y };
    followingFit = false;
    paint();
  };
  const zoomOut = button('Zoom out', '−', () => zoomAt(1 / 1.25));
  const zoomLabel = doc.createElement('output');
  zoomLabel.className = 'tdsv-zoom';
  zoomLabel.setAttribute('aria-label', 'Zoom relative to fit');
  zoomLabel.setAttribute('aria-live', 'polite');
  toolbar.append(zoomLabel);
  const zoomIn = button('Zoom in', '+', () => zoomAt(1.25));
  button('Fit diagram (0)', 'Fit', fit);
  button('Pan left', '←', () => pan(80, 0));
  button('Pan up', '↑', () => pan(0, 80));
  button('Pan down', '↓', () => pan(0, -80));
  button('Pan right', '→', () => pan(-80, 0));
  const fullscreenElement = () =>
    root instanceof ShadowRoot ? root.fullscreenElement : doc.fullscreenElement;
  const fullscreen = button('Enter fullscreen', 'Fullscreen', () => {
    const operation =
      fullscreenElement() === shell
        ? doc.exitFullscreen()
        : shell.requestFullscreen();
    operation.catch(() => {
      status.textContent =
        'Browser fullscreen unavailable; the viewer still fills the window.';
    });
  });
  fullscreen.hidden = !doc.fullscreenEnabled || !shell.requestFullscreen;
  const updateFullscreen = () => {
    const active = fullscreenElement() === shell;
    fullscreen.textContent = active ? 'Exit fullscreen' : 'Fullscreen';
    fullscreen.setAttribute(
      'aria-label',
      active ? 'Exit fullscreen' : 'Enter fullscreen',
    );
  };
  doc.addEventListener('fullscreenchange', updateFullscreen);
  const close = () => {
    if (closed) return;
    closed = true;
    resize?.disconnect();
    doc.removeEventListener('fullscreenchange', updateFullscreen);
    win.removeEventListener('popstate', close);
    win.removeEventListener('hashchange', close);
    if (fullscreenElement() === shell)
      void doc.exitFullscreen().catch(() => {});
    if (placeholder.parentNode) placeholder.replaceWith(source);
    for (const [node, style] of savedStyles) {
      if (style === null) node.removeAttribute('style');
      else node.setAttribute('style', style);
    }
    if (originalViewBox === null) source.removeAttribute('viewBox');
    else source.setAttribute('viewBox', originalViewBox);
    if (dialog.open) dialog.close();
    dialog.remove();
    if (opener.isConnected) opener.focus({ preventScroll: true });
    onClose();
  };
  const closeButton = button('Close viewer (Escape)', 'Close', close);
  closeButton.autofocus = true;
  const help = doc.createElement('p');
  help.className = 'tdsv-help';
  help.textContent =
    'Scroll or pinch to zoom · Drag to pan · + / − zoom · Arrow keys pan · 0 fits · Esc closes · Links remain clickable';
  const status = doc.createElement('span');
  status.className = 'tdsv-status';
  status.setAttribute('role', 'status');
  help.append(status);
  shell.append(toolbar, stage, help);
  dialog.append(shell);
  stage.append(canvas);
  const originalViewBox = source.getAttribute('viewBox');
  if (
    !originalViewBox ||
    source.viewBox.baseVal.width <= 0 ||
    source.viewBox.baseVal.height <= 0
  ) {
    // Synthesise a viewport only when absent. Existing non-zero origins survive.
    source.setAttribute('viewBox', `0 0 ${size.width} ${size.height}`);
  }
  for (const [key, value] of Object.entries({
    width: '100%',
    height: '100%',
    maxWidth: 'none',
    maxHeight: 'none',
    minWidth: '0',
    minHeight: '0',
    margin: '0',
    cursor: 'inherit',
  })) {
    const property = key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
    source.style.setProperty(property, value, 'important');
  }
  canvas.append(source);
  root.append(dialog);

  // Pointer capture begins only AFTER movement, otherwise a simple click on an
  // SVG <a> gets retargeted to the canvas and its native navigation is lost.
  const pointers = new Map<number, Point>();
  let gesture:
    | { start: Point; camera: Camera; distance?: number; dragged: boolean }
    | undefined;
  let suppressClick = false;
  const pair = () => {
    const values = [...pointers.values()];
    const a = values[0]!;
    const b = values[1] ?? a;
    return {
      midpoint: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
      distance: Math.max(1, Math.hypot(b.x - a.x, b.y - a.y)),
    };
  };
  const rebase = (dragged = false) => {
    const { midpoint, distance } = pair();
    gesture = {
      start: midpoint,
      camera: { ...camera },
      distance: pointers.size >= 2 ? distance : undefined,
      dragged,
    };
  };
  stage.addEventListener('pointerdown', (event) => {
    if (
      event.button !== 0 ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      event.shiftKey
    )
      return;
    if (!pointers.size) suppressClick = false;
    pointers.set(event.pointerId, local(event));
    rebase(pointers.size >= 2);
  });
  stage.addEventListener('pointermove', (event) => {
    if (!pointers.has(event.pointerId) || !gesture) return;
    pointers.set(event.pointerId, local(event));
    const { midpoint, distance } = pair();
    if (
      !gesture.dragged &&
      Math.hypot(midpoint.x - gesture.start.x, midpoint.y - gesture.start.y) < 5
    )
      return;
    gesture.dragged = true;
    suppressClick = true;
    stage.setAttribute('data-dragging', '');
    for (const id of pointers.keys())
      if (!stage.hasPointerCapture(id)) stage.setPointerCapture(id);
    event.preventDefault();
    const scale = gesture.distance
      ? clamp(
          (gesture.camera.scale * distance) / gesture.distance,
          fittedScale * options.minZoom,
          fittedScale * options.maxZoom,
        )
      : gesture.camera.scale;
    camera = transformAt(gesture.camera, gesture.start, midpoint, scale);
    followingFit = false;
    paint();
  });
  const endPointer = (event: PointerEvent) => {
    if (!pointers.has(event.pointerId)) return;
    pointers.delete(event.pointerId);
    if (stage.hasPointerCapture(event.pointerId))
      stage.releasePointerCapture(event.pointerId);
    if (pointers.size) rebase(true);
    else {
      gesture = undefined;
      stage.removeAttribute('data-dragging');
    }
  };
  stage.addEventListener('pointerup', endPointer);
  stage.addEventListener('pointercancel', endPointer);
  stage.addEventListener('lostpointercapture', endPointer);
  stage.addEventListener('pointerleave', (event) => {
    if (!stage.hasPointerCapture(event.pointerId)) endPointer(event);
  });
  stage.addEventListener(
    'click',
    (event) => {
      if (suppressClick && event.detail !== 0) {
        event.preventDefault();
        event.stopImmediatePropagation();
        suppressClick = false;
      }
    },
    true,
  );
  // TechDocs routes same-site links itself (history.pushState plus a scroll for
  // fragments), which fires no hashchange/popstate. A plain click it took over
  // means the page behind the viewer is the destination, so get out of the way.
  canvas.addEventListener('click', (event) => {
    if (
      event.defaultPrevented &&
      event.button === 0 &&
      !(event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) &&
      event.target instanceof Element &&
      event.target.closest('a')
    )
      close();
  });
  stage.addEventListener('dragstart', (event) => event.preventDefault());
  stage.addEventListener(
    'wheel',
    (event) => {
      event.preventDefault();
      event.stopPropagation();
      const delta =
        event.deltaY *
        (event.deltaMode === 1
          ? 16
          : event.deltaMode === 2
            ? stage.clientHeight
            : 1);
      zoomAt(Math.exp(-clamp(delta, -500, 500) * 0.002), local(event));
    },
    { passive: false },
  );
  dialog.addEventListener('keydown', (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key === 'Tab') {
      // Keep tabbing inside the dialog, including SVG links. Native modal
      // inertness alone can still move focus into browser chrome on wrap.
      const focusable = [
        ...dialog.querySelectorAll<HTMLElement | SVGElement>(
          'button, a[href], a[*|href], input, select, textarea, [tabindex]',
        ),
      ].filter(
        (el) =>
          el.tabIndex >= 0 &&
          !el.hasAttribute('disabled') &&
          !el.closest('[hidden]') &&
          el.getClientRects().length > 0 &&
          win.getComputedStyle(el).visibility !== 'hidden',
      );
      const focused =
        root instanceof ShadowRoot ? root.activeElement : doc.activeElement;
      const first = focusable[0];
      const last = focusable.at(-1);
      if (
        event.shiftKey &&
        (focused === first || !focused || focused === dialog)
      ) {
        event.preventDefault();
        last?.focus();
      } else if (
        !event.shiftKey &&
        (focused === last || !focused || focused === dialog)
      ) {
        event.preventDefault();
        first?.focus();
      }
      return;
    }
    // Enter/Space on links and buttons retain native semantics.
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (
      isInteractive(event.target) &&
      event.target instanceof Element &&
      !event.target.closest('.tdsv-toolbar')
    )
      return;
    const step = event.shiftKey ? 160 : 40;
    const actions: Record<string, () => void> = {
      '+': () => zoomAt(1.25),
      '=': () => zoomAt(1.25),
      '-': () => zoomAt(1 / 1.25),
      '0': fit,
      Home: fit,
      ArrowLeft: () => pan(step, 0),
      ArrowRight: () => pan(-step, 0),
      ArrowUp: () => pan(0, step),
      ArrowDown: () => pan(0, -step),
    };
    const action = actions[event.key];
    if (action) {
      event.preventDefault();
      action();
    }
  });
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    close();
  });
  dialog.addEventListener('close', close);
  win.addEventListener('popstate', close);
  win.addEventListener('hashchange', close);
  try {
    dialog.showModal();
    fit();
    closeButton.focus();
  } catch (error) {
    close();
    throw error;
  }
  let previousViewport = viewport();
  resize = new ResizeObserver(() => {
    const next = viewport();
    if (
      next.width === previousViewport.width &&
      next.height === previousViewport.height
    )
      return;
    const before = previousViewport;
    previousViewport = next;
    if (followingFit) fit();
    else {
      const zoom = camera.scale / fittedScale;
      fittedScale = fitCamera(size, next).scale;
      camera = transformAt(
        camera,
        { x: before.width / 2, y: before.height / 2 },
        centre(),
        fittedScale * zoom,
      );
      paint();
    }
  });
  resize.observe(stage);
  return { close, source, placeholder };
}
