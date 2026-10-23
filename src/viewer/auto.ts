import { installSvgViewer } from '.';

// Drop-in entry for MkDocs sites outside Backstage (built to dist/svg-viewer.js
// for `extra_javascript`). Inside Backstage, TechDocs strips <script> tags and
// the addon takes over instead.
declare global {
  interface Window {
    /** Set once the viewer is installed. Call it to remove the viewer. */
    disposeSvgViewer?: () => void;
  }
}

// Material's instant navigation swaps content but keeps <body>, so one install
// covers every page. The guard makes loading the script twice harmless.
const start = () => {
  window.disposeSvgViewer ??= installSvgViewer(document.body);
};
if (document.readyState === 'loading')
  document.addEventListener('DOMContentLoaded', start, { once: true });
else start();
