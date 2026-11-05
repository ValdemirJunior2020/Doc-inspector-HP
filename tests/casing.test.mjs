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
  ["HE PAID $114.52 AND SW FD","He paid $114.52 and SW FD."],
  ["GST WAS UPSETT BECUZ I TRYED TO CALL FD BUT NOBODY ANSWERD. REFUNND NOT APROVED.",
   "GST was upset because I tried to call FD but nobody answered. Refund not approved."],
  ["GST called becuz the reservaton was not in the sistem.", "GST called because the reservation was not in the system."],
  ["TOMMOROW I WILL FALLOW UP", "Tomorrow I will follow up."]
]) assert.equal(improve(given),expected,JSON.stringify(given));
console.log("Casing and punctuation regression tests passed");

// Regression: messy notes must be readable without changing stated outcomes.
const messy = "GST CALLED YESTERDAY AND HE WAS VERY UPSETT BECUZ HIS RESERVATON WAS NOT SHOWING AT THE HTL,,, I TRYED TO CALL THE FD BUT NOBODY ANSWERD!!! AFTER 20 MINUTS I FINALY SW WITH THE MANGER WHO SAY THEY DONT HAVE THE RSV IN THERE SISTEM... GST WAS ASKING FOR A REFUNND BUT I DIDNT KNOW IF IT WAS APROVED OR NOT SO I TOLD HIM MAYBE WE CAN DO IT??? I ALSO SEND A EM TO RP AND THEY HAVENT REPLY YET!! GST SAID HE WANT TO CXL EVERYTHING BUT I CANNOT CONFIRM THE CXL WAS COMPLETED.. I TOLD HIM TO CALL BACK TOMMOROW BECAUSE I DONT KNOW WHAT ELSE TO DO,,,, THE GST WAS VERY ANGRY AND ASK FOR SUPERVISER BUT I DIDNT TRANSFER HIM BCZ THE SUPERVISER WAS BUSSY!!! I NEED SOMEONE TO FALLOW UP ASAP!!!! H20702662";
const result=improve(messy);
for(const phrase of ["upset because","reservation was not showing","nobody answered!","manager who said","their system.","refund but I didn't know if it was approved or not","I also sent an EM","they haven't replied yet","GST said he wanted to CXL","I cannot confirm the CXL was completed.","asked for a supervisor","supervisor was busy!","H20702662"]){
 assert.ok(result.includes(phrase), `Expected phrase: ${phrase}; result: ${result}`);
}
for(const bad of ["upsett","becuz","refunnd","tommorow","bussy","!!!","???",",,,","..."]){
 assert.ok(!result.toLowerCase().includes(bad), `Still contains: ${bad}`);
}
console.log("Messy note grammar and punctuation regression passed");
