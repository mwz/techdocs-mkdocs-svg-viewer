import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';

const root = new URL('../../../', import.meta.url);
const target = new URL('../packages/svg-viewer/', import.meta.url);
const source = JSON.parse(
  await readFile(new URL('package.json', root), 'utf8'),
);

// A copy inside this Yarn workspace resolves React and Backstage from the app.
// Linking the repository root would also expose its pnpm development dependencies.
await rm(new URL('dist/', target), { recursive: true, force: true });
await mkdir(target, { recursive: true });
await cp(new URL('dist/', root), new URL('dist/', target), { recursive: true });
const manifest = {
  name: source.name,
  version: '0.0.0',
  private: true,
  type: source.type,
  main: source.main,
  module: source.module,
  types: source.types,
  exports: source.exports,
  sideEffects: source.sideEffects,
  backstage: source.backstage,
  peerDependencies: source.peerDependencies,
  peerDependenciesMeta: source.peerDependenciesMeta,
};
await writeFile(
  new URL('package.json', target),
  `${JSON.stringify(manifest, null, 2)}\n`,
);

// TechDocs edits mkdocs.yml and rejects symlinks outside its source directory.
// Copy only documentation inputs, leaving the Poetry .venv and source untouched.
const docs = new URL('../.cache/mkdocs/', import.meta.url);
await rm(docs, { recursive: true, force: true });
await mkdir(docs, { recursive: true });
for (const path of ['docs', 'mkdocs.yml', 'catalog-info.yaml']) {
  await cp(new URL(`examples/mkdocs/${path}`, root), new URL(path, docs), {
    recursive: true,
  });
}
