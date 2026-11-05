const $ = id => document.getElementById(id);
chrome.storage.sync.get({auto:false,autoReview:true,expand:false,privacy:true,custom:""},v=>{
  $("auto").checked=!!v.auto;$("autoReview").checked=!!v.autoReview;
  $("expand").checked=!!v.expand;$("privacy").checked=!!v.privacy;
  $("custom").value=v.custom||"";
});
$("save").onclick=()=>{
  chrome.storage.sync.set({auto:$("auto").checked,autoReview:$("autoReview").checked,
  expand:$("expand").checked,privacy:$("privacy").checked,custom:$("custom").value.slice(0,5000)},()=>{
    $("status").textContent=chrome.runtime.lastError?.message||"Settings saved";
  });
};