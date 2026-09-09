import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const core=fs.readFileSync('www/app/core.js','utf8');
const setup=fs.readFileSync('www/app/home-setup.js','utf8');
const board=fs.readFileSync('www/app/board.js','utf8');
const round=fs.readFileSync('www/app/round.js','utf8');
const result=fs.readFileSync('www/app/result.js','utf8');
const polish=fs.readFileSync('www/ux-polish.css','utf8');

test('game screens use a compact AKCIJA header helper',()=>{
  assert.match(core,/function gameTopbar\(/);
  assert.match(core,/inGameTopbar/);
  assert.match(board,/gameTopbar\(/);
  assert.match(round,/gameTopbar\(/);
  assert.match(result,/gameTopbar\(/);
  assert.match(polish,/\.inGameTopbar \.logo/);
});

test('setup uses tap-first segmented controls and a switch',()=>{
  const renderSetup=setup.slice(setup.indexOf('function renderSetup'),setup.indexOf('function changeTeamCount'));
  assert.match(renderSetup,/role="group" aria-label="Število ekip"/);
  assert.match(renderSetup,/gameLengthSegments/);
  assert.match(renderSetup,/segmented4/);
  assert.match(renderSetup,/role="switch"/);
  assert.doesNotMatch(renderSetup,/<select/);
});

test('challenge cannot start before the term has been revealed',()=>{
  assert.match(round,/challengeTermSeen=false/);
  assert.match(round,/id="startRoundButton"/);
  assert.match(round,/disabled aria-disabled/);
  assert.match(round,/function markChallengeTermSeen/);
  assert.match(round,/if\(!challengeTermSeen\)return/);
});

test('timer has visual progress and urgency states',()=>{
  assert.match(round,/id="timerRing"/);
  assert.match(round,/--timer-progress/);
  assert.match(round,/ring\.classList\.toggle\('urgent',remaining<=5\)/);
  assert.match(polish,/conic-gradient/);
  assert.match(polish,/\.timerRing\.urgent/);
});

test('active board state follows the active team color',()=>{
  assert.match(board,/--active-team-color:\$\{teamColor\(i\)\}/);
  assert.match(board,/--active-team-color:\$\{teamColor\(state\.current\)\}/);
  assert.match(polish,/\.score\.active/);
  assert.match(polish,/\.cell\.activeSpot/);
});

test('move notice explains start and destination',()=>{
  assert.match(result,/\$\{from\} → \$\{to\} \(\+\$\{points\}\)/);
});
