(() => {
if (window.__DO_INSPECTOR_HP__) { window.dispatchEvent(new Event("di-toggle")); return; }
window.__DO_INSPECTOR_HP__=true;
const terms={"REQ":"REQUEST","SW":"SPOKE WITH","OTP":"ON THE PHONE","GST":"GUEST","RES SP":"RESERVATION SPECIALIST","MNGT":"MANAGEMENT","VC":"VIRTUAL CARD","CC":"CREDIT CARD","ZD":"ZENDESK","MOD":"MANAGER ON DUTY","LVM":"LEFT VOICE MAIL","HTL":"HOTEL / MOTEL","CLD":"CALLED","RFD":"REFUND","VM":"VOICE MAIL","RP":"RATE PROVIDER","FD":"FRONT DESK","EM":"E-MAIL","EM’D":"E-MAILED","NR":"NEW REFUND","CXL":"CANCEL","CXL@":"CANCELATION NUMBER","FOC":"FREE OF CHARGES","GM":"GENERAL MANAGER","RSV":"RESERVATION","IT#":"ITINERARY NUMBER","CX":"CUSTOMER"};
const defaults={auto:false,expand:false,privacy:true,custom:""};
let settings=defaults, field=null, original="", picking=false;
let noteTimer=null, dirtyField=null, lastSuggestionKey="";
let stopped=false, dismissed=false, minimized=false;
let harperWorker=null, harperRequest=0, pendingHarperDraft="";
function startHarper() {
  if(harperWorker||stopped)return;
  try {
    harperWorker=new Worker(chrome.runtime.getURL("harper-worker.js"));
    harperWorker.onmessage=event=>{
      if(stopped||event.data?.id!==harperRequest)return;
      const destination=el("di-harper");
      const draft=el("di-draft");
      if(!destination||!draft)return;
      const response=event.data||{};
      destination.replaceChildren();
      if(response.error){
        destination.textContent="Offline spelling suggestions unavailable. Basic formatting still works.";
        return;
      }
      // Never overwrite an agent's edits or a newer/rejected draft.
      if(draft.value!==pendingHarperDraft)return;
      if(typeof response.text==="string"&&response.text!==draft.value){
        draft.value=response.text;
        el("di-suggestion-actions").hidden=false;
        el("di-status").textContent="Spelling and formatting corrections ready. Review, then Accept or Reject.";
      } else if(draft.value===el("di-source").value.trim()){
        el("di-suggestion-actions").hidden=true;
      }
      if(response.corrections>0){
        const line=document.createElement("div");
        line.className="di-result good";
        line.textContent="Offline spelling corrections added to the draft. Please review names and booking details.";
        destination.append(line);
      }
    };
    harperWorker.onerror=()=>{
      harperWorker?.terminate();harperWorker=null;
      const destination=el("di-harper");
      if(destination)destination.textContent="Spelling checker could not load. Basic formatting remains available.";
    };
  }catch{harperWorker=null;}
}
function checkHarper(text){
  if(!text||stopped)return;
  startHarper();
  if(harperWorker){
    pendingHarperDraft=text;
    ++harperRequest;
    harperWorker.postMessage({id:harperRequest,text,approved:Object.keys(dictionary())});
  }
}
function isCommentsPage(){
  return location.hostname.toLowerCase().replace(/^www\./,"")==="hotelplanner.com" &&
    /\/Common\/Popups\/ReservationXML\.htm$/i.test(location.pathname) &&
    location.hash.toLowerCase()==="#comments";
}
function commentsContext(){
  if(!isCommentsPage())return;
  launch.title="Documentation Inspector — Notes section detected";
  el("di-status").textContent="Notes section detected. Type your new note to receive a review suggestion.";
}
window.addEventListener("hashchange",commentsContext);

function noteClass(author,body) {
  const a=author.toLowerCase(), t=body.toLowerCase();
  if (/system generated/.test(a)) return "system";
  if (/^\s*(?:refund request:\s*price match compensation:|reservation cancelled:|reservation email sent\s*::|sms confirmation sent\s*::|sms refund notification sent\s*::|refunded\s*$)/i.test(body)) return "automated activity";
  if (/^\s*::standard::/i.test(body)) return "agent note";
  return "agent note / review";
}
function parseHistory(text) {
  const records=text.split(/(?=^\s*[-•]?\s*\d{2}\.\d{2}\.\d{4}\s+\d{1,2}:\d{2}:?\s*(?:AM|PM)\s*-\s*)/mi)
    .map(x=>x.trim()).filter(x=>/^[-•]?\s*\d{2}\.\d{2}\.\d{4}\s+\d{1,2}:\d{2}/i.test(x));
  return records.map(record=>{
    const match=record.match(/^[-•]?\s*(\d{2}\.\d{2}\.\d{4}\s+\d{1,2}:\d{2}:?\s*(?:AM|PM))\s*-\s*(.*?)\s*\((\d+)\)\s*\n?([\s\S]*)$/i);
    if(!match)return {type:"unclassified",author:"Unknown",body:record};
    return {type:noteClass(match[2],match[4]),author:match[2],body:match[4]};
  });
}
const panel=document.createElement("aside");panel.id="di-panel";panel.innerHTML=[
'<header><div><b>Doc-Inspector-HP</b><small>Writing assistance · live notes</small></div><div class="di-header-controls"><button id="di-stop" title="Stop monitoring" aria-label="Stop monitoring">Stop</button><button id="di-minimize" title="Minimize inspector" aria-label="Minimize inspector">−</button><button id="di-hide" title="Hide inspector" aria-label="Hide inspector">×</button></div></header>',
'<nav><button data-page="review" class="active">Writing</button><button data-page="glossary">Abbreviations</button><button data-page="guide">Help</button></nav>',
'<section id="di-review"><div class="di-line"><span id="di-field-label">No note field selected</span><button id="di-pick">Select field</button></div><label for="di-source">Original agent notes</label><textarea id="di-source" placeholder="Select a field or paste notes here"></textarea><div class="di-actions"><button id="di-analyze" class="primary">Check writing</button><button id="di-rewrite">Improve writing</button></div><div id="di-results" aria-live="polite">Writing suggestions will appear here.</div><div id="di-harper" aria-live="polite"></div><label for="di-draft">Improved draft (editable)</label><textarea id="di-draft" placeholder="Click Improve writing, then review all facts"></textarea><div class="di-actions"><button id="di-copy">Copy draft</button><button id="di-apply" class="primary">Accept and apply</button></div><div class="di-actions" id="di-suggestion-actions" hidden><button id="di-reject">Reject suggestion</button></div></section>',
'<section id="di-glossary" hidden><p>Approved terminology from your chart; team additions are optional.</p><input id="di-filter" placeholder="Search abbreviations"><div id="di-entries"></div></section>',
'<section id="di-guide" hidden><p><b>1.</b> Select the actual notes field on the page.</p><p><b>2.</b> Continue typing. Optional writing improvements appear after you pause.</p><p><b>3.</b> Generate and review an optional improved draft.</p><p><b>4.</b> Apply it only after confirmation, then use the website’s own save button.</p><p>Never claim a refund, cancellation, call, approval, or guest promise occurred unless documented and verified. This extension does not read booking APIs or submit any data.</p><button id="di-settings">Settings</button></section>',
'<footer id="di-status" role="status">No notes are uploaded or logged.</footer>'
].join("");
const launch=document.createElement("button");launch.id="di-launch";launch.textContent="DI";launch.title="Open Documentation Inspector";
document.documentElement.append(panel,launch);
const el=id=>panel.querySelector("#"+id);
const encode=s=>String(s).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const visible=()=>{dismissed=false;minimized=false;panel.classList.remove("di-minimized");panel.classList.add("di-visible");launch.classList.add("di-hidden")};
const hidden=()=>{dismissed=true;minimized=false;panel.classList.remove("di-visible","di-minimized");launch.classList.remove("di-hidden");launch.textContent=stopped?"DI ⏸":"DI";};
const minimize=()=>{dismissed=true;minimized=true;panel.classList.remove("di-visible");panel.classList.add("di-minimized");launch.classList.remove("di-hidden");launch.textContent=stopped?"DI ⏸":"DI −";};
const toggle=()=>panel.classList.contains("di-visible")?hidden():visible();
function stopToggle(){
  stopped=!stopped;
  clearTimeout(noteTimer);dirtyField=null;
  el("di-stop").textContent=stopped?"Resume":"Stop";
  el("di-stop").setAttribute("aria-label",stopped?"Resume monitoring":"Stop monitoring");
  panel.classList.toggle("di-stopped",stopped);
  launch.textContent=stopped?"DI ⏸":minimized?"DI −":"DI";
  el("di-status").textContent=stopped?"Inspector stopped. Monitoring and automatic corrections are paused.":"Inspector resumed. Monitoring is active.";
  if(stopped){++harperRequest;el("di-harper").replaceChildren();el("di-suggestion-actions").hidden=true;el("di-draft").value="";if(harperWorker){harperWorker.terminate();harperWorker=null;}}
}

window.addEventListener("di-toggle",toggle);
chrome.runtime.onMessage.addListener((msg,sender,reply)=>{if(msg?.type==="DO_INSPECTOR_TOGGLE"){toggle();reply({ok:true})}});
launch.onclick=visible;el("di-hide").onclick=hidden;el("di-minimize").onclick=minimize;el("di-stop").onclick=stopToggle;
panel.querySelectorAll("nav button").forEach(button=>button.onclick=()=>{panel.querySelectorAll("nav button").forEach(b=>b.classList.toggle("active",b===button));["review","glossary","guide"].forEach(p=>el("di-"+p).hidden=p!==button.dataset.page)});
const editable=t=>t instanceof HTMLTextAreaElement&&!t.readOnly&&!t.disabled || t instanceof HTMLInputElement&&t.type==="text"&&!t.readOnly&&!t.disabled || t instanceof HTMLElement&&t.isContentEditable&&!t.closest("#di-panel");
const value=t=>t instanceof HTMLTextAreaElement||t instanceof HTMLInputElement?t.value:t.innerText;
function setValue(target,v){if(target instanceof HTMLTextAreaElement)Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,"value").set.call(target,v);else if(target instanceof HTMLInputElement)Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(target,v);else target.innerText=v;target.dispatchEvent(new Event("input",{bubbles:true}));target.dispatchEvent(new Event("change",{bubbles:true}));}
function selectField(t){
  field=t;syncOriginalField(t);
  el("di-field-label").textContent=(t.getAttribute("aria-label")||t.getAttribute("placeholder")||t.getAttribute("name")||t.id||"Editable field").slice(0,70);
  el("di-status").textContent="Note field connected. Original notes mirror HotelPlanner live.";
}
function syncOriginalField(t) {
  if(!t||!t.isConnected||!editable(t)||panel.contains(t))return;
  const current=value(t);
  if(field!==t)field=t;
  if(el("di-source").value===current)return;
  original=current;
  el("di-source").value=current;
  // A previously generated draft is now out of date; never allow a stale correction.
  el("di-draft").value="";
  el("di-harper").replaceChildren();
  ++harperRequest;
  el("di-suggestion-actions").hidden=true;
  lastSuggestionKey="";
  el("di-results").textContent="Notes synced. An optional correction will appear after you pause.";
}

function pickClick(event){const t=event.target.closest?.("textarea,input,[contenteditable]")||event.target;if(!editable(t)||panel.contains(t))return;event.preventDefault();event.stopPropagation();document.removeEventListener("click",pickClick,true);picking=false;el("di-pick").textContent="Select field";selectField(t);visible();}
el("di-pick").onclick=()=>{picking=true;hidden();el("di-pick").textContent="Picking…";document.addEventListener("click",pickClick,true)};
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&picking){picking=false;document.removeEventListener("click",pickClick,true);el("di-pick").textContent="Select field";visible();}});
function dictionary(){const extra={};for(const line of (settings.custom||"").split(/\r?\n/)){const m=line.match(/^\s*([^=]{1,20})\s*=\s*(.{1,150})$/);if(m&&!Object.hasOwn(terms,m[1].trim().toUpperCase()))extra[m[1].trim().toUpperCase()]=m[2].trim()}return {...extra,...terms};}
const escapedRegex=s=>s.replace(/[-/\\^$*+?.()|[\]{}]/g,"\\$&");
function hasCode(note,code){return new RegExp("(^|[^A-Za-z0-9])"+escapedRegex(code)+"(?=$|[^A-Za-z0-9])","i").test(note)}
function expand(note){for(const [code,meaning] of Object.entries(dictionary()).sort((a,b)=>b[0].length-a[0].length)){note=note.replace(new RegExp("(^|[^A-Za-z0-9])"+escapedRegex(code)+"(?=$|[^A-Za-z0-9])","gi"),(_,prefix)=>prefix+meaning.toLowerCase())}return note;}
function inspect(){
  if(stopped){el("di-status").textContent="Writing assistant paused. Click Resume.";return;}
  const note=el("di-source").value.trim(), found=[];
  if(!note)found.push(["info","Start typing in the HotelPlanner Notes box."]);
  else {
    const matched=Object.keys(dictionary()).filter(x=>hasCode(note,x));
    if(matched.length)found.push(["good","Approved abbreviations: "+matched.join(", ")]);
    if(settings.privacy&&/(?:\d[ -]?){13,19}/.test(note))found.push(["warn","Possible payment-card number. Avoid including full card details."]);
    if(!/[.!?]\s|[.!?]$/.test(note))found.push(["info","Optional: add sentence punctuation for easier reading."]);
    if(!found.length)found.push(["good","Your note is ready for your review."]);
  }
  el("di-results").innerHTML=found.map(([type,msg])=>'<div class="di-result '+type+'">'+encode(msg)+'</div>').join("");
  el("di-status").textContent="Suggestions are optional. You control what gets saved.";
}
function suggestForField(t) {
  if(stopped||!t||!t.isConnected||!editable(t)||panel.contains(t))return;
  const text=value(t).trim();
  if(text.length<2||parseHistory(text).length>0)return;
  const key=text+"|"+(t.getAttribute("name")||t.id||"");
  if(key===lastSuggestionKey)return;
  if(field!==t)selectField(t);
  else syncOriginalField(t);
  lastSuggestionKey=key;
  const improved=conservativeImprove(text);
  el("di-draft").value=improved;
  inspect();
  checkHarper(improved);
  if(!dismissed&&!minimized)visible();
  el("di-status").textContent="Suggested correction ready. Accept with Apply to field, or Reject to leave notes unchanged.";
  el("di-suggestion-actions").hidden=false;
}
function normalizeAllCaps(note) {
  const approved=new Set(Object.keys(dictionary()).map(x=>x.toUpperCase()));
  const words=note.match(/\b[A-Za-z][A-Za-z’']*\b/g)||[];
  // Ignore company shorthand and identifiers when deciding whether ordinary words are ALL CAPS.
  const ordinary=words.filter(w=>w.toUpperCase()!=="I"&&!approved.has(w.toUpperCase()));
  const letters=ordinary.join("").match(/[A-Za-z]/g)||[];
  if(letters.length<2)return note;
  const upper=letters.filter(ch=>ch===ch.toUpperCase()).length;
  if(upper/letters.length<0.8)return note;
  const protectedTokens=/\bH\d{8}\b|\b[A-Z]{1,5}\d[A-Z0-9]*\b|\b(?:IP|SMS|FOC|URL|USD|HTML|API)\b/gi;
  const tokens=[];
  let masked=note.replace(protectedTokens,match=>{tokens.push(match);return "\uE000"+(tokens.length-1)+"\uE001";});
  masked=masked.toLowerCase().replace(/\b[a-z][a-z’']*\b/g,token=>approved.has(token.toUpperCase())?token.toUpperCase():token);
  return masked.replace(/\uE000(\d+)\uE001/g,(_,i)=>tokens[Number(i)]);
}
// Fast, deterministic typo fixes; independent of the optional Harper worker.
const AGENT_TYPOS=Object.freeze({
  upsett:"upset", becuz:"because", tryed:"tried", answerd:"answered",
  minuts:"minutes", finaly:"finally", manger:"manager", sistem:"system",
  refunnd:"refund", aproved:"approved", tommorow:"tomorrow",
  fallow:"follow", superviser:"supervisor", bussy:"busy",
  reservaton:"reservation", realy:"really", recieve:"receive",
  dont:"don't", didnt:"didn't", havent:"haven't",
  couldnt:"couldn't", wasnt:"wasn't", wont:"won't", cant:"can't"
});
function correctKnownTypos(note){
  const approved=new Set(Object.keys(dictionary()).map(key=>key.toUpperCase()));
  return note.replace(/\b[A-Za-z]+(?:['’][A-Za-z]+)?\b/g,word=>{
    if(approved.has(word.toUpperCase()))return word;
    const corrected=AGENT_TYPOS[word.toLowerCase()];
    if(!corrected)return word;
    if(word.toUpperCase()===word && word.length>1)return corrected.toUpperCase();
    if(word[0]===word[0].toUpperCase())return corrected[0].toUpperCase()+corrected.slice(1);
    return corrected;
  });
}
// Conservative contextual corrections for common spoken call notes.
// Do not infer refunds, approvals, cancellations, or other outcomes.
function correctCommonGrammar(note){
  const rules=[
    [/\bbcz\b/gi,"because"],
    [/\bthere (system|records|reservation|booking|notes)\b/gi,"their $1"],
    [/\bwho say\b/gi,"who said"],
    [/\bhe want to\b/gi,"he wanted to"],
    [/\bshe want to\b/gi,"she wanted to"],
    [/\bthey haven't reply\b/gi,"they haven't replied"],
    [/\bthey havent reply\b/gi,"they haven't replied"],
    [/\bI also send a EM\b/gi,"I also sent an EM"],
    [/\bI also send an EM\b/gi,"I also sent an EM"],
    [/\band ask for supervisor\b/gi,"and asked for a supervisor"],
    [/\band ask for a supervisor\b/gi,"and asked for a supervisor"],
    [/\bdon't have the RSV in their system\b/gi,"don't have the RSV in their system"],
    [/\bASAP\b/gi,"ASAP"]
  ];
  return rules.reduce((text,[pattern,replacement])=>text.replace(pattern,replacement),note);
}
function cleanPunctuation(note){
  // Only normalize excessive punctuation. Keep an existing question mark
  // and don't turn uncertain refund/cancellation statements into assertions.
  return note
    .replace(/\.{2,}/g,". ")
    .replace(/!{2,}/g,"! ")
    .replace(/\?{2,}/g,"? ")
    .replace(/,{2,}/g,", ")
    .replace(/\s+([,.;!?])/g,"$1")
    .replace(/([.!?])(?=[A-Za-z])/g,"$1 ")
    .replace(/([,;])(?=[A-Za-z])/g,"$1 ")
    .replace(/[ \t]{2,}/g," ");
}
function conservativeImprove(note) {
  if(settings.expand)note=expand(note);
  note=correctCommonGrammar(correctKnownTypos(normalizeAllCaps(note))).trim()
    .replace(/\r\n?/g,"\n").replace(/[ \t]{2,}/g," ");
  note=cleanPunctuation(note);
  return note.split("\n").map(line=>{
    line=line.trim().replace(/\bi\b/g,"I");
    line=line.replace(/(^|[.!?]\s+)([a-z])/g,(_,p,ch)=>p+ch.toUpperCase());
    if(/[A-Za-z0-9)]$/.test(line))line+=".";
    return line;
  }).join("\n");
}
function isReservationPage(){
  return location.hostname.toLowerCase().replace(/^www\./,"")==="hotelplanner.com" &&
    /\/Common\/Popups\/ReservationXML\.htm$/i.test(location.pathname);
}
function isLikelyNoteEditor(t){
  if(!editable(t)||panel.contains(t)||t instanceof HTMLInputElement&&t.type==="password")return false;
  if(isReservationPage() && t instanceof HTMLTextAreaElement){
    // ReservationXML note editor is a textarea immediately above the orange Add Note button.
    // Do not treat unrelated reservation textareas as notes.
    const parent=t.closest("form")||t.parentElement?.parentElement||t.parentElement;
    const buttons=Array.from(parent?.querySelectorAll("button,input[type=submit],input[type=button]")||[]);
    if(buttons.some(b=>/add\s*note/i.test([b.textContent,b.value,b.getAttribute("title")].join(" "))))return true;
    const rect=t.getBoundingClientRect();
    const all=Array.from(document.querySelectorAll("button,input[type=submit],input[type=button]"));
    if(all.some(b=>{const brect=b.getBoundingClientRect();return /add\s*note/i.test([b.textContent,b.value].join(" ")) &&
      Math.abs(brect.top-rect.bottom)<180 && Math.abs(brect.left-rect.left)<220;}))return true;
    if(isCommentsPage() && document.querySelectorAll("textarea:not(#di-source):not(#di-draft)").length===1)return true;
  }
  const descriptor=[t.getAttribute("name"),t.id,t.getAttribute("placeholder"),t.getAttribute("aria-label"),
    t.closest("[class],[id]")?.getAttribute("class"),t.closest("[class],[id]")?.id].filter(Boolean).join(" ");
  return /(note|comment|documentation|remark|description|message)/i.test(descriptor);
}
function autoReview(event){
  if(stopped||!settings.autoReview||!event.isTrusted)return;
  const t=event.target;
  if(!isLikelyNoteEditor(t))return;
  dirtyField=t;
  if(field!==t)selectField(t);
  else syncOriginalField(t);
  if(!dismissed&&!minimized&&!panel.classList.contains("di-visible"))visible();
  clearTimeout(noteTimer);
  // Avoid interruptions while composing a note; suggest after a substantial pause.
  noteTimer=setTimeout(()=>{if(dirtyField===t)suggestForField(t);},1800);
}
document.addEventListener("focusin",event=>{
  if(stopped||!settings.autoReview||!event.isTrusted||!isLikelyNoteEditor(event.target))return;
  // The browser toolbar popup cannot be programmatically opened; open our in-page inspector instead.
  dirtyField=event.target;
  if(field!==dirtyField)selectField(dirtyField);
  else syncOriginalField(dirtyField);
  if(!dismissed&&!minimized)visible();
  el("di-status").textContent="Notes editor detected. Keep typing; correction is suggested after you pause.";
},true);
document.addEventListener("input",autoReview,true);
document.addEventListener("focusout",event=>{
  const t=event.target;
  if(!stopped&&settings.autoReview&&dirtyField===t&&isLikelyNoteEditor(t)){
    clearTimeout(noteTimer);
    noteTimer=setTimeout(()=>suggestForField(t),300);
  }
},true);
el("di-analyze").onclick=inspect;
el("di-rewrite").onclick=()=>{if(stopped){el("di-status").textContent="Inspector stopped. Click Resume.";return;}const note=el("di-source").value.trim();if(!note){el("di-status").textContent="Enter notes first.";return;}if(parseHistory(note).length){el("di-status").textContent="Historical activity is read-only. Select a new agent note instead.";return;}el("di-draft").value=conservativeImprove(note);inspect();checkHarper(el("di-draft").value);el("di-status").textContent="Draft ready: accept or reject; verify all facts.";el("di-suggestion-actions").hidden=false;};
el("di-reject").onclick=()=>{++harperRequest;pendingHarperDraft="";el("di-harper").replaceChildren();el("di-draft").value="";el("di-suggestion-actions").hidden=true;el("di-status").textContent="Suggestion rejected. Agent notes unchanged.";};
el("di-copy").onclick=async()=>{if(!el("di-draft").value.trim()){el("di-status").textContent="Draft is empty.";return;}try{await navigator.clipboard.writeText(el("di-draft").value);el("di-status").textContent="Draft copied."}catch{el("di-draft").select();document.execCommand("copy");el("di-status").textContent="Copy attempted. Check your clipboard."}};
el("di-apply").onclick=()=>{if(stopped){el("di-status").textContent="Inspector stopped. Click Resume.";return;}const draft=el("di-draft").value;if(!draft.trim()){el("di-status").textContent="No draft to apply.";return;}if(parseHistory(draft).length){el("di-status").textContent="Historical activity cannot be applied.";return;}if(!field||!field.isConnected||!editable(field)){el("di-status").textContent="Select a valid note field first.";return;}if(value(field)!==original){el("di-status").textContent="Field changed since selection. Reselect it to prevent overwriting new work.";return;}if(!confirm("Replace the selected note field with the reviewed draft? The extension will NOT save or submit it."))return;++harperRequest;pendingHarperDraft="";setValue(field,draft);original=draft;el("di-source").value=draft;el("di-suggestion-actions").hidden=true;el("di-status").textContent="Draft placed in field. Use the site's normal Save button."};
function glossary(){const q=el("di-filter").value.trim().toLowerCase();el("di-entries").innerHTML=Object.entries(dictionary()).filter(([k,v])=>(k+" "+v).toLowerCase().includes(q)).map(([k,v])=>'<div><b>'+encode(k)+'</b><span>'+encode(v)+'</span></div>').join("")||"No matches";}
el("di-filter").oninput=glossary;
el("di-settings").onclick=()=>chrome.runtime.openOptionsPage();
chrome.storage.sync.get({...defaults,autoReview:true},v=>{settings=v;glossary();if(v.auto && isReservationPage()&&!stopped)visible();commentsContext();});
})();