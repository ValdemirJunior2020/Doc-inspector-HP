(() => {
if (window.__DO_INSPECTOR_HP__) { window.dispatchEvent(new Event("di-toggle")); return; }
window.__DO_INSPECTOR_HP__=true;
const terms={"REQ":"REQUEST","SW":"SPOKE WITH","OTP":"ON THE PHONE","GST":"GUEST","RES SP":"RESERVATION SPECIALIST","MNGT":"MANAGEMENT","VC":"VIRTUAL CARD","CC":"CREDIT CARD","ZD":"ZENDESK","MOD":"MANAGER ON DUTY","LVM":"LEFT VOICE MAIL","HTL":"HOTEL / MOTEL","CLD":"CALLED","RFD":"REFUND","VM":"VOICE MAIL","RP":"RATE PROVIDER","FD":"FRONT DESK","EM":"E-MAIL","EM’D":"E-MAILED","NR":"NEW REFUND","CXL":"CANCEL","CXL@":"CANCELATION NUMBER","FOC":"FREE OF CHARGES","GM":"GENERAL MANAGER","RSV":"RESERVATION","IT#":"ITINERARY NUMBER","CX":"CUSTOMER"};
const defaults={auto:false,expand:false,privacy:true,checks:["Reason for contact","Who was contacted (if applicable)","Actions actually taken","Outcome / current status","Next step and responsible party (if unresolved)"],custom:""};
let settings=defaults, field=null, original="", picking=false;
let noteTimer=null, dirtyField=null, lastSuggestionKey="";
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
function renderHistory(text) {
  const records=parseHistory(text);
  let target=el("di-history");
  if(!target)return;
  if(!records.length){target.textContent="No timestamped activity log detected. This is treated as an editable draft, not a historical record.";return;}
  const counts={};records.forEach(x=>counts[x.type]=(counts[x.type]||0)+1);
  target.innerHTML='<b>Activity history: '+records.length+' entries</b><p>'+Object.entries(counts).map(([type,n])=>encode(type)+': '+n).join(' · ')+'</p>'+
    records.map(x=>'<div class="di-result info"><b>'+encode(x.type)+'</b> — '+encode(x.author)+'</div>').join("");
}

const panel=document.createElement("aside");panel.id="di-panel";panel.innerHTML=[
'<header><div><b>DO Inspector HP</b><small>Documentation quality · agent review</small></div><button id="di-hide" aria-label="Close">×</button></header>',
'<nav><button data-page="review" class="active">Inspector</button><button data-page="glossary">Abbreviations</button><button data-page="guide">Guide</button></nav>',
'<section id="di-review"><div class="di-line"><span id="di-field-label">No note field selected</span><button id="di-pick">Select field</button></div><label for="di-source">Original agent notes</label><textarea id="di-source" placeholder="Select a field or paste notes here"></textarea><div class="di-actions"><button id="di-analyze" class="primary">Inspect</button><button id="di-rewrite">Improve writing</button></div><div id="di-results" aria-live="polite">Findings will appear here. No QA score is assigned.</div><div id="di-history" class="di-history" aria-live="polite"></div><div class="di-line"><b>Documentation checklist</b><small>Manual verification</small></div><div id="di-checklist"></div><label for="di-draft">Improved draft (editable)</label><textarea id="di-draft" placeholder="Click Improve writing, then review all facts"></textarea><div class="di-actions"><button id="di-copy">Copy draft</button><button id="di-apply" class="primary">Accept and apply</button></div><div class="di-actions" id="di-suggestion-actions" hidden><button id="di-reject">Reject suggestion</button></div></section>',
'<section id="di-glossary" hidden><p>Approved terminology from your chart; team additions are optional.</p><input id="di-filter" placeholder="Search abbreviations"><div id="di-entries"></div></section>',
'<section id="di-guide" hidden><p><b>1.</b> Select the actual notes field on the page.</p><p><b>2.</b> Inspect the text for wording and completeness prompts.</p><p><b>3.</b> Generate and review an optional improved draft.</p><p><b>4.</b> Apply it only after confirmation, then use the website’s own save button.</p><p>Never claim a refund, cancellation, call, approval, or guest promise occurred unless documented and verified. This extension does not read booking APIs or submit any data.</p><button id="di-settings">Settings</button></section>',
'<footer id="di-status" role="status">No notes are uploaded or logged.</footer>'
].join("");
const launch=document.createElement("button");launch.id="di-launch";launch.textContent="DI";launch.title="Open Documentation Inspector";
document.documentElement.append(panel,launch);
const el=id=>panel.querySelector("#"+id);
const encode=s=>String(s).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const visible=()=>{panel.classList.add("di-visible");launch.classList.add("di-hidden")};
const hidden=()=>{panel.classList.remove("di-visible");launch.classList.remove("di-hidden")};
const toggle=()=>panel.classList.contains("di-visible")?hidden():visible();
window.addEventListener("di-toggle",toggle);
chrome.runtime.onMessage.addListener((msg,sender,reply)=>{if(msg?.type==="DO_INSPECTOR_TOGGLE"){toggle();reply({ok:true})}});
launch.onclick=visible;el("di-hide").onclick=hidden;
panel.querySelectorAll("nav button").forEach(button=>button.onclick=()=>{panel.querySelectorAll("nav button").forEach(b=>b.classList.toggle("active",b===button));["review","glossary","guide"].forEach(p=>el("di-"+p).hidden=p!==button.dataset.page)});
const editable=t=>t instanceof HTMLTextAreaElement&&!t.readOnly&&!t.disabled || t instanceof HTMLInputElement&&t.type==="text"&&!t.readOnly&&!t.disabled || t instanceof HTMLElement&&t.isContentEditable&&!t.closest("#di-panel");
const value=t=>t instanceof HTMLTextAreaElement||t instanceof HTMLInputElement?t.value:t.innerText;
function setValue(target,v){if(target instanceof HTMLTextAreaElement)Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,"value").set.call(target,v);else if(target instanceof HTMLInputElement)Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(target,v);else target.innerText=v;target.dispatchEvent(new Event("input",{bubbles:true}));target.dispatchEvent(new Event("change",{bubbles:true}));}
function selectField(t){field=t;original=value(t);el("di-source").value=original;el("di-field-label").textContent=(t.getAttribute("aria-label")||t.getAttribute("placeholder")||t.getAttribute("name")||t.id||"Editable field").slice(0,70);el("di-status").textContent="Field selected. No changes made.";}
function pickClick(event){const t=event.target.closest?.("textarea,input,[contenteditable]")||event.target;if(!editable(t)||panel.contains(t))return;event.preventDefault();event.stopPropagation();document.removeEventListener("click",pickClick,true);picking=false;el("di-pick").textContent="Select field";selectField(t);visible();}
el("di-pick").onclick=()=>{picking=true;hidden();el("di-pick").textContent="Picking…";document.addEventListener("click",pickClick,true)};
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&picking){picking=false;document.removeEventListener("click",pickClick,true);el("di-pick").textContent="Select field";visible();}});
function dictionary(){const extra={};for(const line of (settings.custom||"").split(/\r?\n/)){const m=line.match(/^\s*([^=]{1,20})\s*=\s*(.{1,150})$/);if(m&&!Object.hasOwn(terms,m[1].trim().toUpperCase()))extra[m[1].trim().toUpperCase()]=m[2].trim()}return {...extra,...terms};}
const escapedRegex=s=>s.replace(/[-/\\^$*+?.()|[\]{}]/g,"\\$&");
function hasCode(note,code){return new RegExp("(^|[^A-Za-z0-9])"+escapedRegex(code)+"(?=$|[^A-Za-z0-9])","i").test(note)}
function expand(note){for(const [code,meaning] of Object.entries(dictionary()).sort((a,b)=>b[0].length-a[0].length)){note=note.replace(new RegExp("(^|[^A-Za-z0-9])"+escapedRegex(code)+"(?=$|[^A-Za-z0-9])","gi"),(_,prefix)=>prefix+meaning.toLowerCase())}return note;}
function inspect(){const note=el("di-source").value.trim();renderHistory(note);const found=[];if(!note)found.push(["warn","No notes entered."]);else{
const matched=Object.keys(dictionary()).filter(x=>hasCode(note,x));if(matched.length)found.push(["good","Recognized abbreviations: "+matched.join(", ")]);
if(note.length<35)found.push(["warn","Very short note. Verify it explains the reason, action and outcome."]);
if(/\b(pending|awaiting|waiting|follow.up|callback|unresolved)\b/i.test(note))found.push(["warn","Pending action detected. Verify next step, owner and current status."]);
if(/\b(cxl|cancel|cancellation|refund|rfd|foc)\b/i.test(note))found.push(["info","Refund/cancellation reference detected. Confirm the actual status; do not confuse requested with completed."]);
if(settings.privacy&&/(?:\d[ -]?){13,19}/.test(note))found.push(["warn","Possible payment-card number: remove sensitive details."]);
if(!/[.!?]\s|[.!?]$/.test(note))found.push(["info","Consider writing clear sentences rather than one continuous line."]);
if(!found.length)found.push(["good","No obvious wording problems. Accuracy and Matrix compliance still require independent verification."]);
}
el("di-results").innerHTML=found.map(([type,msg])=>'<div class="di-result '+type+'">'+encode(msg)+'</div>').join("");
el("di-status").textContent="Inspection complete — suggestions only, never an automatic QA penalty.";}
function suggestForField(t) {
  if(!t||!t.isConnected||!editable(t)||panel.contains(t))return;
  const text=value(t).trim();
  if(text.length<8||parseHistory(text).length>0)return;
  const key=text+"|"+(t.getAttribute("name")||t.id||"");
  if(key===lastSuggestionKey)return;
  lastSuggestionKey=key; selectField(t);
  const improved=conservativeImprove(text);
  if(improved===text)return;
  el("di-draft").value=improved;
  inspect();
  visible();
  el("di-status").textContent="Suggested correction ready. Accept with Apply to field, or Reject to leave notes unchanged.";
  el("di-suggestion-actions").hidden=false;
}
function conservativeImprove(note){
  if(settings.expand)note=expand(note);
  return note.trim().replace(/\r\n?/g,"\n").replace(/[ \t]{2,}/g," ").replace(/\s+([,.;!?])/g,"$1").split("\n")
    .map(line=>{line=line.trim().replace(/\bi\b/g,"I").replace(/(^|[.!?]\s+)([a-z])/g,(_,p,ch)=>p+ch.toUpperCase());if(/[A-Za-z0-9)]$/.test(line))line+=".";return line}).join("\n");
}
function autoReview(event){
  if(!settings.autoReview||!event.isTrusted)return;
  const t=event.target;
  if(!editable(t)||panel.contains(t)||t.type==="password")return;
  if(t instanceof HTMLInputElement && !/(note|comment|documentation|remark|description|message)/i.test([t.name,t.id,t.placeholder,t.getAttribute("aria-label")].join(" ")))return;
  dirtyField=t;
  clearTimeout(noteTimer);
  noteTimer=setTimeout(()=>{if(dirtyField===t)suggestForField(t);},700);
}
document.addEventListener("input",autoReview,true);
document.addEventListener("focusout",event=>{
  const t=event.target;
  if(settings.autoReview&&dirtyField===t&&editable(t)&&!panel.contains(t)){clearTimeout(noteTimer);noteTimer=setTimeout(()=>suggestForField(t),250);}
},true);
el("di-analyze").onclick=inspect;
el("di-rewrite").onclick=()=>{const note=el("di-source").value.trim();if(!note){el("di-status").textContent="Enter notes first.";return;}if(parseHistory(note).length){el("di-status").textContent="Historical activity is read-only. Select a new agent note instead.";return;}el("di-draft").value=conservativeImprove(note);inspect();el("di-status").textContent="Draft ready: accept or reject; verify all facts.";el("di-suggestion-actions").hidden=false;};
el("di-reject").onclick=()=>{el("di-draft").value="";el("di-suggestion-actions").hidden=true;el("di-status").textContent="Suggestion rejected. Agent notes unchanged.";};
el("di-copy").onclick=async()=>{if(!el("di-draft").value.trim()){el("di-status").textContent="Draft is empty.";return;}try{await navigator.clipboard.writeText(el("di-draft").value);el("di-status").textContent="Draft copied."}catch{el("di-draft").select();document.execCommand("copy");el("di-status").textContent="Copy attempted. Check your clipboard."}};
el("di-apply").onclick=()=>{const draft=el("di-draft").value;if(!draft.trim()){el("di-status").textContent="No draft to apply.";return;}if(parseHistory(draft).length){el("di-status").textContent="Historical activity cannot be applied.";return;}if(!field||!field.isConnected||!editable(field)){el("di-status").textContent="Select a valid note field first.";return;}if(value(field)!==original){el("di-status").textContent="Field changed since selection. Reselect it to prevent overwriting new work.";return;}if(!confirm("Replace the selected note field with the reviewed draft? The extension will NOT save or submit it."))return;setValue(field,draft);original=draft;el("di-source").value=draft;el("di-suggestion-actions").hidden=true;el("di-status").textContent="Draft placed in field. Use the site's normal Save button."};
function glossary(){const q=el("di-filter").value.trim().toLowerCase();el("di-entries").innerHTML=Object.entries(dictionary()).filter(([k,v])=>(k+" "+v).toLowerCase().includes(q)).map(([k,v])=>'<div><b>'+encode(k)+'</b><span>'+encode(v)+'</span></div>').join("")||"No matches";}
el("di-filter").oninput=glossary;
el("di-settings").onclick=()=>chrome.runtime.openOptionsPage();
chrome.storage.sync.get({...defaults,autoReview:true},v=>{settings=v;for(const item of v.checks){const label=document.createElement("label");const box=document.createElement("input");box.type="checkbox";label.append(box,document.createTextNode(item));el("di-checklist").append(label);}glossary();if(v.auto)visible();});
})();