import React, { useEffect, useState } from 'react';
import { Settings, Shield, Key, History, Download, Trash2, CheckCircle2, Globe, Lock } from 'lucide-react';
import { useBrowserStore } from '../store/useBrowserStore';
import { cn } from '../lib/utils';

export function InternalPage({ type }: { type: 'history' | 'settings' | 'passwords' | 'downloads' }) {
  const { navigate, activeTabId, clearBrowsingData, downloads, isVpnActive, vpnLocation, setVpnState, setVpnLocation, shieldSettings, updateShieldSettings } = useBrowserStore();
  const [cleared, setCleared] = useState(false);

  const handleClear = () => {
    clearBrowsingData();
    setCleared(true);
    setTimeout(() => setCleared(false), 3000);
  };

  return (
    <div className="w-full h-full bg-gray-50 dark:bg-[#040C18] overflow-y-auto pt-8">
      <div className="max-w-4xl mx-auto px-6 pb-20 text-gray-800 dark:text-gray-100">
        
        {type === 'settings' && (
          <div className="space-y-8 flex">
            {/* Sidebar like Brave Settings */}
            <div className="w-64 pr-8 hidden md:block border-r border-gray-800 mr-8">
              <h1 className="text-xl font-bold mb-6 text-[#44EEFF]">Aegix Settings</h1>
              <nav className="space-y-2">
                <a href="#shields" className="block px-3 py-2 rounded-md bg-[#0077AA]/20 text-[#44EEFF] font-medium">Aegix Shields</a>
                <a href="#privacy" className="block px-3 py-2 rounded-md hover:bg-gray-800 text-gray-300">Privacy & Security</a>
                <a href="#vpn" className="block px-3 py-2 rounded-md hover:bg-gray-800 text-gray-300">Aegix VPN</a>
                <a href="#sync" className="block px-3 py-2 rounded-md hover:bg-gray-800 text-gray-300">Sync</a>
              </nav>
            </div>
            
            <div className="flex-1 space-y-10">
              <section id="shields" className="bg-white dark:bg-[#0A1A2E] p-6 rounded-xl border border-gray-200 dark:border-[#0077AA]/30 shadow-sm">
                <h2 className="text-xl font-medium mb-4 flex items-center gap-2">
                  <Shield className="text-[#44EEFF]" size={20} />
                  Aegix Shields Defaults
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  Shields protect you by blocking trackers and ads that follow you across the web.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#040C18] rounded-lg border border-gray-800">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">Trackers & ads blocking</h3>
                    </div>
                    <select 
                      value={shieldSettings.level}
                      onChange={(e) => updateShieldSettings({ level: e.target.value as any })}
                      className="bg-[#2A2B2D] border border-gray-700 text-white rounded p-2 text-sm w-48 focus:outline-none focus:border-[#44EEFF]">
                      <option value="strict">Strict</option>
                      <option value="standard">Standard (Default)</option>
                      <option value="disabled">Disabled</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#040C18] rounded-lg border border-gray-800">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">Upgrade connections to HTTPS</h3>
                    </div>
                    <input type="checkbox" checked={shieldSettings.upgradeHttps} onChange={(e) => updateShieldSettings({ upgradeHttps: e.target.checked })} className="accent-[#0077AA] w-4 h-4 cursor-pointer" />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#040C18] rounded-lg border border-gray-800">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">Block scripts</h3>
                    </div>
                    <input type="checkbox" checked={shieldSettings.blockScripts} onChange={(e) => updateShieldSettings({ blockScripts: e.target.checked })} className="accent-[#0077AA] w-4 h-4 cursor-pointer" />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#040C18] rounded-lg border border-gray-800">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">Use secure DNS (DNS-over-HTTPS)</h3>
                      <p className="text-sm text-gray-500">Encrypts your DNS lookups to enhance privacy and prevent interception.</p>
                    </div>
                    <select 
                      value={shieldSettings.dnsOverHttps}
                      onChange={(e) => updateShieldSettings({ dnsOverHttps: e.target.value })}
                      className="bg-[#2A2B2D] border border-gray-700 text-white rounded p-2 text-sm w-48 focus:outline-none focus:border-[#44EEFF]">
                      <option value="off">Off (System Default)</option>
                      <option value="cloudflare">Cloudflare (1.1.1.1)</option>
                      <option value="google">Google Public DNS</option>
                      <option value="quad9">Quad9 (9.9.9.9)</option>
                    </select>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-[#040C18] rounded-lg border border-gray-800 space-y-4">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white flex items-center justify-between">
                        Advanced custom filters
                        <div className="text-xs text-gray-500">ML heuristics {shieldSettings.mlAdBlocking ? 'enabled' : 'disabled'}</div>
                      </h3>
                      <p className="text-sm text-gray-500">Specify custom ad list URLs (EasyList) or specific domains/patterns to block (one per line).</p>
                    </div>
                    <textarea 
                       className="w-full h-32 bg-[#2A2B2D] border border-gray-700 text-white rounded p-3 text-sm focus:outline-none focus:border-[#44EEFF] font-mono resize-none"
                       placeholder="e.g. youtube.com/api/stats/ads\nhttps://easylist.to/easylist/easylist.txt"
                       value={shieldSettings.customAdRules.join('\n')}
                       onChange={(e) => updateShieldSettings({ customAdRules: e.target.value.split('\n').filter(Boolean) })}
                    />
                  </div>
                </div>
              </section>

              <section id="vpn" className="bg-white dark:bg-[#0A1A2E] p-6 rounded-xl border border-gray-200 dark:border-[#0077AA]/30 shadow-sm">
                <h2 className="text-xl font-medium mb-4 flex items-center gap-2">
                  <Globe className="text-[#44EEFF]" size={20} /> {/* Assuming Globe is imported */}
                  Aegix VPN Configuration
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#040C18] rounded-lg border border-gray-800">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">Enable VPN</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Route your traffic through secure servers</p>
                    </div>
                    <input type="checkbox" checked={isVpnActive} onChange={(e) => setVpnState(e.target.checked)} className="accent-[#0077AA] w-4 h-4 cursor-pointer" />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#040C18] rounded-lg border border-gray-800">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">Global Server Location</h3>
                    </div>
                    <select 
                      value={vpnLocation}
                      onChange={(e) => setVpnLocation(e.target.value)}
                      className="bg-[#2A2B2D] border border-gray-700 text-white rounded p-2 text-sm w-48 focus:outline-none focus:border-[#44EEFF]">
                      <option value="auto">Optimal (Auto)</option>
                      <option value="us-nyc">🇺🇸 United States</option>
                      <option value="uk-lon">🇬🇧 United Kingdom</option>
                      <option value="sg">🇸🇬 Singapore</option>
                      <option value="in">🇮🇳 India</option>
                    </select>
                  </div>
                </div>
              </section>

              <section id="privacy" className="bg-white dark:bg-[#0A1A2E] p-6 rounded-xl border border-gray-200 dark:border-[#0077AA]/30 shadow-sm">
                <h2 className="text-xl font-medium mb-4 flex items-center gap-2">
                  <Lock className="text-[#44EEFF]" size={20} />
                  Privacy and Security
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#040C18] rounded-lg border border-gray-800">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">Default Search Engine</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Search engine used in the address bar</p>
                    </div>
                    <select 
                      value={useBrowserStore().searchEngine}
                      onChange={(e) => useBrowserStore().setSearchEngine(e.target.value as any)}
                      className="bg-[#2A2B2D] border border-gray-700 text-white rounded p-2 text-sm w-48 focus:outline-none focus:border-[#44EEFF]">
                      <option value="google">Google Search (with AI)</option>
                      <option value="duckduckgo">DuckDuckGo</option>
                      <option value="bing">Bing Search</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#040C18] rounded-lg border border-gray-800">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">Clear browsing data</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Clear history, cookies, cache, and more</p>
                    </div>
                    <button 
                      onClick={handleClear}
                      className="px-4 py-2 bg-[#0077AA] hover:bg-[#44EEFF] hover:text-[#040C18] text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                      {cleared ? <><CheckCircle2 size={16} /> Cleared</> : "Clear data"}
                    </button>
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}

        {type === 'passwords' && (
          <div className="space-y-8">
            <header className="border-b border-gray-200 dark:border-gray-800 pb-6 flex items-center gap-4">
              <Key className="text-[#fb542b]" size={32} />
              <h1 className="text-3xl font-semibold">Password Manager</h1>
            </header>
            <div className="text-center py-12 text-gray-500">
              <Key className="mx-auto mb-4 opacity-50" size={48} />
              <h3 className="text-lg font-medium dark:text-gray-300">No saved passwords yet</h3>
              <p>Passwords you save securely will appear here.</p>
            </div>
          </div>
        )}

        {type === 'history' && (
          <div className="space-y-8">
            <header className="border-b border-gray-200 dark:border-gray-800 pb-6 flex items-center gap-4">
              <History className="text-[#fb542b]" size={32} />
              <h1 className="text-3xl font-semibold">History</h1>
            </header>
            <div className="text-center py-12 text-gray-500">
               <History className="mx-auto mb-4 opacity-50" size={48} />
               <p>Your history will appear here once connected to syncing, or browsed.</p>
            </div>
          </div>
        )}

        {type === 'downloads' && (
          <div className="space-y-8">
            <header className="border-b border-gray-200 dark:border-gray-800 pb-6 flex items-center gap-4">
              <Download className="text-[#fb542b]" size={32} />
              <h1 className="text-3xl font-semibold">Downloads</h1>
            </header>
            {downloads.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Download className="mx-auto mb-4 opacity-50" size={48} />
                <p>No downloads yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {downloads.map(dl => (
                   <div key={dl.id} className="flex flex-col p-4 bg-gray-50 dark:bg-[#040C18] rounded-lg border border-gray-800">
                     <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-gray-200">{dl.filename}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">{new Date(dl.date).toLocaleDateString()}</span>
                          <span className={cn("text-xs font-medium px-2 py-1 rounded", {
                            "bg-green-500/20 text-green-400": dl.status === 'completed',
                            "bg-orange-500/20 text-orange-400": dl.status === 'downloading',
                            "bg-red-500/20 text-red-400": dl.status === 'failed'
                          })}>{dl.status === 'downloading' ? 'In Progress' : dl.status === 'completed' ? 'Completed' : 'Failed'}</span>
                        </div>
                     </div>
                     
                     {dl.status === 'downloading' && (
                       <div className="flex items-center gap-3 mb-2">
                          <div className="flex-1 bg-gray-800 h-2 rounded-full overflow-hidden">
                             <div className="bg-[#44EEFF] h-full transition-all duration-300" style={{ width: `${dl.progress}%` }} />
                          </div>
                          <span className="text-xs text-[#0077AA] w-6">{dl.progress}%</span>
                       </div>
                     )}
                     
                     <div className="text-xs text-gray-400 mt-2 truncate w-full">{dl.url}</div>
                   </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
