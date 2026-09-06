import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';

const html = fs.readFileSync('www/index.html', 'utf8');
const match = html.match(/<script>\n([\s\S]*)\n<\/script>/);
if (!match) {
  console.error('Inline <script> not found.');
  process.exit(1);
}
const tmp = path.join(os.tmpdir(), 'akcija-inline-check.js');
fs.writeFileSync(tmp, match[1]);
const result = spawnSync(process.execPath, ['--check', tmp], { stdio: 'inherit' });
process.exit(result.status ?? 1);
