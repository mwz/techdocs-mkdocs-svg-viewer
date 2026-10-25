import { spawn } from 'node:child_process';
import { cp, mkdir, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const example = fileURLToPath(new URL('../', import.meta.url));
const { baseUrl } = JSON.parse(
  await readFile(join(example, '.cache/demo-build.json'), 'utf8'),
);
const preview = join(example, '.cache/demo-preview');
const prefix = new URL(baseUrl).pathname.replace(/^\/|\/$/g, '');
await rm(preview, { recursive: true, force: true });
await mkdir(preview, { recursive: true });
await cp(join(example, 'packages/demo/dist'), join(preview, prefix), {
  recursive: true,
});

// A plain file server deliberately supplies no SPA fallback, like GitHub Pages.
const port = process.env.DEMO_PORT || '4173';
const child = spawn(
  'python',
  ['-m', 'http.server', port, '--bind', '127.0.0.1', '--directory', preview],
  { stdio: 'inherit' },
);
console.log(`Demo: http://localhost:${port}/${prefix}${prefix ? '/' : ''}`);
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () => child.kill(signal));
child.on('error', (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
child.on('exit', (code) => {
  process.exitCode = code ?? 0;
});
