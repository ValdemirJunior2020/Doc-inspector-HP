import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
const source=readFileSync("inspector.js","utf8");
const start=source.indexOf("function normalizeAllCaps(note) {");
const end=source.indexOf("function isReservationPage(){",start);
assert.ok(start>0&&end>start,"Could not locate casing functions");
const code=source.slice(start,end);
const approved={"GST":"GUEST","SW":"SPOKE WITH","FD":"FRONT DESK","CXL":"CANCEL","FOC":"FREE OF CHARGES","RSV":"RESERVATION"};
const context={settings:{expand:false},dictionary:()=>approved,expand:x=>x};
vm.createContext(context);
const improve=vm.runInContext(code+";conservativeImprove",context);
for(const [given,expected] of [
  ["I CANNOT","I cannot."],
  ["NO REFUND","No refund."],
  ["GST CALLED TO CXL H20702662","GST called to CXL H20702662."],
  ["FOC APPROVED","FOC approved."],
  ["I CANNOT PROCESS REFUND","I cannot process refund."],
  ["GST SW FD","GST SW FD."],
  ["guest called to cancel","Guest called to cancel."],
  ["HE PAID $114.52 AND SW FD","He paid $114.52 and SW FD."]
]) assert.equal(improve(given),expected,JSON.stringify(given));
console.log("Casing and punctuation regression tests passed");
