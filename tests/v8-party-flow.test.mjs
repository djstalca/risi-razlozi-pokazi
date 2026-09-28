import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function createContext(){
  const storage=new Map();
  const context=vm.createContext({
    console,Math,Date,JSON,Promise,
    setInterval:()=>1,clearInterval:()=>{},
    setTimeout:()=>1,clearTimeout:()=>{},
    requestAnimationFrame:()=>1,cancelAnimationFrame:()=>{},
    confirm:()=>true,alert:()=>{},
    localStorage:{
      getItem:(key)=>storage.get(key)??null,
      setItem:(key,value)=>storage.set(key,value),
      removeItem:(key)=>storage.delete(key),
    },
    navigator:{},
    document:{
      getElementById:()=>null,
      querySelector:()=>null,
      addEventListener:()=>{},
    },
    window:{
      innerHeight:800,
      addEventListener:()=>{},
      visualViewport:{addEventListener:()=>{}},
      Capacitor:undefined,
    },
  });
  context.window.window=context.window;
  for(const file of ['www/app/core.js','www/app/home-setup.js','www/app/board.js','www/app/round.js','www/app/result.js']){
    vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});
  }
  return context;
}

test('countdown preference defaults on and can be disabled',()=>{
  const ctx=createContext();
  assert.equal(vm.runInContext('freshState().countdown',ctx),true);
  assert.equal(vm.runInContext('normalizeState({countdown:false}).countdown',ctx),false);
});

test('team members normalize and presenter rotation wraps',()=>{
  const ctx=createContext();
  const result=JSON.parse(vm.runInContext(`
    state=normalizeState({
      teams:[
        {name:'A',pos:0,members:['Ana','Bine','Cene'],presenterIndex:2},
        {name:'B',pos:0,members:[],presenterIndex:5}
      ]
    });
    const before=teamPresenter(state.teams[0]);
    advancePresenter(0);
    const after=teamPresenter(state.teams[0]);
    JSON.stringify({before,after,emptyIndex:state.teams[1].presenterIndex});
  `,ctx));
  assert.equal(result.before,'Cene');
  assert.equal(result.after,'Ana');
  assert.equal(result.emptyIndex,0);
});

test('replay resets presenter order but preserves player names',()=>{
  const ctx=createContext();
  const result=JSON.parse(vm.runInContext(`
    state=freshState();
    state.teams=[
      {name:'A',pos:12,members:['Ana','Bine'],presenterIndex:1},
      {name:'B',pos:8,members:['Cene'],presenterIndex:0}
    ];
    resetRoundData();
    JSON.stringify(state.teams);
  `,ctx));
  assert.deepEqual(result,[
    {name:'A',pos:0,members:['Ana','Bine'],presenterIndex:0},
    {name:'B',pos:0,members:['Cene'],presenterIndex:0}
  ]);
});

test('start round enters 3-2-1 countdown when enabled',()=>{
  const ctx=createContext();
  const result=JSON.parse(vm.runInContext(`
    state=freshState();
    state.sound=false;
    state.countdown=true;
    state.challenge={text:'semafor',difficulty:3,mode:'RAZLOŽI'};
    challengeTermSeen=true;
    const before=Date.now();
    startRound();
    JSON.stringify({
      screen:state.screen,
      countdownEnd:state.countdownEnd,
      timerEnd:state.timerEnd,
      before
    });
  `,ctx));
  assert.equal(result.screen,'countdown');
  assert.equal(result.timerEnd,null);
  assert.ok(result.countdownEnd>result.before);
});

test('start round skips countdown when preference is off',()=>{
  const ctx=createContext();
  const result=JSON.parse(vm.runInContext(`
    state=freshState();
    state.sound=false;
    state.countdown=false;
    state.challenge={text:'semafor',difficulty:3,mode:'RAZLOŽI'};
    challengeTermSeen=true;
    startRound();
    JSON.stringify({screen:state.screen,countdownEnd:state.countdownEnd,timerEnd:state.timerEnd});
  `,ctx));
  assert.equal(result.screen,'timer');
  assert.equal(result.countdownEnd,null);
  assert.ok(Number.isFinite(result.timerEnd));
});

test('result undo restores positions, turn and presenter',()=>{
  const ctx=createContext();
  const result=JSON.parse(vm.runInContext(`
    state=freshState();
    state.teams=[
      {name:'A',pos:2,members:['Ana','Bine'],presenterIndex:0},
      {name:'B',pos:0,members:['Cene'],presenterIndex:0}
    ];
    state.current=0;
    state.challenge={text:'semafor',difficulty:3,mode:'RAZLOŽI'};
    state.roundDifficulty=3;
    state.openRound=false;
    state.screen='result';
    resolveNormal(true);
    const moved={
      pos:state.teams[0].pos,
      current:state.current,
      presenterIndex:state.teams[0].presenterIndex,
      canUndo:resultUndoAvailable()
    };
    undoLastResult();
    JSON.stringify({
      moved,
      restored:{
        pos:state.teams[0].pos,
        current:state.current,
        presenterIndex:state.teams[0].presenterIndex,
        screen:state.screen,
        term:state.challenge?.text
      }
    });
  `,ctx));
  assert.equal(result.moved.pos,5);
  assert.equal(result.moved.current,1);
  assert.equal(result.moved.presenterIndex,1);
  assert.equal(result.moved.canUndo,true);
  assert.deepEqual(result.restored,{
    pos:2,current:0,presenterIndex:0,screen:'result',term:'semafor'
  });
});

test('OPEN round advances only the active presenter',()=>{
  const ctx=createContext();
  const result=JSON.parse(vm.runInContext(`
    state=freshState();
    state.teams=[
      {name:'A',pos:1,members:['Ana','Bine'],presenterIndex:0},
      {name:'B',pos:1,members:['Cene','Dora'],presenterIndex:0}
    ];
    state.current=0;
    state.challenge={text:'test',difficulty:4,mode:'RAZLOŽI'};
    state.openRound=true;
    resolveOpen(1);
    JSON.stringify(state.teams.map(t=>t.presenterIndex));
  `,ctx));
  assert.deepEqual(result,[1,0]);
});

test('starting the next round clears result undo',()=>{
  const ctx=createContext();
  const result=vm.runInContext(`
    state=freshState();
    state.undoResult={expiresAt:Date.now()+8000,snapshot:{}};
    prepareRound();
    state.undoResult===null;
  `,ctx);
  assert.equal(result,true);
});

test('setup exposes optional player rosters and settings expose countdown',()=>{
  const setup=fs.readFileSync('www/app/home-setup.js','utf8');
  assert.match(setup,/Igralci <small>\(opcijsko\)<\/small>/);
  assert.match(setup,/addTeamMember/);
  assert.match(setup,/removeTeamMember/);
  assert.match(setup,/Odštevanje pred rundo/);
});
