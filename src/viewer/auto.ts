import { installSvgViewer, type SvgViewerOptions } from '.';

// Drop-in entry for HTML pages and MkDocs sites (built to dist/svg-viewer.js).
// Inside Backstage, TechDocs strips <script> tags and the addon takes over.
declare global {
  interface Window {
    /** Set before loading svg-viewer.js. Read once when the viewer installs. */
    svgViewerOptions?: SvgViewerOptions;
    /** Set once the viewer is installed. Call it to remove the viewer. */
    disposeSvgViewer?: () => void;
  }
}

// Material's instant navigation swaps content but keeps <body>, so one install
// covers every page. The guard makes loading the script twice harmless.
const start = () => {
  window.disposeSvgViewer ??= installSvgViewer(
    document.body,
    window.svgViewerOptions,
  );
};
if (document.readyState === 'loading')
  document.addEventListener('DOMContentLoaded', start, { once: true });
else start();
