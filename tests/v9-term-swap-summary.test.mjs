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

test('one replacement term is allowed and both terms stay blocked for the day',()=>{
  const ctx=createContext();
  const result=JSON.parse(vm.runInContext(`
    TERMS=[
      {text:'prvi pojem',difficulty:3,mode:'RAZLOŽI'},
      {text:'drugi pojem',difficulty:3,mode:'RAZLOŽI'}
    ];
    state=freshState();
    dailyTermsState={date:localDayKey(),terms:[]};
    state.roundDifficulty=3;
    state.challenge={...pickTerm(3,'RAZLOŽI'),mode:'RAZLOŽI'};
    state.termSwapUsed=false;
    challengeTermSeen=true;
    const first=state.challenge.text;
    replaceChallengeTerm();
    const second=state.challenge.text;
    const afterSwapSeen=challengeTermSeen;
    challengeTermSeen=true;
    replaceChallengeTerm();
    JSON.stringify({
      first,second,
      final:state.challenge.text,
      used:state.termSwapUsed,
      afterSwapSeen,
      daily:[...dailyTermsUsed()]
    });
  `,ctx));
  assert.notEqual(result.first,result.second);
  assert.equal(result.final,result.second);
  assert.equal(result.used,true);
  assert.equal(result.afterSwapSeen,false);
  assert.equal(result.daily.length,2);
  assert.ok(result.daily.includes(result.first));
  assert.ok(result.daily.includes(result.second));
});

test('replacement keeps difficulty, mode and OPEN state',()=>{
  const ctx=createContext();
  const result=JSON.parse(vm.runInContext(`
    TERMS=[
      {text:'alpha',difficulty:5,mode:'POKAŽI'},
      {text:'beta',difficulty:5,mode:'POKAŽI'}
    ];
    state=freshState();
    dailyTermsState={date:localDayKey(),terms:[]};
    state.roundDifficulty=5;
    state.openRound=true;
    state.challenge={...pickTerm(5,'POKAŽI'),mode:'POKAŽI'};
    challengeTermSeen=true;
    replaceChallengeTerm();
    JSON.stringify({
      difficulty:state.challenge.difficulty,
      mode:state.challenge.mode,
      openRound:state.openRound,
      roundDifficulty:state.roundDifficulty
    });
  `,ctx));
  assert.deepEqual(result,{difficulty:5,mode:'POKAŽI',openRound:true,roundDifficulty:5});
});

test('normal successful round records game statistics',()=>{
  const ctx=createContext();
  const result=JSON.parse(vm.runInContext(`
    state=freshState();
    state.teams=[
      {name:'A',pos:0,members:[],presenterIndex:0},
      {name:'B',pos:0,members:[],presenterIndex:0}
    ];
    state.stats=freshStats(2);
    state.current=0;
    state.challenge={text:'gravitacija',difficulty:5,mode:'RAZLOŽI'};
    state.roundDifficulty=5;
    state.openRound=false;
    state.screen='result';
    resolveNormal(true);
    JSON.stringify(state.stats);
  `,ctx));
  assert.equal(result.rounds,1);
  assert.equal(result.openRounds,0);
  assert.equal(result.teams[0].rounds,1);
  assert.equal(result.teams[0].normalWins,1);
  assert.equal(result.teams[0].difficultyWins['5'],1);
  assert.equal(result.teams[0].pointsEarned,5);
  assert.deepEqual(result.teams[0].hardest,{text:'gravitacija',difficulty:5,mode:'RAZLOŽI'});
});

test('failed normal round counts the round without awarding a win or points',()=>{
  const ctx=createContext();
  const result=JSON.parse(vm.runInContext(`
    state=freshState();
    state.stats=freshStats(2);
    state.challenge={text:'semafor',difficulty:3,mode:'RAZLOŽI'};
    state.screen='result';
    resolveNormal(false);
    JSON.stringify(state.stats);
  `,ctx));
  assert.equal(result.rounds,1);
  assert.equal(result.teams[0].rounds,1);
  assert.equal(result.teams[0].normalWins,0);
  assert.equal(result.teams[0].pointsEarned,0);
  assert.equal(result.teams[0].hardest,null);
});

