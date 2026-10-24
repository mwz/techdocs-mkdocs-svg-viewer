export const viewerStyles = `
/* TechDocs exposes its Backstage palette through the same variables as Material
   for MkDocs. Inherit them so explicit theme choices and live changes both work. */
.tdsv, .tdsv-expand {
  --tdsv-background: var(--md-default-bg-color, #f2f4f8);
  --tdsv-surface: var(--md-default-bg-color, #fff);
  --tdsv-foreground: var(--md-default-fg-color, #192338);
  --tdsv-muted: var(--md-default-fg-color--light, #46536b);
  --tdsv-border: var(--md-default-fg-color--lighter, #bac4d5);
  --tdsv-grid: var(--md-default-fg-color--lightest, #c5ccda);
  --tdsv-hover: var(--md-accent-fg-color--transparent, #e9eff9);
  --tdsv-focus: var(--md-accent-fg-color, #1769e0);
}
.tdsv[data-theme="white"] {
  color-scheme: light;
  --tdsv-background: #f2f4f8;
  --tdsv-surface: #fff;
  --tdsv-foreground: #192338;
  --tdsv-muted: #46536b;
  --tdsv-border: #bac4d5;
  --tdsv-grid: #c5ccda;
  --tdsv-hover: #e9eff9;
  --tdsv-focus: #1769e0;
}
svg[data-techdocs-svg-viewer-ready] { cursor: zoom-in; }
svg[data-techdocs-svg-viewer-ready] a { cursor: pointer; }
button.tdsv-expand { display: inline-flex; align-items: center; gap: 6px; min-height: 44px; padding: 8px 12px; margin: 6px 0 12px; border: 1px solid var(--tdsv-border); border-radius: 7px; background: transparent; color: inherit; font: inherit; font-size: 14px; cursor: pointer; }
dialog.tdsv { box-sizing: border-box; position: fixed; inset: 0; margin: 0; border: 0; padding: 0; width: 100vw; height: 100dvh; max-width: none; max-height: none; background: var(--tdsv-background); color: var(--tdsv-foreground); font: 14px/1.5 system-ui, sans-serif; }
dialog.tdsv[open] { display: flex; flex-direction: column; }
.tdsv .tdsv-shell { display: flex; flex-direction: column; width: 100%; height: 100%; min-height: 0; background: var(--tdsv-background); }
.tdsv [hidden] { display: none !important; }
dialog.tdsv::backdrop { background: #0b1220d9; }
.tdsv .tdsv-toolbar { flex: 0 0 auto; display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 12px 16px; border-bottom: 1px solid var(--tdsv-border); background: var(--tdsv-surface); }
.tdsv .tdsv-title { margin: 0 auto 0 0; font: 600 16px/1.4 system-ui, sans-serif; max-width: min(35vw, 400px); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tdsv button { display: inline-flex; align-items: center; justify-content: center; flex: 0 0 auto; min-width: 44px; min-height: 44px; padding: 8px 12px; border: 1px solid var(--tdsv-border); border-radius: 7px; background: var(--tdsv-surface); color: var(--tdsv-foreground); font: 500 14px/1.4 system-ui, sans-serif; cursor: pointer; }
.tdsv .tdsv-theme { min-width: 112px; }
.tdsv button:hover { background: var(--tdsv-hover); }
.tdsv button:disabled { opacity: .4; cursor: default; }
.tdsv button:focus-visible, button.tdsv-expand:focus-visible, .tdsv a:focus-visible { outline: 3px solid var(--tdsv-focus); outline-offset: 3px; }
.tdsv .tdsv-zoom { min-width: 54px; text-align: center; font-variant-numeric: tabular-nums; }
.tdsv .tdsv-stage { position: relative; flex: 1 1 auto; min-height: 80px; overflow: hidden; touch-action: none; cursor: grab; background-color: var(--tdsv-background); background-image: radial-gradient(var(--tdsv-grid) 1px, transparent 1px); background-size: 20px 20px; }
.tdsv .tdsv-stage[data-dragging] { cursor: grabbing; user-select: none; }
.tdsv .tdsv-canvas { position: absolute; top: 0; left: 0; transform-origin: 0 0; background: var(--tdsv-surface); box-shadow: 0 4px 32px #16274818; }
.tdsv .tdsv-canvas > svg { display: block; }
.tdsv .tdsv-canvas a { cursor: pointer; }
.tdsv .tdsv-help { flex: 0 0 auto; margin: 0; padding: 10px 16px; font: 12px/1.5 system-ui, sans-serif; color: var(--tdsv-muted); background: var(--tdsv-surface); border-top: 1px solid var(--tdsv-border); }
.tdsv .tdsv-status { color: var(--tdsv-foreground); margin-left: 8px; }
@media (max-width: 600px) {
  .tdsv .tdsv-toolbar { padding: 8px; gap: 5px; }
  .tdsv .tdsv-title { width: 100%; max-width: none; }
  .tdsv button { padding: 8px; }
  .tdsv .tdsv-help { padding: 8px; }
}
@media (forced-colors: active) { .tdsv .tdsv-stage { background-image: none; } }
`;
