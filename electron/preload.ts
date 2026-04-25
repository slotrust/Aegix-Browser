import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Bridge for UI to ask the main engine to do something
  // e.g., clear cookies, set proxy 
  clearBrowsingData: () => ipcRenderer.invoke('clear-browsing-data'),
});

// Stealth Anti-Detection
Object.defineProperty(navigator, 'webdriver', {
  get: () => false
});

Object.defineProperty(navigator, 'languages', {
  get: () => ['en-US', 'en']
});

// Script-level blocking (DOM layer)
window.addEventListener('DOMContentLoaded', () => {
  const style = document.createElement('style');
  style.innerHTML = `
    .ad, .ads, .sponsored { display: none !important; }
  `;
  document.head.appendChild(style);

  const observer = new MutationObserver(() => {
    document.querySelectorAll('.ad, .ads, .sponsored').forEach(el => el.remove());
  });

  observer.observe(document.body, { childList: true, subtree: true });
});
