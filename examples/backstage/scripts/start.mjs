import { execFileSync, spawn } from 'node:child_process';
import { delimiter, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const example = fileURLToPath(new URL('../', import.meta.url));
const mkdocs = fileURLToPath(new URL('../../mkdocs/', import.meta.url));
const venv = execFileSync('poetry', ['env', 'info', '--path'], {
  cwd: mkdocs,
  encoding: 'utf8',
}).trim();

// TechDocs invokes mkdocs itself. Give the backend the existing Poetry environment.
const child = spawn('yarn', ['start'], {
  cwd: example,
  stdio: 'inherit',
  env: {
    ...process.env,
    PATH: `${join(venv, process.platform === 'win32' ? 'Scripts' : 'bin')}${delimiter}${process.env.PATH}`,
  },
  shell: process.platform === 'win32',
});
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => child.kill(signal));
}
child.on('error', (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
child.on('exit', (code, signal) => {
  process.exitCode = code ?? (signal === 'SIGINT' ? 130 : 1);
});
