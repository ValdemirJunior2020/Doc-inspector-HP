import { LocalLinter } from "harper.js";
import { binaryInlined } from "harper.js/binaryInlined";

// Private offline worker. It never sends notes to a network service.
const linter = new LocalLinter({binary:binaryInlined});
const COMMON_TYPOS = Object.freeze({
  "upsett":"upset","becuz":"because","tryed":"tried","answerd":"answered",
  "minuts":"minutes","finaly":"finally","manger":"manager","sistem":"system",
  "refunnd":"refund","aproved":"approved","tommorow":"tomorrow",
  "fallow":"follow","superviser":"supervisor","bussy":"busy",
  "reservaton":"reservation","realy":"really","recieve":"receive",
  "dont":"don't","didnt":"didn't","havent":"haven't","couldnt":"couldn't",
  "wasnt":"wasn't","wont":"won't","cant":"can't"
});
const SENSITIVE_WORDS = new Set([
  "approved","denied","declined","issued","paid","completed","refunded","cancelled",
  "canceled","pending","processed","confirmed","authorized","accepted","rejected"
]);
function matchedCase(previous,next) {
  if(previous.toUpperCase()===previous && previous.length>1)return next.toUpperCase();
  if(previous[0]===previous[0].toUpperCase())return next[0].toUpperCase()+next.slice(1);
  return next;
}
function protectedWord(word,approved) {
  return approved.has(word.toUpperCase()) || /^H\d{8}$/i.test(word) ||
    /\d/.test(word) || /^[A-Z]{2,4}$/.test(word) || word.includes("@");
}
function replaceWordTypos(text,approved) {
  return text.replace(/\b[A-Za-z]+(?:['’][A-Za-z]+)?\b/g,word=>{
    if(protectedWord(word,approved))return word;
    const fix=COMMON_TYPOS[word.toLowerCase()];
    return fix?matchedCase(word,fix):word;
  });
}
function isSafeSingleWordCorrection(original,replacement,approved) {
  if(!/^[A-Za-z]+(?:['’][A-Za-z]+)?$/.test(original))return false;
  if(!/^[A-Za-z]+(?:['’][A-Za-z]+)?$/.test(replacement))return false;
  if(protectedWord(original,approved))return false;
  if(SENSITIVE_WORDS.has(original.toLowerCase()) && !COMMON_TYPOS[original.toLowerCase()])return false;
  // Avoid rephrasing entire clauses or changing business outcomes.
  if(Math.abs(replacement.length-original.length)>3)return false;
  if(original.toLowerCase()===replacement.toLowerCase())return false;
  return true;
}
async function improve(text,approved) {
  let output=replaceWordTypos(text,approved);
  let count=0, remaining=0;
  // Re-lint after each replacement because Harper spans refer to the current text.
  // Limit passes for responsiveness and avoid competing grammar edits.
  for(let pass=0;pass<20;pass++){
    const lints=await linter.lint(output,{language:"plaintext"});
    let changed=false;
    for(const lint of lints){
      if(lint.suggestion_count()===0)continue;
      const span=lint.span();
      if(span.start>=span.end)continue;
      const source=Array.from(output).slice(span.start,span.end).join("");
      if(!/^[A-Za-z]+(?:['’][A-Za-z]+)?$/.test(source))continue;
      const suggestions=lint.suggestions();
      const replacement=suggestions[0]?.get_replacement_text?.();
      if(typeof replacement!=="string"||!isSafeSingleWordCorrection(source,replacement,approved))continue;
      // Only apply replacements which affect the same single word.
      const next=await linter.applySuggestion(output,lint,suggestions[0]);
      if(next===output)continue;
      output=next;count++;changed=true;break;
    }
    if(!changed){remaining=lints.length;break;}
  }
  return {text:output,corrected:count,remaining};
}
self.onmessage=async event=>{
  const {id,text,approved=[]}=event.data||{};
  if(typeof id!=="number"||typeof text!=="string"||text.length>12000)return;
  try {
    const dictionary=new Set(approved.map(v=>String(v).toUpperCase()));
    const result=await improve(text,dictionary);
    self.postMessage({id,text:result.text,corrections:result.corrected,messages:[]});
  }catch(e){
    self.postMessage({id,text,messages:["Offline spelling checker unavailable; you can still review the basic draft."],error:true});
  }
};
