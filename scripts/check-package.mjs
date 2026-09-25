import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const tarball = process.argv[2];
if (!tarball || process.argv.length !== 3) {
  throw new Error('Provide exactly one package tarball.');
}

const entries = execFileSync('tar', ['-tzf', tarball], { encoding: 'utf8' })
  .trim()
  .split('\n');
const entrySet = new Set(entries);
const manifest = JSON.parse(
  execFileSync('tar', ['-xOf', tarball, 'package/package.json'], {
    encoding: 'utf8',
  }),
);
const source = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
);

if (manifest.name !== source.name || manifest.version !== source.version) {
  throw new Error('Packed manifest name or version differs from the source.');
}

if (manifest.publishConfig?.registry !== 'https://registry.npmjs.org/') {
  throw new Error('Package registry must be the public npm registry.');
}

for (const required of [
  'README.md',
  'LICENSE',
  'src/index.tsx',
  'src/nativewind.ts',
  'src/uniwind.ts',
  'lib/module/index.js',
  'lib/module/nativewind.js',
  'lib/module/uniwind.js',
  'lib/typescript/src/index.d.ts',
  'lib/typescript/src/nativewind.d.ts',
  'lib/typescript/src/uniwind.d.ts',
  'Ease.podspec',
  'ios/EaseView.h',
  'ios/EaseView.mm',
  'android/src/main/AndroidManifest.xml',
  'android/src/main/java/com/ease/EasePackage.kt',
  'android/src/main/java/com/ease/EaseView.kt',
  'android/src/main/java/com/ease/EaseViewManager.kt',
  'skills/react-native-ease-refactor/SKILL.md',
  '.claude-plugin/plugin.json',
  '.claude-plugin/marketplace.json',
]) {
  if (!entrySet.has(`package/${required}`)) {
    throw new Error(`Missing package file: ${required}`);
  }
}

const packageTargets = new Set();
const collectTargets = (value) => {
  if (typeof value === 'string' && value.startsWith('./')) {
    packageTargets.add(value.slice(2));
    return;
  }
  if (value && typeof value === 'object') {
    Object.values(value).forEach(collectTargets);
  }
};

collectTargets(manifest.main);
collectTargets(manifest.module);
collectTargets(manifest.types);
collectTargets(manifest.exports);

for (const target of packageTargets) {
  if (!entrySet.has(`package/${target}`)) {
    throw new Error(`Missing package entry-point target: ${target}`);
  }
}

for (const entry of entries) {
  if (/^package\/(?:android|ios)\/(?:.*\/)?build\//.test(entry)) {
    throw new Error(`Unexpected native build output: ${entry}`);
  }
  if (
    /^package\/(?:example|docs|node_modules|scripts|artifacts|\.github)(?:\/|$)/.test(
      entry,
    ) ||
    /^package\/(?:src|lib\/(?:commonjs|module|typescript)\/src)\/__tests__(?:\/|$)/.test(
      entry,
    ) ||
    /^package\/lib\/typescript\/(?:docs|example)(?:\/|$)/.test(entry)
  ) {
    throw new Error(`Unexpected repository-only file: ${entry}`);
  }
}

for (const group of [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
]) {
  for (const range of Object.values(manifest[group] ?? {})) {
    if (typeof range === 'string' && range.startsWith('workspace:')) {
      throw new Error('Unresolved workspace range in tarball.');
    }
  }
}

console.log(
  `${manifest.name}@${manifest.version}: ${entries.length} package files verified`,
);
