import React, { useRef, useState, useEffect } from 'react';
import { useBrowserStore, Tab } from '../store/useBrowserStore';
import { StartPage } from './StartPage';
import { InternalSearch } from './InternalSearch';
import { ShieldAlert } from 'lucide-react';
import { cn } from '../lib/utils';
import { syncHistory, syncProxyStorage } from '../lib/sync';
import { auth, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export function BrowserViewport() {
  const { tabs, activeTabId } = useBrowserStore();

  useEffect(() => {
    const handler = (e: MessageEvent) => {
       if (e.data && e.data.type === 'AEGIX_STORAGE_UPDATE') {
           syncProxyStorage(e.data.payload);
       }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  return (
    <div className="flex-1 bg-white relative w-full h-full overflow-hidden">
      {tabs.map(tab => (
        <TabContent 
          key={tab.id} 
          tab={tab} 
          isActive={tab.id === activeTabId} 
        />
      ))}
    </div>
  );
}

function TabContent({ tab, isActive }: { tab: Tab, isActive: boolean, key?: React.Key }) {
  const { updateTab, addProtectionStats, isVpnActive } = useBrowserStore();
  const [iframeError, setIframeError] = useState(false);
  const [proxyMode, setProxyMode] = useState(false);
  
  let targetUrl = tab.url;
  let autoProxy = false;
  
  if (tab.url.includes('youtube.com') || tab.url.includes('google.com')) {
    autoProxy = true;
  }
  
  // Use VPN proxy mode or manual proxy mode or autoProxy
  const effectiveProxyMode = proxyMode || isVpnActive || autoProxy;
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleLoad = async () => {
    updateTab(tab.id, { loading: false });
    syncHistory(tab.url, tab.title, !!tab.isPrivate);
    
    // Inject synced storage into proxy iframe payload
    if (auth.currentUser && iframeRef.current?.contentWindow && effectiveProxyMode) {
       try {
         // Pass custom rules for advanced blocking
         iframeRef.current.contentWindow.postMessage({ 
            type: 'AEGIX_CUSTOM_RULES', 
            payload: useBrowserStore.getState().shieldSettings?.customAdRules || []
         }, '*');

         const d = await getDoc(doc(db, `users/${auth.currentUser.uid}/proxyStorage`, 'tokens'));
         if (d.exists()) {
             iframeRef.current.contentWindow.postMessage({ type: 'AEGIX_SYNC_STORAGE', payload: d.data().data }, '*');
         }
       } catch (e) {}
    }
    
    // Increment realistic ad block stats when page loads safely
    if (tab.url.startsWith('http')) {
        try {
            const res = await fetch(`/api/analyze-url?url=${encodeURIComponent(tab.url)}`);
            if (res.ok) {
                const data = await res.json();
                addProtectionStats(data.trackers || 0, data.ads || 0, data.sizeSaved || 0);
            }
        } catch (e) {
            // Ignore error if server is not up
        }
    }
  };

  const handleError = () => {
    if (!effectiveProxyMode) {
      updateTab(tab.id, { loading: false });
      setIframeError(true);
    }
  };

  // Content routing
  let content = null;
  if (tab.url === 'aegix://newtab') {
    content = <StartPage isPrivate={tab.isPrivate} />;
  } else if (tab.url.startsWith('aegix://search')) {
    const q = new URL(tab.url.replace('aegix://', 'http://')).searchParams.get('q') || '';
    content = <InternalSearch query={q} />;
  } else {
    let pUrl = `/proxy?url=${encodeURIComponent(targetUrl)}`;
    if (isVpnActive) {
      const vpnLocation = useBrowserStore.getState().vpnLocation;
      pUrl += `&vpn=true&loc=${vpnLocation}`;
    }
    const displayUrl = effectiveProxyMode ? pUrl : targetUrl;

    content = (
      <>
        {iframeError && !effectiveProxyMode && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1C1E20] text-gray-100 z-10 p-4">
            <ShieldAlert size={48} className="text-[#fb542b] mb-4" />
            <h2 className="text-2xl font-bold mb-2">iframe Blocked by Target Site</h2>
            <p className="text-gray-400 max-w-md text-center mb-6">
              This website ({new URL(tab.url).hostname}) prevents embedded viewing to protect users from clickjacking. 
              We can attempt to bypass this using a proxy, though rendering might break.
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => {
                  setProxyMode(true);
                  setIframeError(false);
                  updateTab(tab.id, { loading: true });
                }}
                className="px-4 py-2 bg-[#fb542b] hover:bg-[#ff7d00] text-white rounded font-medium transition-colors"
              >
                Launch via Proxy
              </button>
              <a 
                href={tab.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded font-medium transition-colors"
              >
                Open in New Tab
              </a>
            </div>
          </div>
        )}
        <iframe
          ref={iframeRef}
          src={displayUrl}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            "w-full h-full border-none bg-white",
            (tab.loading && !effectiveProxyMode) ? "opacity-0" : "opacity-100",
            (iframeError && !effectiveProxyMode) ? "hidden" : "block"
          )}
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-downloads allow-presentation allow-pointer-lock"
          title={`Aegix - ${tab.title}`}
        />
      </>
    );
  }

  return (
    <div 
      className={cn(
        "absolute inset-0 w-full h-full bg-white transition-opacity duration-200",
        isActive ? "opacity-100 z-10" : "opacity-0 -z-10 pointer-events-none"
      )}
    >
      {content}
    </div>
  );
}
