import overview from '../examples/mkdocs/docs/observatory.inline.svg?raw';
import processing from '../examples/mkdocs/docs/processing.inline.svg?raw';

// The development pages link to the file-compatible standalone example.
export const overviewDiagram = overview.replaceAll(
  'processing/',
  '/examples/standalone/processing.html',
);
export const processingDiagram = processing.replaceAll(
  '../',
  '/examples/standalone/index.html',
);
export const overviewContent = `<h2>Space observatory</h2>
<p>Expand the diagram, zoom in to read the descriptions and drag to follow the connections.</p>
${overviewDiagram}
<p><a href="/examples/standalone/processing.html">Explore the smaller science processing diagram</a>.</p>
<h3 id="data-note">Data note</h3><p>The raw archive retains uncalibrated detector exposures and observation metadata for reprocessing.</p>
<h3 id="archive-access">Archive access</h3><p>The archive serves raw and calibrated products with quality information, provenance and access rules.</p>
<p>This is a simplified fictional space mission, informed by <a href="https://jwst-docs.stsci.edu/jwst-science-calibration-pipeline">STScI</a> and <a href="https://science.nasa.gov/asset/webb/how-stsci-sends-commands-to-webb-and-receives-its-data/">NASA</a>.</p>`;
export const processingContent = `<h2>Science processing</h2>
<p>Follow the links in this smaller diagram to return to the observatory overview.</p>
${processingDiagram}
<h3 id="calibration">Calibration</h3><p>Apply detector and observing-mode corrections with versioned reference files. Imaging and spectroscopy use different processing branches.</p>
<h3 id="quality-review">Quality review</h3><p>Record uncertainties, quality flags and provenance. Retain raw data for reprocessing with new software or references.</p>
<p>This is a simplified fictional space mission, informed by <a href="https://jwst-docs.stsci.edu/jwst-science-calibration-pipeline">STScI</a> and <a href="https://science.nasa.gov/asset/webb/how-stsci-sends-commands-to-webb-and-receives-its-data/">NASA</a>.</p>`;
