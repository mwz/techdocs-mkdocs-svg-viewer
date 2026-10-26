# Contributing

Bug reports and pull requests are welcome. For a large change, open an issue
first to discuss it.

## Development

The repository uses [mise](https://mise.jdx.dev/) for tool versions and pnpm for
dependencies:

```sh
mise install
pnpm install --frozen-lockfile
pnpm exec playwright install --with-deps chromium
```

Before you open a pull request, run:

```sh
pnpm format
pnpm check
```

`pnpm check` runs the type check, unit tests, the build and the Playwright
browser tests. CI runs the same checks. For a change that users can see, add a
line under `## Unreleased` at the top of `CHANGELOG.md`. Add that heading if it
is not there.

See [Development](README.md#development) in the README for the demo and for
testing a change in a local Backstage app.

For a change to the Backstage integration, use the
[included Backstage app](examples/backstage/README.md):

```sh
pnpm example:backstage:setup
pnpm example:backstage:check
pnpm example:backstage:test
```

The browser test uses the real TechDocs reader and the local MkDocs example. The
Backstage app has its own Yarn lockfile and uses Node 24.

For changes to the static Backstage demo or its deployment, also run:

```sh
pnpm example:backstage-demo:build
pnpm example:backstage-demo:test
```

The tests serve the built files under the GitHub Pages URL prefix. They test
direct visits and refreshes without a server routing fallback. They also reject
backend requests and external requests. Keep these tests when changing the
demo's routes, APIs or build scripts. The `GitHub Pages` workflow runs them
before each deployment. See the
[demo instructions](examples/backstage/README.md#static-demo).

By contributing, you agree that your contribution is licensed under the
[Apache License, Version 2.0](LICENSE).

## Refresh the screenshots

The capture script uses Chromium to reproduce the six README screenshots. After
the development setup, install the example dependencies once:

```sh
pnpm example:backstage:setup
```

Then run this command from the repository root:

```sh
pnpm screenshots
```

The command builds the static Backstage demo and starts both preview servers. It
replaces `img/mkdocs-{light,dark}.png`, `img/backstage-{light,dark}.png` and
`img/svg-viewer-{light,dark}.png`, then stops the servers. Stop other previews
on ports 4173 and 8001 before you run it.

Page captures use a 1400 × 1050 viewport. Viewer captures use a 1600 × 1050
viewport with three zoom steps, displayed as 195%. Each theme starts in a fresh
browser session. The script waits for the diagram, theme and fonts before each
capture. Review the images before you commit them, because fonts and browser
updates can change their appearance.

The capture steps are in
[scripts/capture-screenshots.ts](scripts/capture-screenshots.ts). The
[Playwright configuration](scripts/screenshots.config.ts) controls the servers,
viewport and browser settings. Failed captures retain traces in
`test-results/screenshots/`.

## Releases

CI uses [trusted publishing](https://docs.npmjs.com/trusted-publishers), so no
npm token is stored in the repository. CI can only
[stage](https://docs.npmjs.com/staged-publishing) a version. A staged version
stays private until a maintainer approves it with 2FA in the **Staged Packages**
tab of the package on npmjs.com, or with `npm stage approve <stage-id>`. Reject
a staged version that you do not want with `npm stage reject <stage-id>`.

- **Snapshots:** each push to `main` that changes the package source stages a
  snapshot, for example `0.2.1-main.42.gabc1234`, with the `next` dist-tag. To
  stage a snapshot without a source change, run the CI workflow manually on
  `main`.
- **Releases:** a `v*` tag stages the version in `package.json` with the
  `latest` dist-tag. A prerelease version, for example `0.3.0-rc.1`, uses the
  `next` dist-tag. CI also creates a GitHub release with the notes from
  `CHANGELOG.md` and attaches `dist/svg-viewer.js`.

To make a release:

1. In a pull request, set the new version in `package.json`. Rename
   `## Unreleased` in `CHANGELOG.md` to `## <version>`, for example `## 0.2.1`.
   Update the version in the jsDelivr URL in the README.
2. Merge the pull request.
3. Tag the merge commit on `main` and push the tag:

   ```sh
   git switch main && git pull
   git tag v0.2.1
   git push origin v0.2.1
   ```

4. When CI has finished, approve the staged version on npmjs.com. Until you
   approve it, the GitHub release exists but the version is not on npm or
   jsDelivr.

CI stops before it stages the version if the tag does not match `package.json`,
the tagged commit is not on `main`, or `CHANGELOG.md` has no section for the
version.
