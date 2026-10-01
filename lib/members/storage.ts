// Per-member cache namespace. Anonymous records are preserved, never attributed automatically.
let memberId: string | null = null;
export function setStorageMember(id:string|null){memberId=id;}
export function currentStorageMember(){return memberId;}
export function storageKey(key:string){return memberId?`fun-learning:member:${memberId}:${key}`:key;}
const memory=new Map<string,string>();
const failed=new Set<string>();
export function readStorage(key:string){const k=storageKey(key);try{return localStorage.getItem(k)??(failed.has(k)?memory.get(k)??null:null);}catch{return memory.get(k)??null;}}
export function writeStorage(key:string,value:string){const k=storageKey(key);memory.set(k,value);try{localStorage.setItem(k,value);failed.delete(k);}catch(e){failed.add(k);throw e;}}
export function removeStorage(key:string){const k=storageKey(key);memory.delete(k);failed.delete(k);localStorage.removeItem(k);}
export const CLOUD_OPERATION_EVENT='fun-learning:cloud-operation';
export const CLOUD_UPDATED_EVENT='fun-learning:cloud-updated';
export const CLOUD_AUTH_EVENT='fun-learning:cloud-auth';
export function emitOperation(operation:unknown){if(memberId&&typeof window!=='undefined')window.dispatchEvent(new CustomEvent(CLOUD_OPERATION_EVENT,{detail:operation}));}
