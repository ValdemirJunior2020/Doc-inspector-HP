import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";

const source=readFileSync("src/harper-worker-entry.js","utf8")
  .replace(/^import .+;\s*$/gm,"");
let onmessage,posted;
const context={
  LocalLinter:class{async lint(){return [];}},
  binaryInlined:{},
  self:{addEventListener:(name,fn)=>{if(name==="message")onmessage=fn;},
    postMessage:(result)=>{posted=result;}}
};
vm.createContext(context);
vm.runInContext(source,context);
assert.equal(typeof onmessage,"function");
const note="GST CALLED AND WAS VERY UPSETT BECUZ I TRYED TO CALL FD BUT NOBODY ANSWERD. REFUNND WAS NOT APROVED. FOLLOW UP TOMMOROW. H20702662";
await onmessage({data:{id:1,text:note,approved:["GST","FD","FOC","CXL","SW","HTL","RP"]}});
assert.equal(posted.id,1);
assert.equal(posted.error,undefined);
for(const word of ["upset","because","tried","answered","refund","approved","tomorrow"]){
  assert.match(posted.text,new RegExp("\\b"+word+"\\b","i"),word);
}
for(const word of ["UPSETT","BECUZ","TRYED","ANSWERD","REFUNND","APROVED","TOMMOROW"]){
  assert.doesNotMatch(posted.text,new RegExp("\\b"+word+"\\b","i"),word);
}
assert.match(posted.text,/\bGST\b/);
assert.match(posted.text,/\bFD\b/);
assert.match(posted.text,/\bH20702662\b/);
console.log("Offline spelling integration regression passed.");
