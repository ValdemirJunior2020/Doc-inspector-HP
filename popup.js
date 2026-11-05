const status = document.getElementById("status");
document.getElementById("options").addEventListener("click", () => chrome.runtime.openOptionsPage());
document.getElementById("open").addEventListener("click", async () => {
  try {
    const [tab] = await chrome.tabs.query({active:true,currentWindow:true});
    if (!tab || !tab.id || !/^https?:/.test(tab.url || "")) throw new Error("Open an ordinary website tab first.");
    try { await chrome.tabs.sendMessage(tab.id,{type:"DO_INSPECTOR_TOGGLE"}); }
    catch { await chrome.scripting.insertCSS({target:{tabId:tab.id},files:["inspector.css"]}); await chrome.scripting.executeScript({target:{tabId:tab.id},files:["inspector.js"]}); }
    window.close();
  } catch(e) {status.textContent = e.message || "Cannot open on this tab";}
});