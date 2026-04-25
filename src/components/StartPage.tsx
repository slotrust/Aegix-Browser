import React, { useEffect, useState } from 'react';
import { useBrowserStore } from '../store/useBrowserStore';
import { Settings, Image as ImageIcon, EyeOff } from 'lucide-react';
import { cn } from '../lib/utils';
import { AegixLogo } from './AegixLogo';

export function StartPage({ isPrivate }: { isPrivate?: boolean }) {
  const { trackersBlocked, adsBlocked, dataSavedKb, timeSavedSeconds } = useBrowserStore();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className={cn("w-full h-full relative overflow-hidden text-white flex flex-col items-center justify-center", isPrivate ? "bg-[#020610]" : "bg-[#040C18]")}>
      {/* Background patterns */}
      <div className="absolute inset-0 z-0">
        <div className={cn("absolute inset-0", isPrivate ? "bg-gradient-to-br from-[#06152B]/40 via-[#020610] to-[#0A1A2E]/30" : "bg-gradient-to-br from-[#003A5B]/40 via-[#040C18] to-[#081F38]/30")} />
        <div className={cn("absolute top-0 right-0 w-96 h-96 rounded-full blur-[128px]", isPrivate ? "bg-[#0077AA]/10" : "bg-[#44EEFF]/10")} />
        <div className={cn("absolute bottom-0 left-0 w-full h-96 rounded-full blur-[128px]", isPrivate ? "bg-indigo-500/10" : "bg-[#0077AA]/10")} />
      </div>

      <div className="z-10 w-full max-w-5xl px-8 flex flex-col h-full">
        <header className="flex justify-between items-center py-6 text-[#A0B8CD]">
          <div className="flex gap-8">
            <StatItem value={(trackersBlocked + adsBlocked).toLocaleString()} label="Trackers & ads blocked" />
            <StatItem value={`${(dataSavedKb / 1024).toFixed(1)}MB`} label="Bandwidth saved" />
            <StatItem value={`${Math.floor(timeSavedSeconds / 60)}m`} label="Time saved" />
          </div>
          <div className="flex gap-4">
             <button className="p-2 hover:bg-white/10 rounded-full transition-colors"><ImageIcon size={18} /></button>
             <button className="p-2 hover:bg-white/10 rounded-full transition-colors"><Settings size={18} /></button>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center pb-32">
          {isPrivate ? (
             <div className="flex flex-col items-center text-center max-w-lg mb-8">
                <EyeOff size={64} className="text-[#44EEFF] mb-6" />
                <h1 className="text-3xl font-bold font-sans tracking-tight mb-4">You're in a Private Window</h1>
                <p className="text-gray-400">Aegix won't save your browsing history, cookies and site data, or information entered in forms. Downloads and bookmarks will be saved.</p>
             </div>
          ) : (
            <div className="flex flex-col items-center justify-center w-full max-w-2xl px-4 z-10 pb-4 mt-2">
              <div className="flex flex-col items-center group">
                <div className="transition-transform duration-700 ease-out group-hover:scale-110">
                  <AegixLogo size={160} />
                </div>
              </div>
              <div className="w-full flex flex-col items-center mt-2">
                <div className="text-center mb-4">
                  <h1 className="text-5xl font-bold font-sans tracking-tight text-white/90 drop-shadow-sm mb-2">
                    {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </h1>
                  <p className="text-[#44EEFF]/70 font-mono text-xs tracking-[0.1em] uppercase font-semibold">
                    {Intl.DateTimeFormat().resolvedOptions().timeZone.replace('_', ' ')}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Dashboard elements can go here: top sites, news, etc. */}
          {!isPrivate && (
            <div className="grid grid-cols-4 gap-6 w-full max-w-3xl mt-4">
               <TopSite url="https://wikipedia.org" name="Wikipedia" iconUrl="https://upload.wikimedia.org/wikipedia/commons/6/63/Wikipedia-logo.png" bg="bg-white p-2" />
               <TopSite url="https://github.com" name="GitHub" iconUrl="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png" bg="bg-white" />
               <TopSite url="https://youtube.com" name="YouTube" iconNode={<svg viewBox="0 0 24 24" fill="red" className="w-10 h-10"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>} bg="bg-white p-2" />
               <TopSite url="https://news.ycombinator.com" name="Hacker News" iconNode={<div className="font-bold text-white text-3xl border-2 border-white w-9 h-9 flex items-center justify-center">Y</div>} bg="bg-[#FF6600]" />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function StatItem({ value, label }: { value: string, label: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-xl font-bold text-white tracking-wide">{value}</span>
      <span className="text-xs font-medium text-[#8EBBFF] uppercase tracking-wider mt-0.5">{label}</span>
    </div>
  );
}

function TopSite({ url, name, iconUrl, iconNode, fallback, bg }: { url: string, name: string, iconUrl?: string, iconNode?: React.ReactNode, fallback?: string, bg: string }) {
  const { activeTabId, navigate } = useBrowserStore();
  
  return (
    <button 
      onClick={() => activeTabId && navigate(activeTabId, url)}
      className="flex flex-col items-center gap-3 group"
    >
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-bold shadow-lg transition-transform group-hover:scale-105 overflow-hidden ${bg}`}>
        {iconNode ? iconNode : iconUrl ? (
           <img src={iconUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
           fallback
        )}
      </div>
      <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">{name}</span>
    </button>
  );
}
