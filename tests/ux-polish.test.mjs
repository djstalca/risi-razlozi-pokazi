import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function createContext(){
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
    confirm: () => true,
    localStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: (key) => storage.delete(key),
    },
    navigator: {},
    document: { getElementById: () => null },
    window: {},
  });
  context.window = context;
  for (const file of ['www/app/core.js','www/app/home-setup.js','www/app/round.js','www/app/result.js']) {
    vm.runInContext(fs.readFileSync(file, 'utf8'), context, { filename: file });
  }
  return context;
}

test('sound and vibration preferences normalize and persist', () => {
  const ctx = createContext();
  assert.equal(vm.runInContext('freshState().sound', ctx), true);
  assert.equal(vm.runInContext('freshState().vibration', ctx), true);
  assert.equal(vm.runInContext('normalizeState({sound:false,vibration:false}).sound', ctx), false);
  assert.equal(vm.runInContext('normalizeState({sound:false,vibration:false}).vibration', ctx), false);
});

test('settings screen does not replace an unfinished game snapshot', () => {
  const ctx = createContext();
  const screen = vm.runInContext(`
    state=freshState();
    state.screen='settings';
    pendingResumeScreen='board';
    storageSnapshot().screen;
  `, ctx);
  assert.equal(screen, 'board');
});

test('replay keeps teams and preferences but resets gameplay', () => {
  const ctx = createContext();
  const result = vm.runInContext(`
    state=freshState();
    state.teams=[{name:'Mavrice',pos:22},{name:'Volkovi',pos:17}];
    state.duration=90;state.bumping=false;state.sound=false;state.vibration=false;
    state.used={'3:RAZLOŽI':['semafor']};state.winner=0;state.lastMove='x';
    replaySameTeams();
    JSON.stringify(state);
  `, ctx);
  const state = JSON.parse(result);
  assert.deepEqual(state.teams, [{name:'Mavrice',pos:0},{name:'Volkovi',pos:0}]);
  assert.equal(state.duration, 90);
  assert.equal(state.bumping, false);
  assert.equal(state.sound, false);
  assert.equal(state.vibration, false);
  assert.deepEqual(state.used, {});
  assert.equal(state.screen, 'board');
  assert.equal(state.winner, null);
});

test('challenge starts with the secret term hidden behind hold control', () => {
  const ctx = createContext();
  const html = vm.runInContext(`
    state=freshState();
    state.challenge={text:'semafor',difficulty:3,mode:'RAZLOŽI'};
    state.openRound=false;
    const app={innerHTML:''};
    renderChallenge(app);
    app.innerHTML;
  `, ctx);
  assert.match(html, /id="secretWord" hidden/);
  assert.match(html, /PRITISNI IN DRŽI ZA POJEM/);
  assert.match(html, /ZAČNI RUNDO/);
});
