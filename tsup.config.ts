import { defineConfig } from 'tsup';
export default defineConfig({
  entry: ['src/index.ts', 'src/alpha.ts', 'src/viewer/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: [
    'react',
    '@backstage/core-plugin-api',
    '@backstage/frontend-plugin-api',
    '@backstage/plugin-techdocs-react',
    '@backstage/plugin-techdocs-react/alpha',
  ],
});
