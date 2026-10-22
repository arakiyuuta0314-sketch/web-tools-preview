// All savings are kept in one atomic localStorage document.
// Version 1 backups and on-device data migrate without data loss.
export const VERSION = 2;
export const COIN_VALUE = 500;
export const MAX_COINS = 1_000_000;
export const MAX_GOAL = 500_000_000;
export const MAX_ARCHIVES = 500;
export const MAX_ALL_ENTRIES = 100_000;

const idPattern=/^[A-Za-z0-9_-]{8,70}$/;
const isoDate=(value)=>typeof value==='string'&&Number.isFinite(Date.parse(value));
const generateId=()=>globalThis.crypto?.randomUUID?.()??('cycle'+Date.now()+Math.random().toString(36).slice(2));
export function newState(goal=50_000,sound=true) {
  return validateState({version:VERSION,goal,entries:[],sound,archives:[]});
}
function checkEntries(entries,seen){
  if(!Array.isArray(entries))throw new Error('貯金の記録件数が不正です');
  let coins=0;
  const normalized=[];
  for(const item of entries){
    if(!item||typeof item!=='object'||!Number.isSafeInteger(item.change)||![-1,1].includes(item.change)||
      typeof item.id!=='string'||!idPattern.test(item.id)||!isoDate(item.at)||seen.has(item.id))throw new Error('貯金の記録に不正があります');
    seen.add(item.id);
    coins+=item.change;
    if(coins<0||coins>MAX_COINS)throw new Error('貯金残高が不正です');
    normalized.push({id:item.id,at:item.at,change:item.change});
  }
  return {entries:normalized,coins};
}
function checkGoal(goal){
  if(!Number.isSafeInteger(goal)||goal<COIN_VALUE||goal>MAX_GOAL||goal%COIN_VALUE!==0)
    throw new Error('目標金額が不正です');
}
export function balanceCoins(state){
  return state.entries.reduce((n,item)=>n+item.change,0);
}
export function stats(state){
  const coins=balanceCoins(state),yen=coins*COIN_VALUE;
  return {coins,yen,goal:state.goal,remainingYen:Math.max(0,state.goal-yen),
    remainingCoins:Math.ceil(Math.max(0,state.goal-yen)/COIN_VALUE),
    progress:Math.min(100,Math.round((yen/state.goal)*100)),reached:yen>=state.goal};
}
export function validateState(input){
  if(!input||typeof input!=='object'||input.version!==VERSION)throw new Error('保存データのバージョンが異なります');
  checkGoal(input.goal);
  if(typeof input.sound!=='boolean')throw new Error('設定値が不正です');
  if(!Array.isArray(input.archives)||input.archives.length>MAX_ARCHIVES)throw new Error('過去の貯金件数が不正です');
  const seen=new Set(),cycleIds=new Set();
  const current=checkEntries(input.entries,seen);
  const archives=input.archives.map(a=>{
    if(!a||typeof a!=='object'||typeof a.id!=='string'||!idPattern.test(a.id)||cycleIds.has(a.id)||!isoDate(a.endedAt))
      throw new Error('過去の貯金情報が不正です');
    cycleIds.add(a.id);checkGoal(a.goal);
    const checked=checkEntries(a.entries,seen);
    if(checked.entries.length===0)throw new Error('空の貯金履歴は保存できません');
    return {id:a.id,endedAt:a.endedAt,goal:a.goal,entries:checked.entries};
  });
  const count=current.entries.length+archives.reduce((n,a)=>n+a.entries.length,0);
  if(count>MAX_ALL_ENTRIES)throw new Error('貯金記録の上限を超えました');
  return {version:VERSION,goal:input.goal,sound:input.sound,entries:current.entries,archives};
}
export function record(state,change,id=generateId(),at=new Date().toISOString()){
  if(![-1,1].includes(change))throw new Error('変更枚数が不正です');
  const n=balanceCoins(state)+change;
  if(n<0)throw new Error('取り出せる500円玉がありません');
  if(n>MAX_COINS)throw new Error('記録の上限を超えました');
  return validateState({...state,entries:[...state.entries,{id,at,change}]});
}
export function undo(state){
  if(state.entries.length===0)throw new Error('取り消す記録がありません');
  return validateState({...state,entries:state.entries.slice(0,-1)});
}
export function setGoal(state,yen){return validateState({...state,goal:yen});}
export function setSound(state,enabled){return validateState({...state,sound:Boolean(enabled)});}
export function startNewCycle(state,id=generateId(),endedAt=new Date().toISOString()){
  const before=validateState(state);
  if(before.entries.length===0)throw new Error('まだ貯金の記録がありません');
  return validateState({...before,entries:[],
    archives:[...before.archives,{id,endedAt,goal:before.goal,entries:before.entries}]});
}
export function archiveStats(archive){
  const coins=archive.entries.reduce((n,x)=>n+x.change,0);
  const yen=coins*COIN_VALUE;
  return {coins,yen,goal:archive.goal,reached:yen>=archive.goal,endedAt:archive.endedAt};
}
function migrateLegacy(input){
  if(!input||typeof input!=='object'||input.version!==1)return input;
  if('archives'in input)throw new Error('旧形式のデータに不正があります');
  return {version:VERSION,goal:input.goal,sound:input.sound,entries:input.entries,archives:[]};
}
export function fromJson(text){
  let parsed;
  try{parsed=JSON.parse(text);}catch{throw new Error('JSONファイルを読み取れません');}
  return validateState(migrateLegacy(parsed));
}
export function toJson(state){return JSON.stringify(validateState(state),null,2);}
