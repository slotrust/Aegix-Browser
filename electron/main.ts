import { app, BrowserWindow, BrowserView, ipcMain, session } from 'electron';
import path from 'path';
import { ElectronBlocker } from '@cliqz/adblocker-electron';
import fetch from 'cross-fetch';

app.commandLine.appendSwitch("disable-blink-features", "AutomationControlled");
app.commandLine.appendSwitch('force-webrtc-ip-handling-policy', 'disable_non_proxied_udp');

let blocker: ElectronBlocker | null = null;

async function initBlocker() {
  try {
    blocker = await ElectronBlocker.fromLists(fetch, [
      'https://easylist.to/easylist/easylist.txt',
      'https://easylist.to/easylist/easyprivacy.txt'
    ]);
    
    if (blocker) {
      blocker.enableBlockingInSession(session.defaultSession);
      console.log('[Aegix Engine] ElectronBlocker active with EasyList & EasyPrivacy');
    }
  } catch (err) {
    console.error('Failed to initialize AdBlocker:', err);
  }
}

let mainWindow: BrowserWindow | null = null;

const adDomains = [
  'doubleclick.net', 'googleadservices.com', 'googlesyndication.com',
  'amazon-adsystem.com', 'advertising.com', 'taboola.com',
  'outbrain.com', 'criteo.com', 'adnxs.com',
  'rubiconproject.com', 'adsrvr.org', 'spotxchange.com',
  'pubmatic.com', 'smartadserver.com', 'moatads.com',
  'facebook.com/tr/', 'quantserve.com', 'scorecardresearch.com',
  'mathtag.com', 'rlcdn.com', 'tynt.com', 'popads.net', 'popcash.net'
];

function isAdUrl(urlString: string) {
  try {
    const url = new URL(urlString);
    return adDomains.some(d => url.hostname.includes(d));
  } catch (e) {
    return false;
  }
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      // Needed if using <webview> tags. (If using BrowserView, handled differently)
      webviewTag: true,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  ipcMain.handle('clear-browsing-data', async () => {
    await session.defaultSession.clearStorageData();
    return true;
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    // production load
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  setupNetworkInterception();
}

function setupNetworkInterception() {
  // Deep native request interception, 100% reliable compared to iframe proxy
  // Note: Most ad blocking is now handled by ElectronBlocker via initBlocker()

  session.defaultSession.webRequest.onHeadersReceived(
    { urls: ['<all_urls>'] },
    (details, callback) => {
      // Modify CSP or X-Frame-Options if needed, but in Electron we can just let
      // sites render normally in <webview> or BrowserView without stripping these 
      // if they are top-level navigations!
      const responseHeaders = { ...details.responseHeaders };
      
      // If using <webview>, we might want to strip framing restrictions:
      if (responseHeaders['x-frame-options']) {
        delete responseHeaders['x-frame-options'];
      }
      if (responseHeaders['X-Frame-Options']) {
        delete responseHeaders['X-Frame-Options'];
      }
      if (responseHeaders['content-security-policy']) {
        delete responseHeaders['content-security-policy'];
      }
      if (responseHeaders['Content-Security-Policy']) {
        delete responseHeaders['Content-Security-Policy'];
      }

      callback({ cancel: false, responseHeaders });
    }
  );
}

app.whenReady().then(async () => {
  await initBlocker();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  app.on('web-contents-created', (event, contents) => {
    contents.setWindowOpenHandler(({ url }) => {
      if (isAdUrl(url)) {
        console.log(`[Aegix Engine] Blocked popup: ${url}`);
        return { action: 'deny' }; // 🚫 block popup
      }
      return { action: 'allow' };
    });

    contents.on('will-navigate', (event, url) => {
      if (isAdUrl(url)) {
        console.log(`[Aegix Engine] Blocked redirect: ${url}`);
        event.preventDefault(); // 🚫 stop redirect
      }
    });
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
