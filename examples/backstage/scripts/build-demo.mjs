import { execFileSync } from 'node:child_process';
import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { delimiter, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const example = fileURLToPath(new URL('../', import.meta.url));
const root = fileURLToPath(new URL('../../../', import.meta.url));
const mkdocs = fileURLToPath(new URL('../../mkdocs/', import.meta.url));
const output = join(example, 'packages/demo/dist');
const docsOutput = join(example, '.cache/demo-docs');
const baseUrl = new URL(
  process.env.DEMO_BASE_URL ||
    'http://localhost:4173/techdocs-mkdocs-svg-viewer',
);
if (
  !['http:', 'https:'].includes(baseUrl.protocol) ||
  baseUrl.search ||
  baseUrl.hash
) {
  throw new Error(
    'DEMO_BASE_URL must be an HTTP(S) URL without a query or fragment.',
  );
}
const env = { ...process.env, DEMO_BASE_URL: baseUrl.href.replace(/\/$/, '') };
const run = (command, args, cwd = example, extraEnv = env) =>
  execFileSync(command, args, { cwd, env: extraEnv, stdio: 'inherit' });

const venv = execFileSync('poetry', ['env', 'info', '--path'], {
  cwd: mkdocs,
  encoding: 'utf8',
}).trim();
await rm(docsOutput, { recursive: true, force: true });
run(
  'pnpm',
  [
    'exec',
    'techdocs-cli',
    'generate',
    '--no-docker',
    '--disableExternalFonts',
    '--defaultPlugin',
    'inline-select-svg',
    '--source-dir',
    join(example, '.cache/mkdocs'),
    '--output-dir',
    docsOutput,
  ],
  root,
  {
    ...env,
    PATH: `${join(venv, process.platform === 'win32' ? 'Scripts' : 'bin')}${delimiter}${process.env.PATH}`,
  },
);

run('yarn', ['typecheck']);
run('yarn', ['workspace', 'demo', 'build']);
const entity = JSON.parse(
  execFileSync(
    'poetry',
    [
      'run',
      'python',
      '-c',
      'import json, yaml; print(json.dumps(yaml.safe_load(open("catalog-info.yaml"))))',
    ],
    { cwd: mkdocs, encoding: 'utf8' },
  ),
);
entity.metadata.namespace ||= 'default';
const entityPath =
  `${entity.metadata.namespace}/${entity.kind}/${entity.metadata.name}`.toLowerCase();
if (entityPath !== 'default/component/svg-viewer-example') {
  throw new Error(
    'Update the demo entityId and readerPath when changing the fixture entity.',
  );
}
await writeFile(join(output, 'entity.json'), `${JSON.stringify(entity)}\n`);
await cp(docsOutput, join(output, 'static/docs', entityPath), {
  recursive: true,
});

// GitHub Pages serves files without an SPA rewrite rule. Give each supported
// browser route its own copy of the app entry page. Assets retain the base URL.
const html = await readFile(join(output, 'index.html'), 'utf8');
const routes = [
  'docs',
  'settings',
  'settings/general',
  `catalog/${entityPath}`,
];
async function addDocRoutes(directory, relative = '') {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory())
      await addDocRoutes(
        join(directory, entry.name),
        `${relative}${entry.name}/`,
      );
    else if (entry.name === 'index.html')
      routes.push(`docs/${entityPath}/${relative}`);
  }
}
await addDocRoutes(docsOutput);
for (const route of routes) {
  const directory = join(output, route);
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, 'index.html'), html);
}
await writeFile(join(output, '.nojekyll'), '');
await writeFile(
  join(example, '.cache/demo-build.json'),
  `${JSON.stringify({ baseUrl: env.DEMO_BASE_URL })}\n`,
);
console.log(`Static demo built in ${output}`);
