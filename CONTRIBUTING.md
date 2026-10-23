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

By contributing, you agree that your contribution is licensed under the
[Apache License, Version 2.0](LICENSE).

## Releases

CI publishes to npm with
[trusted publishing](https://docs.npmjs.com/trusted-publishers), so no npm token
is stored in the repository.

- **Snapshots:** each push to `main` that changes the package source publishes a
  snapshot, for example `0.2.1-main.42.gabc1234`, with the `next` dist-tag.
- **Releases:** a `v*` tag publishes the version in `package.json` with the
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

CI stops before it publishes if the tag does not match `package.json`, the
tagged commit is not on `main`, or `CHANGELOG.md` has no section for the
version.
