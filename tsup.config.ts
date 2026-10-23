import { readFileSync } from 'node:fs';
import { defineConfig } from 'tsup';

const { name, version, license, repository } = JSON.parse(
  readFileSync('package.json', 'utf8'),
);
const repositoryUrl = repository.url
  .replace(/^git\+/, '')
  .replace(/\.git$/, '');

// The two builds run in parallel, so `pnpm build` empties dist/ first instead
// of letting either build clean it.
export default defineConfig([
  {
    entry: ['src/index.ts', 'src/alpha.ts', 'src/viewer/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: false,
    external: [
      'react',
      '@backstage/core-plugin-api',
      '@backstage/frontend-plugin-api',
      '@backstage/plugin-techdocs-react',
      '@backstage/plugin-techdocs-react/alpha',
    ],
  },
  {
    // Single self-contained script for MkDocs `extra_javascript`.
    entry: { 'svg-viewer': 'src/viewer/auto.ts' },
    format: ['iife'],
    outExtension: () => ({ js: '.js' }),
    minify: true,
    clean: false,
    // The license notice for copies loaded from a CDN or committed to a docs
    // repository. Minifiers keep `/*!` comments.
    banner: {
      js: `/*! ${name} ${version} | ${license} | ${repositoryUrl} */`,
    },
  },
]);
