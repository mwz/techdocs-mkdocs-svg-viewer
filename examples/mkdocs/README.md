# MkDocs fixture

A small TechDocs site with one inlined diagram. Python dependencies are managed
with Poetry. `mise install` in the repository root installs Python and Poetry.
`pnpm install` in the repository root installs
[`techdocs-cli`](https://backstage.io/docs/features/techdocs/cli/) as a
development dependency.

## Preview the viewer without Backstage

From the repository root:

```sh
pnpm example:serve
```

This builds the add-on, copies `dist/svg-viewer.js` to `docs/javascripts/`,
installs the Python dependencies, and runs:

```sh
poetry run techdocs-cli serve:mkdocs -v --no-docker
```

Open <http://127.0.0.1:8000/> and click the diagram. To refresh only the script
while the server runs, use `pnpm example:prepare` in another terminal. The
copied script is ignored by Git, because it is a build output.

## Build the site

```sh
pnpm example:prepare
cd examples/mkdocs
poetry install
poetry run mkdocs build
```

Inspect `site/index.html`: it should contain an inline `<svg>`, rather than an
`<img>` for this diagram. Publish it through your normal TechDocs pipeline to
smoke-test the Backstage integration.

The diagram's **Order service** node uses a relative legacy `xlink:href`
(`order-service/#orders`) to `docs/order-service.md`. In Backstage, clicking it
should open that page without a full page reload.
