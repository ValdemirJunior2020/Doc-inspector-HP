import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
import {build} from "esbuild";
const built=await build({
  entryPoints:["src/vendor/opengrammar/rules/categories/grammar.ts"],
  bundle:true,format:"esm",platform:"browser",write:false,logLevel:"silent"
});
const esm=built.outputFiles[0].text;
const rules=await import("data:text/javascript;base64,"+Buffer.from(esm).toString("base64"));
assert.ok(rules.basicGrammarRules.some(rule=>rule.id==="alot"));
const worker=readFileSync("src/harper-worker-entry.js","utf8");
const start=worker.indexOf("const OPEN_GRAMMAR_SAFE_IDS=");
const end=worker.indexOf("async function improve(text,approved)",start);
assert.ok(start>0&&end>start);
const context={basicGrammarRules:rules.basicGrammarRules,protectedWord:(word,approved)=>approved.has(word.toUpperCase())};
vm.createContext(context);
const apply=vm.runInContext(worker.slice(start,end)+";applyOpenGrammarRules",context);
const checked=apply("The agent taked alot of time.",new Set(["GST","FD"]));
assert.equal(checked.text,"The agent took a lot of time.");
assert.equal(apply("GST called to CXL H20702662. Refund pending.",new Set(["GST","CXL"])).text,"GST called to CXL H20702662. Refund pending.");
console.log("Bundled OpenGrammar offline rule tests passed.");
