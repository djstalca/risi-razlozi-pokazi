import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

function createGameContext(){
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
    document:{getElementById:()=>null,querySelector:()=>null},
    window:{innerHeight:800,addEventListener:()=>{},visualViewport:{addEventListener:()=>{}}},
  });
  context.window.window=context.window;
  context.window.Capacitor=undefined;
  for(const file of ['www/app/core.js','www/app/home-setup.js','www/app/board.js','www/app/round.js','www/app/result.js']){
    vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});
  }
  return context;
}

function loadTerms(){
  const context=vm.createContext({window:{}});
  context.window.window=context.window;
  const dir='www/terms';
  for(const file of fs.readdirSync(dir).filter(name=>name.endsWith('.js')).sort()){
    vm.runInContext(fs.readFileSync(path.join(dir,file),'utf8'),context,{filename:file});
  }
  return context.window.TERMS;
}

test('expanded library has 720 unique terms and 80 in every mode/difficulty bucket',()=>{
  const terms=loadTerms();
  assert.equal(terms.length,720);
  assert.equal(new Set(terms.map(t=>t.text.toLocaleLowerCase('sl-SI'))).size,720);
  for(const difficulty of [3,4,5]){
    for(const mode of ['RAZLOŽI','NARIŠI','POKAŽI']){
      assert.equal(terms.filter(t=>t.difficulty===difficulty&&t.mode===mode).length,80,`${difficulty}:${mode}`);
    }
  }
});

test('difficulty curation keeps clear progression examples',()=>{
  const terms=loadTerms();
  const find=(text)=>terms.find(t=>t.text===text);
  assert.equal(find('helikopter')?.difficulty,3);
  assert.equal(find('helikopter')?.mode,'NARIŠI');
  assert.equal(find('teleskop')?.difficulty,4);
  assert.equal(find('teleskop')?.mode,'NARIŠI');
  assert.equal(find('sončev sistem')?.difficulty,5);
  assert.equal(find('sončev sistem')?.mode,'NARIŠI');
  assert.equal(find('prometna nesreča')?.difficulty,4);
  assert.equal(find('prometna nesreča')?.mode,'RAZLOŽI');
  assert.equal(find('gravitacija')?.difficulty,5);
  assert.equal(find('gravitacija')?.mode,'RAZLOŽI');
});

test('a term cannot be selected twice on the same local day even across game resets',()=>{
  const ctx=createGameContext();
  const result=JSON.parse(vm.runInContext(`
    TERMS=[
      {text:'prvi',difficulty:3,mode:'RAZLOŽI'},
      {text:'drugi',difficulty:3,mode:'RAZLOŽI'}
    ];
    state=freshState();
    dailyTermsState={date:localDayKey(),terms:[]};
    const first=pickTerm(3,'RAZLOŽI');
    resetRoundData();
    const second=pickTerm(3,'RAZLOŽI');
    const third=pickTerm(3,'RAZLOŽI');
    JSON.stringify({
      first:first?.text,
      second:second?.text,
      third:third?.text??null,
      daily:[...dailyTermsUsed()]
    });
  `,ctx));
  assert.notEqual(result.first,result.second);
  assert.equal(result.third,null);
  assert.deepEqual(new Set(result.daily),new Set(['prvi','drugi']));
});

test('daily history resets automatically when the local calendar date changes',()=>{
  const ctx=createGameContext();
  const count=vm.runInContext(`
    dailyTermsState={date:'2000-01-01',terms:['semafor']};
    dailyTermsUsed().size;
  `,ctx);
  assert.equal(count,0);
});

test('daily term history is separate from the saved game snapshot',()=>{
  const ctx=createGameContext();
  const result=JSON.parse(vm.runInContext(`
    state=freshState();
    rememberDailyTerm('semafor');
    state.used={'3:RAZLOŽI':['semafor']};
    resetRoundData();
    JSON.stringify({used:state.used,daily:[...dailyTermsUsed()]});
  `,ctx));
  assert.deepEqual(result.used,{});
  assert.deepEqual(result.daily,['semafor']);
});
