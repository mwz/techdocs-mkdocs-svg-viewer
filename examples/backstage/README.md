# Backstage examples

This app runs the SVG viewer in a real Backstage TechDocs reader. It uses
Backstage 1.56.2, the latest stable release on 24 October 2026, from the
[official release manifest](https://versions.backstage.io/v1/tags/main/manifest.json).
The package versions and `yarn.lock` keep the installation repeatable.

The app includes the catalogue, TechDocs, search and automatic guest access.
SQLite holds the catalogue in memory. TechDocs builds the existing
`examples/mkdocs` site locally and stores its output in
`examples/backstage/.cache/techdocs`. You do not need Docker, PostgreSQL, GitHub
credentials or a cloud account.

The static demo in `packages/demo` uses the same reader, addon and
documentation. GitHub Pages can serve this demo without a backend. See
[Static demo](#static-demo) for local preview and deployment instructions.

## Run the app

Use Node 24, pnpm 11.25.0, Yarn 4.13.0, Python 3.12 and Poetry 2.1.1. The
repository's `mise.toml` supplies all five tools. Activate mise in your shell
before you run the commands below. If you use a shell without mise activation,
prefix each `pnpm` command with `mise exec --`.

From the repository root, run:

```sh
mise install
pnpm install --frozen-lockfile
pnpm example:backstage:setup
pnpm example:backstage:dev
```

The setup command installs the locked JavaScript and Python dependencies. The
first installation can take several minutes. If SQLite needs to compile on your
platform, install Python, Make and a C++ compiler first.

Open <http://localhost:3000/>. The app signs in as a guest automatically and
redirects to `/docs/default/component/svg-viewer-example`. The first visit waits
for the example to appear in the catalogue, then builds the documentation. The
catalogue remains available at `/catalog` and through the sidebar. Press Ctrl+C
in the terminal to stop the app.

Both servers listen on the loopback interface. The frontend uses port 3000, and
the backend uses port 7007. Keep these ports free before you start. This
configuration is for local development. The frontend obtains guest credentials
from the backend without a login screen. Catalogue data resets when the backend
restarts.

## Switch between light and dark themes

Open Settings in the sidebar. Under General, find Appearance and select Light,
Dark or Auto. Auto follows your operating system's colour preference. Backstage
saves your choice in this browser.

Return to Docs and open the SVG viewer. Its controls and background follow the
selected theme. Colours defined inside the SVG remain part of the artwork. You
can switch themes without changing the app configuration or restarting it.

## Test a change

After you change the plugin, stop the app and run `pnpm example:backstage:dev`
again. This command rebuilds the plugin and copies its output into
`examples/backstage/packages/svg-viewer`. This generated package resolves React
and Backstage dependencies from the example app. It does not link to the
repository's pnpm dependencies or use the published npm package.

If you change the plugin's dependencies or package metadata, run
`pnpm example:backstage:setup` again. If the change requires a new lockfile, run
`yarn install` from `examples/backstage` and commit `yarn.lock`.

Edit documentation in `examples/mkdocs/docs`, then restart with
`pnpm example:backstage:dev`. This command copies the documentation into
`examples/backstage/.cache/mkdocs` before Backstage starts. TechDocs modifies
the copied configuration during generation. The source stays unchanged, and the
copy excludes the Poetry environment's external symlinks.

Backstage adds `techdocs-core` to this copy. The standalone configuration omits
it so that Material's light and dark palettes work outside Backstage.

The app configuration allows the local `inline-select-svg` MkDocs plugin.
Current TechDocs removes additional plugins unless the backend allows them.
TechDocs also removes the standalone script, so this app uses the registered
React addon.

Try these actions in the diagram:

1. Select Expand Space observatory architecture and use the zoom and pan
   controls.
2. Press Escape and make sure that focus returns to the expand button.
3. Open the viewer and select Calibration to open the science processing page.
4. Expand the smaller diagram and select Science archive to return to the
   overview.
5. Select Raw archive to follow its page fragment.
6. Use the browser's Back button and refresh the science processing page.
7. Make sure that each diagram has one expand button.

After the setup command, run the automated checks from the repository root:

```sh
pnpm example:backstage:check
pnpm exec playwright install --with-deps chromium
pnpm example:backstage:test
```

The first command checks TypeScript and Backstage configuration, then builds the
frontend. The browser test starts the app, enters without a login screen, builds
TechDocs, opens the viewer and follows SVG links without a full page reload. It
also switches between dark and light themes through Settings. It reuses an app
already running on port 3000 outside CI.

## Files and updates

`packages/app/src/App.tsx` registers the new frontend module explicitly. Package
discovery is disabled, so the module loads once. The backend includes only
authentication, the catalogue, TechDocs and the local Lunr search engine.

The app wraps `ProxiedSignInPage` for the `guest` provider in `GuestSignInPage`.
It retries connection failures and temporary gateway or service errors for up to
30 seconds while the backend starts. Other sign-in errors appear immediately. If
sign-in fails, use Try again without reloading the page. Backstage obtains and
refreshes guest credentials automatically. The backend keeps its normal
authentication checks.

`ExampleDocsReady.tsx` waits for the example entry before it opens the TechDocs
reader. This prevents a 404 while the catalogue starts. It retries missing-entry
responses for up to 30 seconds and provides a retry button if the entry stays
unavailable. Other errors appear immediately.

`../mkdocs/catalog-info.yaml` registers the existing documentation with
`backstage.io/techdocs-ref: dir:.`. The preparation script copies this file with
the documentation. The catalogue path in `app-config.yaml` points to that copy,
relative to `packages/backend`. The Backstage CLI starts the backend there. The
start script adds the Poetry environment to the backend's `PATH`.

This directory is a separate Yarn workspace. The repository's normal pnpm
installation and `pnpm check` do not install or run Backstage. Generated
packages, caches, documentation output and dependencies are ignored by Git. To
remove the generated documentation, stop the app and delete
`examples/backstage/.cache/techdocs`.

To update Backstage, use `yarn backstage-cli versions:bump` from this directory.
Review the package and lockfile changes, then run the checks above. Update the
version and date in this README after testing the new release.

## Static demo

The demo opens the example documentation without sign-in. The real TechDocs
reader loads generated HTML and the SVG addon from this checkout. Settings
provides the normal Backstage appearance controls.

The demo uses a fixed catalogue entity and custom TechDocs APIs. These APIs read
files from the same website. The demo answers the reader's cookie request in
memory and does not contact a backend. Search, catalogue editing and
authentication are not included.

After the setup command above, run:

```sh
pnpm example:backstage-demo:dev
```

Open <http://localhost:4173/techdocs-mkdocs-svg-viewer/>. This command builds
the demo and serves its files with Python. Restart it after source changes. The
server has no fallback that redirects missing files to the app.

To build and test the static output separately, run:

```sh
pnpm example:backstage-demo:build
pnpm example:backstage-demo:test
```

The build writes the site to `examples/backstage/packages/demo/dist`. It copies
the documentation before generation, so the MkDocs source stays unchanged. It
also writes an app entry page for each generated documentation route, the Docs
entry, the example entity and Settings. These files let GitHub Pages serve
bookmarks and page refreshes without a routing service.

The browser tests use a plain file server under `/techdocs-mkdocs-svg-viewer/`.
They test direct visits, refreshes, SVG links, fragments, zoom and appearance.
They fail on browser errors, failed HTTP responses, backend requests and
requests outside the site.

## Deploy to GitHub Pages

The `GitHub Pages` workflow in `.github/workflows/pages.yml` builds and tests
the demo on pull requests. Pushes to `main` and manual runs on `main` also
deploy the tested output. Pull requests never deploy the site.

Before the first deployment, complete these steps in the GitHub repository:

1. Open Settings, then Pages.
2. Set Build and deployment, Source to GitHub Actions.
3. Restrict the `github-pages` environment to deployments from `main`.

The workflow uploads the generated files with `actions/upload-pages-artifact`.
It publishes them with `actions/deploy-pages`. It does not commit generated
files or use a deployment branch. See GitHub's
[custom workflow instructions](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

The configured address is `https://mwz.github.io/techdocs-mkdocs-svg-viewer/`.
The workflow deployment result confirms when the site is available.
`DEMO_BASE_URL` sets the address at build time. If the repository name or host
path changes, update this value and the path in the browser tests.
