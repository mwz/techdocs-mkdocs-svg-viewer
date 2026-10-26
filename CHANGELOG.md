# Changelog

## Unreleased

### Plugin functionality

- The Expand diagram button takes its own line and centres beneath the rendered
  diagram, including diagrams narrower than their content container. Its
  position follows diagram and container size changes. Host CSS can override the
  default layout with `.tdsv-expand` without `!important`.

- Standalone setup now finds inline SVGs anywhere in the supplied container by
  default. The TechDocs addon keeps its documentation selector. Set
  `window.svgViewerOptions` before loading `svg-viewer.js` to customise the
  selector, size thresholds and zoom limits. Existing direct
  `installSvgViewer()` calls that need the previous selection must pass
  `selector: '.md-content__inner svg, article svg'` explicitly.

- The viewer toolbar includes a White theme button for diagrams that are hard to
  read against the host palette. Page theme restores the host palette. The
  browser saves the choice for all diagrams on the same website, separately from
  the page theme. SVG artwork, zoom and pan stay unchanged. If browser storage
  is unavailable, the choice applies only to the open viewer.

- The SVG viewer follows the active TechDocs or Material for MkDocs theme.

### Other repository changes

- Added `pnpm screenshots` to rebuild the examples and capture all six README
  images in light and dark mode with fixed viewports and viewer zoom.

- All examples use a space observatory diagram with 30 nodes for zoom and pan. A
  second page has a smaller calibration diagram with links in both directions,
  including page sections, query strings and legacy SVG links. The fictional
  mission follows NASA and STScI descriptions of spacecraft communications,
  calibration and archive products, with sources and scope notes in the example.

- The local Backstage app enters as a guest automatically and opens the example
  documentation without a login screen. The catalogue remains available at
  `/catalog`. The reader waits for the example catalogue entry during startup so
  the first visit does not need a reload. Automatic guest sign-in also retries
  temporary connection failures while the backend starts.

- Added a static Backstage demo with the real TechDocs reader, SVG addon and
  appearance controls. Browser tests cover GitHub Pages paths, bookmarks,
  refreshes and SVG navigation without a backend. A GitHub Actions workflow
  builds and tests pull requests and deploys changes from `main`.

- Example commands use `example:<name>:<action>`, with `dev` to launch and
  `test` to run tests. Added `example:standalone:dev` and
  `example:standalone:test`. Renamed the MkDocs and Backstage commands to follow
  the same convention.

- Added standalone HTML instructions and a minimal example without MkDocs,
  Backstage or React.

- Both standalone demo pages include a light/dark switcher. They start in light
  mode and save the selected theme in the browser.

- The standalone MkDocs example keeps the configured Material palette, and
  includes a light/dark toggle in the header. It uses `mkdocs serve` and loads
  `techdocs-core` only when Backstage builds the site.

- Added Settings to the Backstage example for switching between Light, Dark and
  Auto, with browser tests for theme selection and viewer colours.

- Added a local Backstage 1.56.2 example with the SVG addon, guest sign-in,
  SQLite and the existing MkDocs site registered as TechDocs. Setup, build and
  browser test commands support local testing without Docker or external
  accounts. mise manages the tools for local development and the Backstage CI
  job.

## 0.2.0

- First public release. The project is open source under the Apache License 2.0
  and is published to npm. Snapshots of `main` are published with the `next`
  tag. The standalone `svg-viewer.js` can be loaded from jsDelivr.
- Renamed the repository to `techdocs-mkdocs-svg-viewer` and the package to
  `@mwz/techdocs-mkdocs-svg-viewer`, because it supports standalone MkDocs sites
  as well as Backstage TechDocs. Update the dependency and imports in your
  Backstage app. The Backstage plugin ID `techdocs-addon-svg-viewer` is
  unchanged.
- The package metadata now declares a TechDocs module (`frontend-plugin-module`,
  `pluginId: techdocs`), like other TechDocs addons. New frontend apps that use
  feature discovery load the `./alpha` module automatically.
- All peer dependencies are optional, so the `/viewer` entry point can be used
  without React or Backstage packages.
- Links with only `xlink:href` get a resolved `href`, so TechDocs routes them
  in-app instead of reloading the page (`resolveXlinkHref`, on in the addon).
- The viewer closes when TechDocs routes a link clicked in it, including
  same-page `#fragment` links, which fire no `hashchange`.
- Mermaid diagrams are skipped.
- Hover and other interactive styles in the TechDocs shadow root, for example
  from a custom styles addon, now apply in the viewer. The viewer no longer sets
  every presentation property inline as `!important`. It sets inline only the
  values that changed when the SVG moved into the viewer. Hover styles that are
  active when you click to open the viewer do not stay on in the viewer.
- `dist/svg-viewer.js`: a self-contained drop-in script for MkDocs sites outside
  Backstage, loaded with `extra_javascript`.
- `pnpm example:serve` previews `examples/mkdocs` with the drop-in script via
  Poetry and `techdocs-cli serve:mkdocs`. `@techdocs/cli` is a development
  dependency, and the example uses Poetry instead of `requirements.txt`.
- The demo's `?techdocs` mode simulates TechDocs link handling for browser
  tests.

## 0.1.0

- Initial Backstage TechDocs addon for inline SVG diagrams.
- Full-window modal, optional browser fullscreen, pointer/touch zoom and pan,
  accessible buttons and keyboard controls.
- Original SVG nodes and embedded links retained throughout expansion.
- Legacy and new frontend registrations, standalone controller, local demo,
  MkDocs example, browser tests and CI.
