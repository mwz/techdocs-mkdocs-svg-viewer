# Backstage TechDocs & MkDocs SVG viewer

Click an inline SVG diagram to open a full-window, accessible viewer with zoom,
mouse/touch panning, directional buttons and optional browser fullscreen.

Designed for SVGs embedded by
[mkdocs-inline-select-svg-plugin](https://pypi.org/project/mkdocs-inline-select-svg-plugin/)
and similar plugins. The viewer uses the original inline SVG, so embedded links,
text, gradients, markers, IDs and event listeners remain available. It does not
rasterise the SVG or turn it into an `<img>`.

There are two ways to use it:

- **Backstage TechDocs:** install the package and register the addon. See
  [Legacy frontend](#legacy-frontend) or
  [New frontend system](#new-frontend-system).
- **MkDocs site outside Backstage:** load the self-contained `svg-viewer.js`
  with `extra_javascript`. No JavaScript toolchain is needed. See
  [Standalone MkDocs site](#standalone-mkdocs-site-outside-backstage).

## Behaviour

- Click an **unlinked** diagram area, or its **Expand diagram** button, to open.
- Links take priority over opening. Links keep their destinations, targets,
  query strings, fragments and modifier-click behaviour.
- TechDocs only resolves and routes links that use `href`. For a link with only
  legacy `xlink:href`, which many exporters emit, the addon adds an `href` with
  the resolved URL. TechDocs then navigates in-app instead of reloading the
  page. Unmounting the addon removes the added attributes.
- When TechDocs routes a link clicked in the viewer, including a `#fragment`
  link on the same page, the viewer closes so that the destination is visible.
- A mouse/touch drag pans, even when it starts on a linked node. Releasing a
  drag does not follow the link; a normal click or keyboard activation does.
- Wheel/trackpad and two-finger pinch zoom around the pointer/pinch centre.
- `+`/`−` zoom, arrow keys pan, Shift+arrow pans farther, `0`/Home fits, Escape
  closes. There are also labelled buttons for all essential operations.
- The modal fills the **browser viewport** immediately. Its separate Fullscreen
  button uses the browser Fullscreen API where supported; opening never requires
  that permission or API.
- Native `<dialog>` provides modal focus containment and background inertness.
  Closing restores the SVG and returns keyboard focus to the expand button.
- Small icons, nested SVG viewports, Material theme icon wrappers and Mermaid
  diagrams (`.mermaid`, or an SVG `id` starting with `mermaid`) are skipped. The
  Mermaid addon has its own zoom controls. A MutationObserver discovers diagrams
  added by navigation or client rendering.
- All processing stays in the page. There are no viewer services or telemetry.

## Compatibility

The implementation is type-checked against these exact Backstage packages:

| Package                                              | Version   |
| ---------------------------------------------------- | --------- |
| `@backstage/plugin-techdocs-react`                   | `1.4.0`   |
| `@backstage/core-plugin-api`                         | `1.12.11` |
| `@backstage/frontend-plugin-api` (new frontend only) | `0.18.2`  |
| React                                                | `18.3.1`  |

Use the versions aligned with your Backstage release. The `/alpha` entry point
uses Backstage's alpha `AddonBlueprint` API, which can change between releases.
Older Backstage versions may work with the legacy entry point, but are not
claimed as tested. React 19 is not included in this initial peer range because
the verified TechDocs package declares React 17/18 support.

All peer dependencies are optional, so the `/viewer` entry point can be used
without React or Backstage packages. A Backstage app already has them.

The package targets Node 24 LTS (`engines.node >=24`). Build your Backstage app
on Node 24 or later. Yarn 1 refuses to install the package on older Node
versions.

Requires a modern browser supporting native dialog, Pointer Events,
ResizeObserver and shadow DOM. Chromium browser tests exercise real native SVG
navigation, mouse, keyboard and touch. This repository is not a complete
Backstage app: smoke-test the integration in your own TechDocs instance before
rolling it out.

## Install from the private source repository

No npm package is published, and `private: true` prevents accidental
publication. For an editable local checkout, see
[Local testing without a tarball](#local-testing-without-a-tarball). To test a
packaged build, create a tarball and add it to your Backstage app:

```sh
git clone git@github.com:mwz/techdocs-mkdocs-svg-viewer.git
cd techdocs-mkdocs-svg-viewer
mise install
pnpm install --frozen-lockfile
pnpm build
pnpm pack --out ../techdocs-mkdocs-svg-viewer-0.1.0.tgz

# From the root of your Backstage app; adjust the path to the tarball:
yarn --cwd packages/app add file:../../../techdocs-mkdocs-svg-viewer-0.1.0.tgz
```

The tarball includes ESM, CommonJS and TypeScript declarations. You can also
place this package in your Backstage monorepo as a workspace package and build
it before the app. Keep your app's existing package manager; this repository
uses pnpm and mise for development.

### Local testing without a tarball

Add this checkout to your Backstage app as a folder-based `file:` dependency.
This works with Yarn 1 (Classic) and Yarn 2–4. Yarn copies the folder into the
app's `node_modules`, so the add-on's peer dependencies (React and the Backstage
packages) resolve to the app's copies.

Do not use a `portal:` or `link:` dependency. Both create a symlink to this
checkout. The Backstage bundler follows the symlink, so the add-on then imports
`react` and `@backstage/*` from this checkout's `node_modules`, which contains
its development dependencies. The page then has two copies of React and of the
Backstage API context, and TechDocs fails with
`TypeError: Cannot read properties of null (reading 'useContext')`.

The commands below assume sibling checkouts named `backstage` and
`techdocs-mkdocs-svg-viewer`. Adjust the paths for your layout.

In the add-on checkout, install dependencies and build:

```sh
cd techdocs-mkdocs-svg-viewer
mise install
pnpm install --frozen-lockfile
pnpm build
```

From `backstage/packages/app`, add the local package:

```sh
yarn add '@mwz/techdocs-mkdocs-svg-viewer@file:../../../techdocs-mkdocs-svg-viewer'
```

The relative path is measured from `packages/app`, not the Backstage repository
root. Register the add-on using the legacy or new frontend instructions below,
then start Backstage with your usual development command.

The installed copy does not change when you rebuild the add-on. After each
change, run `pnpm build` in the add-on checkout, then run `yarn install` in the
Backstage app to copy it again, and restart Backstage. `pnpm dev` runs the
standalone demo and does not replace this step.

Keep the local dependency and associated lockfile changes out of shared
Backstage commits, since CI and other developers may not have the neighbouring
checkout. When finished, restore the previous dependency and run `yarn install`,
or use `yarn remove @mwz/techdocs-mkdocs-svg-viewer` from `packages/app` if it
was added only for this test, and remove its registration.

The copy includes the whole checkout, not only the published files. Use the
tarball workflow above when you want to check the exact package contents that
will be distributed.

### Legacy frontend

Add `SvgViewer` to the existing `TechDocsAddons` registry in your reader route:

```tsx
import { TechDocsReaderPage } from '@backstage/plugin-techdocs';
import { TechDocsAddons } from '@backstage/plugin-techdocs-react';
import { SvgViewer } from '@mwz/techdocs-mkdocs-svg-viewer';

<Route path="/docs/:namespace/:kind/:name/*" element={<TechDocsReaderPage />}>
  <TechDocsAddons>
    <SvgViewer />
    {/* Keep any other existing addons here. */}
  </TechDocsAddons>
</Route>;
```

Also register it on the entity documentation tab if you use that surface:

```tsx
import { EntityTechdocsContent } from '@backstage/plugin-techdocs';

<EntityTechdocsContent>
  <TechDocsAddons>
    <SvgViewer />
  </TechDocsAddons>
</EntityTechdocsContent>;
```

### New frontend system

Add the module to your app's existing `features` list:

```tsx
import { createApp } from '@backstage/frontend-defaults';
import { techDocsSvgViewerModule } from '@mwz/techdocs-mkdocs-svg-viewer/alpha';

const app = createApp({
  features: [
    // Your existing plugins/modules, including TechDocs.
    techDocsSvgViewerModule,
  ],
});
```

For custom options, use `createTechDocsSvgViewerModule({ maxZoom: 32 })` instead
of the default module. Install exactly one registration per TechDocs surface; do
not combine the legacy addon and the new frontend module on the same reader.

The package declares itself as a TechDocs module (`frontend-plugin-module` for
`techdocs`), with the default module exported from `./alpha`. If your app uses
feature discovery (`app.packages` in `app-config.yaml`), the module is installed
automatically. Do not also add it to `features`. To use custom options with
discovery, exclude this package from discovery and add
`createTechDocsSvgViewerModule(...)` to `features` instead. Check the Backstage
feature discovery documentation for your release, because this configuration can
change.

## MkDocs configuration

Keep your existing inline plugin setup, for example:

```yaml
plugins:
  - techdocs-core
  - inline-select-svg:
      pattern: '[.]inline[.]svg$'
```

```md
![Order processing](architecture.inline.svg)
```

The Python plugin runs during the documentation build; this addon runs in the
Backstage frontend. Nothing needs to be added to each SVG. The inline plugin
uses SVG `<title>` rather than Markdown alt text, so meaningful titles improve
the button and dialog labels.

A small, runnable MkDocs fixture is in `examples/mkdocs`. The `dev` demo
exercises the same SVG with relative `xlink:href`, an external link, a fragment,
a non-zero viewBox origin and gradient/marker references.

## Standalone MkDocs site (outside Backstage)

The viewer also works on a MkDocs site that you host without Backstage, for
example the output of `mkdocs build` or `techdocs-cli generate`. The build
produces one self-contained script, `dist/svg-viewer.js`. It needs no JavaScript
toolchain in the docs repository.

1. Build the add-on with `pnpm build`.
2. Copy `dist/svg-viewer.js` to `docs/javascripts/svg-viewer.js` in the docs
   repository. Alternatively, host the file once at an internal URL.
3. Add the script to `mkdocs.yml`:

   ```yaml
   plugins:
     - techdocs-core
     - inline-select-svg:
         pattern: '[.]inline[.]svg$'
   extra_javascript:
     - javascripts/svg-viewer.js # or the hosted URL
   ```

4. Preview with `techdocs-cli serve:mkdocs --no-docker` (or `mkdocs serve`),
   then click a diagram.

The script installs the viewer on `document.body` with the default options.
Material's instant navigation replaces the page content but keeps `<body>`, so
diagrams on later pages are enhanced too. The browser handles `href` and
`xlink:href` links natively, so the script does not change links. To remove the
viewer, call `window.disposeSvgViewer()`. Loading the script twice has no
effect.

You can keep the same `mkdocs.yml` for Backstage. TechDocs sanitises the HTML
and removes `<script>` tags, so the script does not run there and the addon
handles diagrams instead. Confirm that each diagram has only one **Expand
diagram** button in your Backstage instance.

`examples/mkdocs` is set up this way. From the repository root, run
`pnpm example:serve` to build the script, copy it into the example and serve the
site with `techdocs-cli` through Poetry. See `examples/mkdocs/README.md`.

To use custom options, or to bundle the viewer with your own site JavaScript,
import the controller instead:

```ts
import { installSvgViewer } from '@mwz/techdocs-mkdocs-svg-viewer/viewer';
const dispose = installSvgViewer(document.body, { maxZoom: 32 });
```

## Configuration

```tsx
<SvgViewer
  selector=".md-content__inner svg, article svg"
  minWidth={80}
  minHeight={40}
  minZoom={0.25}
  maxZoom={16}
  resolveXlinkHref
/>
```

| Option                  | Default                                      | Meaning                                                                 |
| ----------------------- | -------------------------------------------- | ----------------------------------------------------------------------- |
| `selector`              | `.md-content__inner svg, article svg`        | CSS selector within the TechDocs shadow root                            |
| `minWidth`, `minHeight` | `80`, `40`                                   | Minimum rendered size in CSS pixels to avoid treating icons as diagrams |
| `minZoom`, `maxZoom`    | `0.25`, `16`                                 | Bounds relative to Fit; `1` means 100% fit, not native pixel size       |
| `resolveXlinkHref`      | `true` (addon), `false` (`installSvgViewer`) | Add a resolved `href` to links that only have `xlink:href`              |

Put `data-svg-viewer="on"` on a small SVG to override size thresholds. Put
`data-svg-viewer="off"` on an SVG or its containing element to exclude it. An
SVG inside an HTML link gets a separate expand button outside that link; the
original whole-image link remains available on the page. Individual links
**inside** the SVG remain available in the viewer.

## Rendering and lifecycle notes

The viewer temporarily moves the original SVG into a native dialog in the same
shadow root. Keeping a single node avoids duplicate IDs and broken references
between `<defs>`, gradients, markers and `<use>`. It snapshots presentation
styles before the move, from a temporary copy in the same place. The copy is not
under the pointer, so hover styles active at the click are not captured. After
the move, it sets inline only the values that changed because the SVG left its
original ancestors, such as inherited fonts and colours. It restores the
original inline styles and placement on close. No fetched SVG/HTML is parsed or
injected by the viewer; the demo alone parses its checked-in, trusted fixture.

Existing `viewBox` values, including negative origins, are preserved. SVGs
without a viewBox receive a temporary one based on their rendered viewport.
Fixed-size diagrams are the primary use case; SVGs whose geometry itself depends
on dynamic ancestor CSS, animations or interactive form controls may need a
custom selector or an opt-out.

Hover and other interactive styles in the same shadow root, for example from a
custom styles addon, also apply in the viewer. An `!important` rule always
applies. A rule without `!important` applies to a property only if the viewer
did not set that property inline on the element. Rules that depend on the
original ancestors, such as `.md-typeset svg a:hover`, no longer match in the
viewer.

Existing source layout problems such as duplicate IDs between different SVGs are
not repaired by this addon.

TechDocs remains responsible for sanitisation and routing. Relative URLs must
already be correct in the rendered document; the viewer cannot recover the
original `.svg` file's source path after inlining. TechDocs attaches a click
listener to each link before addons mount. The viewer moves the original nodes,
so these listeners stay attached in the viewer. The addon resolves `xlink:href`
values the same way TechDocs resolves `href`: relative to the page URL, with a
trailing `/` unless the path ends in `.html`. Test your app's routing
customisations.

The page behind the dialog is inert. The SVG is restored on close, route/hash
navigation, content removal or addon unmount. A link with `target="_blank"`
leaves the viewer open in the original tab. Browser-native fullscreen is
optional and can be denied without losing the full-window viewer.

## Development

```sh
mise install
pnpm install --frozen-lockfile
pnpm exec playwright install --with-deps chromium
pnpm check
pnpm format:check
pnpm dev
```

Open the Vite URL shown in the terminal. The demo offers page-replacement and
mount/unmount controls for lifecycle testing. Add `?techdocs` to the URL to
simulate TechDocs link handling. `/dev/standalone.html` loads the built
`dist/svg-viewer.js` on a plain MkDocs-style page; run `pnpm build` first.
`pnpm check` runs TypeScript, geometry tests, production builds and Playwright
integration tests. CI runs the same checks on Node 24 and the current Node
release, and archives browser traces on failure. Browser tests intercept example
link destinations locally.

## Upstream integration references

- [TechDocs addons (new frontend)](https://backstage.io/docs/features/techdocs/addons/)
- [TechDocs addons (legacy frontend)](https://backstage.io/docs/features/techdocs/addons--old/)
- [Inline-select-svg plugin](https://github.com/temperlang/svg-inline-mkdocs-plugin)

This is private, unlicensed project code. No public publishing workflow is
enabled.
