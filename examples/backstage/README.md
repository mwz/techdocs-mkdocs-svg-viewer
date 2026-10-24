# Local Backstage example

This app runs the SVG viewer in a real Backstage TechDocs reader. It uses
Backstage 1.56.2, the latest stable release on 24 October 2026, from the
[official release manifest](https://versions.backstage.io/v1/tags/main/manifest.json).
The package versions and `yarn.lock` keep the installation repeatable.

The app includes the catalogue, TechDocs, search and guest sign-in. SQLite holds
the catalogue in memory. TechDocs builds the existing `examples/mkdocs` site
locally and stores its output in `examples/backstage/.cache/techdocs`. You do
not need Docker, PostgreSQL, GitHub credentials or a cloud account.

## Run the app

Use Node 24, pnpm 11.25.0, Yarn 4.13.0, Python 3.12 and Poetry 2.1.1. The
repository's `mise.toml` supplies all five tools. Activate mise in your shell
before you run the commands below. If you use a shell without mise activation,
prefix each `pnpm` command with `mise exec --`.

From the repository root, run:

```sh
mise install
pnpm install --frozen-lockfile
pnpm backstage:setup
pnpm backstage:dev
```

The setup command installs the locked JavaScript and Python dependencies. The
first installation can take several minutes. If SQLite needs to compile on your
platform, install Python, Make and a C++ compiler first.

Open <http://localhost:3000/docs/default/component/svg-viewer-example>. Select
the guest sign-in button. The first visit builds the documentation. You can also
open the example from the catalogue or the Docs sidebar entry. Press Ctrl+C in
the terminal to stop the app.

Both servers listen on the loopback interface. The frontend uses port 3000, and
the backend uses port 7007. Keep these ports free before you start. This
configuration is for local development. Guest sign-in is enabled, and catalogue
data resets when the backend restarts.

## Switch between light and dark themes

Open Settings in the sidebar. Under General, find Appearance and select Light,
Dark or Auto. Auto follows your operating system's colour preference. Backstage
saves your choice in this browser.

Return to Docs and open the SVG viewer. Its controls and background follow the
selected theme. Colours defined inside the SVG remain part of the artwork. You
can switch themes without changing the app configuration or restarting it.

## Test a change

After you change the plugin, stop the app and run `pnpm backstage:dev` again.
This command rebuilds the plugin and copies its output into
`examples/backstage/packages/svg-viewer`. This generated package resolves React
and Backstage dependencies from the example app. It does not link to the
repository's pnpm dependencies or use the published npm package.

If you change the plugin's dependencies or package metadata, run
`pnpm backstage:setup` again. If the change requires a new lockfile, run
`yarn install` from `examples/backstage` and commit `yarn.lock`.

Edit documentation in `examples/mkdocs/docs`, then restart with
`pnpm backstage:dev`. This command copies the documentation into
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

1. Select Expand Order processing architecture and use the zoom controls.
2. Press Escape and make sure that focus returns to the expand button.
3. Open the viewer and select Order service to follow its relative SVG link.
4. Return to the diagram and select Queue note to follow its page fragment.
5. Make sure that each diagram has one expand button.

After the setup command, run the automated checks from the repository root:

```sh
pnpm backstage:check
pnpm exec playwright install --with-deps chromium
pnpm test:backstage
```

The first command checks TypeScript and Backstage configuration, then builds the
frontend. The browser test starts the app, signs in, builds TechDocs, opens the
viewer and follows SVG links without a full page reload. It also switches
between dark and light themes through Settings. It reuses an app already running
on port 3000 outside CI.

## Files and updates

`packages/app/src/App.tsx` registers the new frontend module explicitly. Package
discovery is disabled, so the module loads once. The backend includes only
authentication, the catalogue, TechDocs and the local Lunr search engine.

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
