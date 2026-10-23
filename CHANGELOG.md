# Changelog

## Unreleased

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
