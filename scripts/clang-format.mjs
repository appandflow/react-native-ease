// Runs clang-format like the `clang-format` npm package CLI, but also works on
// platforms the package has no binary for (e.g. Linux arm64).
// Usage: node scripts/clang-format.mjs [clang-format args] --glob=<pattern>
import { spawnSync } from 'node:child_process';
import {
  accessSync,
  closeSync,
  constants,
  globSync,
  openSync,
  readSync,
  statSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { arch, platform } from 'node:os';
import { delimiter, dirname, join } from 'node:path';

const VERSION = '13.0.1'; // Version of the binaries bundled in the package.

const isFile = (file) => {
  try {
    accessSync(file, constants.X_OK);
    return statSync(file).isFile();
  } catch {
    return false;
  }
};

// Package manager shims are scripts that end up calling this script again.
const isScript = (file) => {
  const fd = openSync(file, 'r');
  const buf = Buffer.alloc(2);
  readSync(fd, buf, 0, 2, 0);
  closeSync(fd);
  return buf.toString('latin1') === '#!';
};

const exe = platform() === 'win32' ? 'clang-format.exe' : 'clang-format';

// Returns [binary, bundled]: the bundled binary, if any, is already known to
// be the right version.
function findBinary() {
  if (process.env.CLANG_FORMAT_BINARY) {
    return [process.env.CLANG_FORMAT_BINARY, false];
  }
  const root = dirname(
    createRequire(import.meta.url).resolve('clang-format/package.json'),
  );
  const dirs = platform() === 'win32' ? ['win32'] : [`${platform()}_${arch()}`];
  // Apple silicon runs the x64 binary through Rosetta.
  if (platform() === 'darwin') dirs.push('darwin_x64');
  for (const dir of dirs) {
    const bundled = join(root, 'bin', dir, exe);
    if (isFile(bundled)) return [bundled, true];
  }
  for (const dir of (process.env.PATH ?? '').split(delimiter)) {
    const candidate = join(dir, exe);
    if (
      !dir.includes('node_modules') &&
      isFile(candidate) &&
      !isScript(candidate)
    ) {
      return [candidate, false];
    }
  }
  console.error(
    `No clang-format binary found for ${platform()}_${arch()}.\n` +
      `Install it with \`pip install clang-format==${VERSION}\` or set CLANG_FORMAT_BINARY.`,
  );
  process.exit(1);
}

const [binary, bundled] = findBinary();

if (!bundled) {
  const out = spawnSync(binary, ['--version'], { encoding: 'utf8' });
  if (out.error) {
    console.error(`Cannot run ${binary}: ${out.error.message}`);
    process.exit(1);
  }
  if (!out.stdout?.includes(`version ${VERSION}`)) {
    console.error(
      `warning: ${binary} is not clang-format ${VERSION} (${out.stdout?.trim()}), ` +
        'it may format differently.',
    );
  }
}

const args = [];
const files = [];
for (const arg of process.argv.slice(2)) {
  if (arg.startsWith('--glob=')) files.push(...globSync(arg.slice(7)));
  else args.push(arg);
}

if (files.length === 0) {
  console.error('No files matched the --glob pattern.');
  process.exit(1);
}

const result = spawnSync(binary, [...args, ...files], { stdio: 'inherit' });
if (result.error) {
  console.error(`Cannot run ${binary}: ${result.error.message}`);
  process.exit(1);
}
process.exit(result.status ?? 1);
