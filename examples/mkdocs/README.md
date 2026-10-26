# MkDocs fixture

A MkDocs site with a large space observatory diagram and a smaller science
processing diagram on a second page. Diagram links connect both pages and their
sections. Poetry manages the Python dependencies. `mise install` in the
repository root installs Python and Poetry.

## Preview the viewer without Backstage

From the repository root:

```sh
pnpm example:mkdocs:dev
```

This builds the add-on, copies `dist/svg-viewer.js` to `docs/javascripts/`,
installs the Python dependencies, and runs:

```sh
poetry run mkdocs serve
```

Open <http://127.0.0.1:8000/> and click the diagram. To refresh only the script
while the server runs, use `pnpm example:mkdocs:prepare` in another terminal.
The copied script is ignored by Git, because it is a build output.

## Choose a theme

Use the sun or moon icon beside the search box to switch between light and dark
mode without reloading the page. The viewer follows the selected palette.
Material saves your choice in this browser. The first visit uses light mode.

The toggle uses the two entries under `theme.palette` in `mkdocs.yml`. To force
one theme and remove the toggle, replace the list with `scheme: slate` for dark
mode or `scheme: default` for light mode.

The standalone configuration does not load `techdocs-core`, because that plugin
clears the Material palette. Backstage adds it to its generated copy and uses
the theme selected in Backstage Settings instead.

To check both palettes and diagram navigation, run `pnpm example:mkdocs:test`
from the repository root after installing the Python dependencies and Chromium.
Use `pnpm exec playwright install --with-deps chromium` to install the browser.

## Build the site

```sh
pnpm example:mkdocs:prepare
cd examples/mkdocs
poetry install
poetry run mkdocs build
```

Make sure that `site/index.html` contains an inline `<svg>` for this diagram.
The [Backstage example](../backstage/README.md) registers this directory as
TechDocs through `catalog-info.yaml`.

To test the site in Backstage, run these commands from the repository root:

```sh
pnpm example:backstage:setup
pnpm example:backstage:dev
```

Open <http://localhost:3000/docs/default/component/svg-viewer-example> and sign
in as a guest. Backstage builds this site through the same Poetry environment.

The overview's **Calibration** node uses a relative legacy `xlink:href`
(`processing/?from=observatory#calibration`) to `docs/processing.md`. The
**Quality review** node uses a regular `href` to another section on that page.
The smaller diagram links back to the overview through both link formats. In
Backstage, these links open the destination without a full page reload.

Select **Raw archive** on the overview or **Calibration** on the smaller diagram
to test navigation within a page. Try each link with the viewer open and closed,
then use the browser's Back button. Both pages also appear in the site menu.

The SVG files in `docs` are the shared sources for all examples. After edits,
run `pnpm examples:sync` from the repository root to update the standalone HTML.
