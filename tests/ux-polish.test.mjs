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
    setTimeout: () => 1,
    clearTimeout: () => {},
    requestAnimationFrame: () => 1,
    confirm: () => true,
    localStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: (key) => storage.delete(key),
    },
    navigator: {},
    document: { getElementById: () => null },
    window: { innerHeight: 800, addEventListener: () => {} },
  });
  context.window.window = context.window;
  context.window.Capacitor = undefined;
  for (const file of ['www/app/core.js','www/app/home-setup.js','www/app/board.js','www/app/round.js','www/app/result.js']) {
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

test('privacy policy is accessible from settings without replacing an unfinished game snapshot', () => {
  const ctx = createContext();
  const settingsHtml = vm.runInContext(`
    state=freshState();
    state.screen='settings';
    const app={innerHTML:''};
    renderSettings(app);
    app.innerHTML;
  `, ctx);
  assert.match(settingsHtml, /PRAVILNIK O ZASEBNOSTI/);

  const privacyHtml = vm.runInContext(`
    state=freshState();
    state.screen='privacy';
    pendingResumeScreen='board';
    const app={innerHTML:''};
    renderPrivacy(app);
    JSON.stringify({html:app.innerHTML,saved:storageSnapshot().screen});
  `, ctx);
  const parsed = JSON.parse(privacyHtml);
  assert.match(parsed.html, /Hramba in izbris/);
  assert.match(parsed.html, /Android dovoljenja za dostop do interneta/);
  assert.equal(parsed.saved, 'board');
});

test('replay keeps teams and preferences including game length but resets gameplay', () => {
  const ctx = createContext();
  const result = vm.runInContext(`
    state=freshState();
    state.teams=[{name:'Mavrice',pos:22,members:['Ana','Bine'],presenterIndex:1},{name:'Volkovi',pos:17,members:[],presenterIndex:0}];
    state.duration=90;state.gameLength=30;state.bumping=false;state.sound=false;state.vibration=false;
    state.used={'3:RAZLOŽI':['semafor']};state.winner=0;state.lastMove='x';
    replaySameTeams();
    JSON.stringify(state);
  `, ctx);
  const state = JSON.parse(result);
  assert.deepEqual(state.teams, [{name:'Mavrice',pos:0,members:['Ana','Bine'],presenterIndex:0},{name:'Volkovi',pos:0,members:[],presenterIndex:0}]);
  assert.equal(state.duration, 90);
  assert.equal(state.gameLength, 30);
  assert.equal(state.bumping, false);
  assert.equal(state.sound, false);
  assert.equal(state.vibration, false);
  assert.equal(state.countdown, true);
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

test('game length normalizes and caps movement at the selected finish', () => {
  const ctx = createContext();
  const normalized = JSON.parse(vm.runInContext(`JSON.stringify(normalizeState({gameLength:30,teams:[{name:'A',pos:99},{name:'B',pos:0}]}))`,ctx));
  assert.equal(normalized.gameLength,30);
  assert.equal(normalized.teams[0].pos,31);
  const result = JSON.parse(vm.runInContext(`
    state=freshState();state.gameLength=30;state.teams=[{name:'A',pos:28},{name:'B',pos:0}];
    JSON.stringify(applyMove(0,5,true));
  `,ctx));
  assert.equal(result.pos,31);
  assert.equal(result.winner,true);
});

test('board geometry supports 30, 40 and 48 field games', () => {
  const ctx = createContext();
  const rowCounts = JSON.parse(vm.runInContext(`
    JSON.stringify([30,40,48].map(gameLength=>{state=freshState();state.gameLength=gameLength;return logicalBoardRows().length;}))
  `,ctx));
  assert.deepEqual(rowCounts,[7,9,10]);
});

test('viewport keeps the rearmost player on the lowest visible row', () => {
  const ctx = createContext();
  const indexes = JSON.parse(vm.runInContext(`
    state=freshState();state.gameLength=48;JSON.stringify(visibleBoardRowIndexes([12,18],5))
  `,ctx));
  assert.equal(indexes.at(-1),2);
});

test('movement queue describes every intermediate field', () => {
  const ctx = createContext();
  const frames = JSON.parse(vm.runInContext(`
    state=freshState();state.teams=[{name:'A',pos:2},{name:'B',pos:0}];
    const result=applyMove(0,4,true);queueMoveAnimation(0,result);prepareMoveAnimation();JSON.stringify(moveAnimationFrames)
  `,ctx));
  assert.deepEqual(frames.map(f=>f.pos),[3,4,5,6]);
});

test('board layout no longer pushes the turn card to the bottom', () => {
  const css=fs.readFileSync('www/board-viewport.css','utf8');
  assert.doesNotMatch(css,/\.turnCard\{[^}]*margin-top\s*:\s*auto/);
  assert.match(css,/\.turnCard\{[^}]*margin\s*:\s*0/);
});
