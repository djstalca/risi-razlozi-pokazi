import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const files = [
  'www/app.js',
  ...fs.readdirSync('www/terms')
    .filter((name) => name.endsWith('.js'))
    .sort()
    .map((name) => `www/terms/${name}`),
];

for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  if ((result.status ?? 1) !== 0) process.exit(result.status ?? 1);
}

console.log(`JavaScript syntax OK (${files.length} files).`);
