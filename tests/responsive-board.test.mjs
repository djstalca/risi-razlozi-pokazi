import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function createContext(){
  const storage=new Map();
  const context=vm.createContext({
    console,Math,Date,JSON,
    setTimeout:()=>1,clearTimeout:()=>{},
    setInterval:()=>1,clearInterval:()=>{},
    requestAnimationFrame:()=>1,cancelAnimationFrame:()=>{},
    localStorage:{
      getItem:key=>storage.get(key)??null,
      setItem:(key,value)=>storage.set(key,value),
      removeItem:key=>storage.delete(key),
    },
    navigator:{},
    document:{getElementById:()=>null,querySelector:()=>null},
    window:{innerHeight:800,addEventListener:()=>{},visualViewport:null},
  });
  context.window.window=context.window;
  context.window.Capacitor=undefined;
  for(const file of ['www/app/core.js','www/app/board.js']){
    vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});
  }
  return context;
}

test('board fits more rows when more vertical space is available',()=>{
  const ctx=createContext();
  const counts=JSON.parse(vm.runInContext(`JSON.stringify([
    responsiveBoardRowCountFromSpace(260,330,4,10),
    responsiveBoardRowCountFromSpace(420,330,4,10),
    responsiveBoardRowCountFromSpace(560,330,4,10)
  ])`,ctx));
  assert.ok(counts[0]<counts[1]);
  assert.ok(counts[1]<counts[2]);
});

test('responsive calculation remains bounded by the logical board',()=>{
  const ctx=createContext();
  assert.equal(vm.runInContext('responsiveBoardRowCountFromSpace(5000,330,4,7)',ctx),7);
  assert.equal(vm.runInContext('responsiveBoardRowCountFromSpace(40,330,4,10)',ctx),3);
});

test('board layout uses remaining height rather than team-count breakpoints',()=>{
  const board=fs.readFileSync('www/app/board.js','utf8');
  const css=fs.readFileSync('www/board-viewport.css','utf8');
  assert.doesNotMatch(board,/teams>=4&&height<930/);
  assert.doesNotMatch(board,/teams===3&&height<840/);
  assert.match(board,/measureResponsiveBoardRowCount/);
  assert.match(css,/\.boardViewportCard\{[^}]*flex:1 1 0/);
  assert.match(css,/grid-template-rows:repeat\(var\(--board-row-count,5\),minmax\(0,1fr\)\)/);
});
