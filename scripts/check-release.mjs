import { readFileSync } from 'node:fs';

const tag = process.argv[2];
const manifest = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
);

if (process.argv.length !== 3) {
  throw new Error('Provide exactly one release tag.');
}

if (
  tag !== `v${manifest.version}` ||
  !/^v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(tag)
) {
  throw new Error('Release tag must exactly match the package version.');
}

console.log(`${tag}: package version verified`);