test('OPEN result records guesser, awarded points and hardest guessed term',()=>{
  const ctx=createContext();
  const result=JSON.parse(vm.runInContext(`
    state=freshState();
    state.stats=freshStats(2);
    state.teams=[
      {name:'A',pos:0,members:[],presenterIndex:0},
      {name:'B',pos:0,members:[],presenterIndex:0}
    ];
    state.current=0;
    state.challenge={text:'teleskop',difficulty:4,mode:'NARIŠI'};
    state.openRound=true;
    state.screen='result';
    resolveOpen(1);
    JSON.stringify(state.stats);
  `,ctx));
  assert.equal(result.rounds,1);
  assert.equal(result.openRounds,1);
  assert.equal(result.teams[0].rounds,1);
  assert.equal(result.teams[0].pointsEarned,2);
  assert.equal(result.teams[1].rounds,0);
  assert.equal(result.teams[1].openGuesses,1);
  assert.equal(result.teams[1].pointsEarned,4);
  assert.deepEqual(result.teams[1].hardest,{text:'teleskop',difficulty:4,mode:'NARIŠI'});
});

test('undo restores statistics together with positions and turn',()=>{
  const ctx=createContext();
  const result=JSON.parse(vm.runInContext(`
    state=freshState();
    state.stats=freshStats(2);
    state.teams=[
      {name:'A',pos:2,members:[],presenterIndex:0},
      {name:'B',pos:0,members:[],presenterIndex:0}
    ];
    state.current=0;
    state.challenge={text:'semafor',difficulty:3,mode:'RAZLOŽI'};
    state.screen='result';
    resolveNormal(true);
    const recorded=JSON.parse(JSON.stringify(state.stats));
    undoLastResult();
    JSON.stringify({recorded,restored:state.stats,pos:state.teams[0].pos,current:state.current});
  `,ctx));
  assert.equal(result.recorded.rounds,1);
  assert.equal(result.recorded.teams[0].normalWins,1);
  assert.equal(result.restored.rounds,0);
  assert.equal(result.restored.teams[0].normalWins,0);
  assert.equal(result.pos,2);
  assert.equal(result.current,0);
});

test('new game reset clears statistics and term-swap state',()=>{
  const ctx=createContext();
  const result=JSON.parse(vm.runInContext(`
    state=freshState();
    state.termSwapUsed=true;
    state.stats.rounds=12;
    state.stats.openRounds=3;
    state.stats.teams[0].normalWins=5;
    resetRoundData();
    JSON.stringify({swap:state.termSwapUsed,stats:state.stats});
  `,ctx));
  assert.equal(result.swap,false);
  assert.equal(result.stats.rounds,0);
  assert.equal(result.stats.openRounds,0);
  assert.equal(result.stats.teams[0].normalWins,0);
});

test('legacy saves without stats normalize to an empty summary',()=>{
  const ctx=createContext();
  const result=JSON.parse(vm.runInContext(`
    JSON.stringify(normalizeState({
      teams:[{name:'A',pos:4},{name:'B',pos:2}],
      screen:'board'
    }).stats);
  `,ctx));
  assert.equal(result.rounds,0);
  assert.equal(result.openRounds,0);
  assert.equal(result.teams.length,2);
});

test('winner summary renders per-team statistics and hardest guess',()=>{
  const ctx=createContext();
  const html=vm.runInContext(`
    state=freshState();
    state.teams=[
      {name:'A',pos:49,members:[],presenterIndex:0},
      {name:'B',pos:30,members:[],presenterIndex:0}
    ];
    state.stats=freshStats(2);
    state.stats.rounds=7;
    state.stats.openRounds=2;
    state.stats.teams[0]={rounds:4,normalWins:3,difficultyWins:{3:1,4:1,5:1},openGuesses:1,pointsEarned:18,hardest:{text:'gravitacija',difficulty:5,mode:'RAZLOŽI'}};
    gameSummaryHtml(state.teams.map((t,i)=>({...t,i})));
  `,ctx);
  assert.match(html,/Povzetek igre/);
  assert.match(html,/7 rund/);
  assert.match(html,/OPEN: 2/);
  assert.match(html,/gravitacija/);
  assert.match(html,/3 \/ 4 \/ 5/);
});

test('challenge UI exposes one replacement only after the term is seen',()=>{
  const round=fs.readFileSync('www/app/round.js','utf8');
  assert.match(round,/id="swapTermButton"/);
  assert.match(round,/DRUG POJEM · 1×/);
  assert.match(round,/if\(state\.termSwapUsed\|\|!challengeTermSeen\|\|!state\.challenge\)return/);
  assert.match(round,/swapButton\.disabled=false/);
});
