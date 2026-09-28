import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function createGameContext(){
  const storage = new Map();
  const context = vm.createContext({
    console,
    Math,
    Date,
    JSON,
    setInterval: () => 1,
    clearInterval: () => {},
    setTimeout: (fn) => { fn(); return 1; },
    clearTimeout: () => {},
    localStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: (key) => storage.delete(key),
    },
    window: {},
    document: { getElementById: () => null },
    navigator: {},
  });
  context.window = context;
  context.innerHeight = 900;
  vm.runInContext(fs.readFileSync('www/app/core.js', 'utf8'), context, { filename: 'core.js' });
  vm.runInContext(fs.readFileSync('www/app/board.js', 'utf8'), context, { filename: 'board.js' });
  vm.runInContext(fs.readFileSync('www/app/result.js', 'utf8'), context, { filename: 'result.js' });
  return context;
}

test('board mode cycles explain/draw/act and has 48 playable fields', () => {
  const ctx = createGameContext();
  assert.equal(vm.runInContext('activeBoardFields()', ctx), 48);
  assert.equal(vm.runInContext('finishPosition()', ctx), 49);
  assert.equal(vm.runInContext('modeForPosition(0)', ctx), 'RAZLOŽI');
  assert.equal(vm.runInContext('modeForPosition(1)', ctx), 'RAZLOŽI');
  assert.equal(vm.runInContext('modeForPosition(2)', ctx), 'NARIŠI');
  assert.equal(vm.runInContext('modeForPosition(3)', ctx), 'POKAŽI');
  assert.equal(vm.runInContext('modeForPosition(48)', ctx), 'POKAŽI');
});

test('compact board keeps the last team on the lowest visible row', () => {
  const ctx = createGameContext();
  assert.deepEqual(Array.from(vm.runInContext('visibleBoardRowIndexes([0,0],5)', ctx)), [4,3,2,1,0]);
  assert.deepEqual(Array.from(vm.runInContext('visibleBoardRowIndexes([12,30],5)', ctx)), [6,5,4,3,2]);
  assert.deepEqual(Array.from(vm.runInContext('visibleBoardRowIndexes([41,45],5)', ctx)), [9,8]);
  assert.deepEqual(Array.from(vm.runInContext('visibleBoardRowIndexes([48,49],5)', ctx)), [9]);
});

test('responsive board row count grows with available map space', () => {
  const ctx = createGameContext();
  assert.equal(vm.runInContext('responsiveBoardRowCountFromSpace(220,350,4,10)', ctx), 3);
  assert.equal(vm.runInContext('responsiveBoardRowCountFromSpace(340,350,4,10)', ctx), 5);
});

test('normal move bumps opponent back one field when enabled', () => {
  const ctx = createGameContext();
  const result = vm.runInContext(`
    state = freshState();
    state.bumping = true;
    state.teams = [{name:'A',pos:5},{name:'B',pos:8}];
    applyMove(0,3,true);
  `, ctx);
  assert.deepEqual(JSON.parse(JSON.stringify(result)), {
    old: 5,
    pos: 8,
    bumped: [1],
    bumpedDetails: [{team:1,from:8,pos:7}],
    winner: false
  });
  assert.equal(vm.runInContext('state.teams[1].pos', ctx), 7);
});

test('bumping can be disabled before the game', () => {
  const ctx = createGameContext();
  const result = vm.runInContext(`
    state = freshState();
    state.bumping = false;
    state.teams = [{name:'A',pos:5},{name:'B',pos:8}];
    applyMove(0,3,true);
  `, ctx);
  assert.equal(result.bumped.length, 0);
  assert.equal(vm.runInContext('state.teams[1].pos', ctx), 8);
});

test('OPEN 4+2 moves do not bump either team', () => {
  const ctx = createGameContext();
  vm.runInContext(`
    state = freshState();
    state.bumping = true;
    state.teams = [{name:'A',pos:5},{name:'B',pos:4},{name:'C',pos:8}];
    applyMove(1,4,false);
    applyMove(0,2,false);
  `, ctx);
  assert.equal(vm.runInContext('state.teams[1].pos', ctx), 8);
  assert.equal(vm.runInContext('state.teams[2].pos', ctx), 8);
  assert.equal(vm.runInContext('state.teams[0].pos', ctx), 7);
});

test('movement caps at finish and reports a winner', () => {
  const ctx = createGameContext();
  const result = vm.runInContext(`
    state = freshState();
    state.teams = [{name:'A',pos:47},{name:'B',pos:0}];
    applyMove(0,5,true);
  `, ctx);
  assert.equal(result.pos, 49);
  assert.equal(result.winner, true);
});
