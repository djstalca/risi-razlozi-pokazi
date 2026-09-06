import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const files = [
  ...fs.readdirSync('www/terms').filter((n) => n.endsWith('.js')).sort().map((n) => `www/terms/${n}`),
  'www/app/core.js',
  'www/app/home-setup.js',
  'www/app/board.js',
  'www/app/round.js',
  'www/app/result.js',
  'www/app/canvas-native.js',
];

for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  if ((result.status ?? 1) !== 0) process.exit(result.status ?? 1);
}
console.log(`JavaScript syntax OK (${files.length} files).`);
