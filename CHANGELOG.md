# Changelog

## Unreleased

- The viewer toolbar includes a White theme button for diagrams that are hard to
  read against the host palette. Page theme restores the host palette. The
  browser saves the choice for all diagrams on the same website, separately from
  the page theme. SVG artwork, zoom and pan stay unchanged. If browser storage
  is unavailable, the choice applies only to the open viewer.

- Both standalone demo pages include a light/dark switcher. They start in light
  mode and save the selected theme in the browser.

- The standalone MkDocs example keeps the configured Material palette, and
  includes a light/dark toggle in the header. It uses `mkdocs serve` and loads
  `techdocs-core` only when Backstage builds the site.

- The SVG viewer follows the active TechDocs or Material for MkDocs theme. Added
  Settings to the Backstage example for switching between Light, Dark and Auto,
  with browser tests for theme selection and viewer colours.

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
