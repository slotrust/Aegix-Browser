import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, RotateCw, ShieldAlert, Star, Menu, Lock, Shield, EyeOff, Search, Download } from 'lucide-react';
import { useBrowserStore, Tab } from '../store/useBrowserStore';
import { cn } from '../lib/utils';
import { ShieldStats } from './ShieldStats';
import { VpnMenu } from './VpnMenu';
import { login, logout, auth } from '../lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';

import { toggleFirebaseBookmark } from '../lib/sync';

export function Toolbar() {
  const tabs = useBrowserStore(state => state.tabs);
  const activeTabId = useBrowserStore(state => state.activeTabId);
  const navigate = useBrowserStore(state => state.navigate);
  const goBack = useBrowserStore(state => state.goBack);
  const goForward = useBrowserStore(state => state.goForward);
  const reload = useBrowserStore(state => state.reload);
  const bookmarks = useBrowserStore(state => state.bookmarks);
  const addTab = useBrowserStore(state => state.addTab);
  const isVpnActive = useBrowserStore(state => state.isVpnActive);
  
  const recentSearches = useBrowserStore(state => state.recentSearches);

  const activeTab = tabs.find(t => t.id === activeTabId);
  const [user] = useAuthState(auth);
  
  const [inputUrl, setInputUrl] = useState('');
  const [showShieldMenu, setShowShieldMenu] = useState(false);
  const [showBookmarksMenu, setShowBookmarksMenu] = useState(false);
  const [showVpnMenu, setShowVpnMenu] = useState(false);
  const [showUrlDropdown, setShowUrlDropdown] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeTab) {
      if (activeTab.url === 'aegix://newtab') {
        setInputUrl('');
      } else if (activeTab.url.startsWith('aegix://search')) {
        const q = new URL(activeTab.url.replace('aegix://', 'http://')).searchParams.get('q');
        setInputUrl(q || '');
      } else {
        setInputUrl(activeTab.url);
      }
    }
  }, [activeTab?.url]);

  if (!activeTab) return null;

  const canGoBack = activeTab.historyIndex > 0;
  const canGoForward = activeTab.historyIndex < activeTab.history.length - 1;
  const isBookmarked = bookmarks.some(b => b.url === activeTab.url);
  const isPrivaUrl = activeTab.url.startsWith('aegix://');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputUrl.trim()) {
      navigate(activeTab.id, inputUrl.trim());
      setShowUrlDropdown(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div className={cn("flex items-center h-[42px] border-b px-2 gap-2 transition-colors", activeTab.isPrivate ? "bg-[#181a1f] border-gray-800" : "bg-[#202226] border-gray-700")}>
      {/* Navigation Controls */}
      <div className="flex items-center text-gray-400">
        <button 
          onClick={() => goBack(activeTab.id)}
          disabled={!canGoBack}
          className={cn("p-1.5 rounded-full transition-colors", canGoBack ? "hover:bg-gray-700 hover:text-white" : "opacity-30 cursor-not-allowed")}
        >
          <ArrowLeft size={18} />
        </button>
        <button 
          onClick={() => goForward(activeTab.id)}
          disabled={!canGoForward}
          className={cn("p-1.5 rounded-full transition-colors", canGoForward ? "hover:bg-gray-700 hover:text-white" : "opacity-30 cursor-not-allowed")}
        >
          <ArrowRight size={18} />
        </button>
        <button 
          onClick={() => reload(activeTab.id)}
          className="p-1.5 rounded-full hover:bg-gray-700 hover:text-white transition-colors"
        >
          <RotateCw size={16} className={cn(activeTab.loading && "animate-spin text-[#44EEFF]")} />
        </button>
      </div>

      {/* Address Bar */}
      <form onSubmit={handleSubmit} className="flex-1 max-w-5xl relative flex items-center mx-2">
        <div className="absolute left-0 top-0 bottom-0 flex items-center gap-1 pl-2">
          {!isPrivaUrl && (
            <div className="relative">
              <button 
                type="button"
                onClick={() => setShowShieldMenu(!showShieldMenu)}
                className="p-1 rounded-md text-[#44EEFF] hover:bg-gray-700/50 transition-colors"
                title="Aegix Shields"
              >
                <ShieldAlert size={16} fill="currentColor" />
              </button>
              {showShieldMenu && (
                <ShieldStats onClose={() => setShowShieldMenu(false)} />
              )}
            </div>
          )}
          {!isPrivaUrl && <Lock size={14} className={activeTab.isPrivate ? "text-[#44EEFF]" : "text-gray-400"} />}
          {activeTab.isPrivate && <EyeOff size={14} className="text-[#44EEFF] ml-1" title="Private Browsing" />}
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          onFocus={(e) => {
            e.target.select();
            setShowUrlDropdown(true);
          }}
          onBlur={() => setTimeout(() => setShowUrlDropdown(false), 200)}
          placeholder={activeTab.isPrivate ? "Search privately or type a URL" : "Search or type a URL"}
          className={cn(
            "w-full text-white rounded-full h-8 pr-10 text-[13px] tracking-wide focus:outline-none focus:ring-2 focus:ring-inset transition-all placeholder:text-gray-500",
            activeTab.isPrivate ? "bg-[#0f1115] focus:ring-[#0077AA]/80" : "bg-[#181a1f] focus:ring-[#44EEFF]/80 border border-gray-700/50 focus:border-transparent",
            isPrivaUrl && !activeTab.isPrivate ? "pl-4" : "pl-14",
            activeTab.isPrivate ? "pl-20" : ""
          )}
        />
        
        {showUrlDropdown && (inputUrl.trim() || recentSearches.length > 0) && (
          <div className="absolute top-full mt-1 left-0 right-0 bg-[#202226] border border-gray-700 rounded-lg shadow-2xl z-50 overflow-hidden py-1">
            {inputUrl.trim() && (
              <button
                type="button"
                className="w-full text-left px-4 py-2 hover:bg-[#44EEFF]/20 flex items-center gap-3 text-sm text-gray-200"
                onClick={() => {
                  navigate(activeTab.id, inputUrl);
                  setShowUrlDropdown(false);
                }}
              >
                <div className="w-5 flex justify-center"><Search size={14} className="text-gray-400" /></div>
                <span><span className="text-[#44EEFF] font-medium">{inputUrl}</span></span>
              </button>
            )}

            {!inputUrl.trim() && recentSearches.slice(0, 3).map((rs, i) => (
               <button
                 key={`recent-${i}`}
                 type="button"
                 className="w-full text-left px-4 py-2 hover:bg-gray-800 flex items-center gap-3 text-sm text-gray-300"
                 onClick={() => {
                   setInputUrl(rs);
                   navigate(activeTab.id, rs);
                   setShowUrlDropdown(false);
                 }}
               >
                 <div className="w-5 flex justify-center"><RotateCw size={14} className="text-gray-500" /></div>
                 <span className="truncate text-gray-300">{rs}</span>
               </button>
            ))}

            {inputUrl.trim() && bookmarks.filter(b => b.title?.toLowerCase().includes(inputUrl.toLowerCase()) || b.url.toLowerCase().includes(inputUrl.toLowerCase())).slice(0, 3).map(b => (
               <button
                 key={b.id || b.url}
                 type="button"
                 className="w-full text-left px-4 py-2 hover:bg-gray-800 flex items-center gap-3 text-sm text-gray-300"
                 onClick={() => {
                   navigate(activeTab.id, b.url);
                   setShowUrlDropdown(false);
                 }}
               >
                 <div className="w-5 flex justify-center"><Star size={14} className="text-gray-400" /></div>
                 <div className="flex flex-col overflow-hidden">
                   <span className="truncate text-white">{b.title}</span>
                   <span className="truncate text-gray-500 text-xs">{b.url}</span>
                 </div>
               </button>
            ))}
          </div>
        )}

        <div className="absolute right-0 top-0 bottom-0 flex items-center pr-2">
          {!isPrivaUrl && (
            <button
              type="button"
              onClick={() => toggleFirebaseBookmark(activeTab.url)}
              className="p-1.5 rounded-md transition-colors hover:bg-gray-700"
              title="Bookmark this tab"
            >
              <Star size={16} className={cn(isBookmarked ? "text-[#44EEFF] fill-[#44EEFF]" : "text-gray-400")} />
            </button>
          )}
        </div>
      </form>

      {/* Extensions / Menu */}
      <div className="flex items-center gap-1 text-gray-400 relative">
        <div className="relative">
          <button
             onClick={() => { setShowVpnMenu(!showVpnMenu); setShowBookmarksMenu(false); }}
             className={cn("p-1.5 flex items-center gap-1 rounded-full transition-colors text-xs font-semibold", isVpnActive ? "bg-[#0077AA]/20 text-[#44EEFF] hover:bg-[#0077AA]/40" : "hover:bg-gray-700 hover:text-white")}
             title="VPN"
          >
             <Shield size={16} fill={isVpnActive ? "currentColor" : "none"} />
             {isVpnActive && <span>VPN</span>}
          </button>
          {showVpnMenu && (
             <VpnMenu onClose={() => setShowVpnMenu(false)} />
          )}
        </div>
        
        <button 
           onClick={() => navigate(activeTab.id, 'aegix://downloads')}
           className="p-1.5 rounded-full hover:bg-gray-700 hover:text-white transition-colors"
           title="Downloads"
        >
           <Download size={18} />
        </button>

        <button 
          onClick={() => { setShowBookmarksMenu(!showBookmarksMenu); setShowVpnMenu(false); }}
          className="p-1.5 rounded-full hover:bg-gray-700 hover:text-white transition-colors"
        >
          <Menu size={18} />
        </button>
        {showBookmarksMenu && (
          <div className="absolute top-10 right-0 w-64 bg-gray-900 border border-gray-700 shadow-2xl rounded-xl z-50 py-2">
            <div className="px-4 py-2 border-b border-gray-800 flex justify-between items-center">
              <span className="text-sm font-semibold text-white">Aegix Menu</span>
            </div>
            <div className="py-1">
               <button 
                 onClick={() => { addTab('aegix://newtab', true, true); setShowBookmarksMenu(false); }}
                 className="w-full text-left px-4 py-2 hover:bg-gray-800 flex items-center gap-2 text-sm text-[#44EEFF] hover:text-[#0077AA] transition-colors"
               >
                 <EyeOff size={16} /> New Private Tab
               </button>
            </div>
            
            <div className="px-4 py-2 border-y border-gray-800 flex justify-between items-center bg-gray-800/30">
               <span className="text-xs font-semibold text-gray-400">SYNC & SETTINGS</span>
               {user ? (
                 <button onClick={logout} className="text-xs text-red-400 hover:text-red-300">Sign Out</button>
               ) : (
                 <button onClick={login} className="text-xs text-blue-400 hover:text-blue-300">Sign In</button>
               )}
            </div>

            <div className="px-4 py-2 border-b border-gray-800">
              <span className="text-sm font-semibold text-gray-400">Bookmarks</span>
            </div>
            <div className="max-h-56 overflow-y-auto">
              {bookmarks.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500">No bookmarks yet.</div>
              ) : (
                bookmarks.map((b, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      navigate(activeTab.id, b.url);
                      setShowBookmarksMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-800 flex flex-col transition-colors"
                  >
                    <span className="text-sm text-gray-200 truncate">{b.title}</span>
                    <span className="text-xs text-gray-500 truncate">{b.url}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
