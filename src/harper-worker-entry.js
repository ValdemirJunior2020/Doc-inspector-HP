import { LocalLinter } from "harper.js";
import { binaryInlined } from "harper.js/binaryInlined";

const linter=new LocalLinter({binary:binaryInlined});
self.addEventListener("message",async event=>{
  const {id,text}=event.data||{};
  if(typeof id!=="number"||typeof text!=="string"||text.length>12000)return;
  try {
    const lints=await linter.lint(text,{language:"plaintext"});
    self.postMessage({id,messages:lints.slice(0,8).map(lint=>lint.message())});
  } catch {
    self.postMessage({id,messages:[]});
  }
});
