import React, { useRef, useEffect, useState } from 'react';
import { useBrowserStore } from '../store/useBrowserStore';
import { ShieldCheck, Crosshair, Zap, ArrowDownToLine, ChevronDown, List, Settings, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { AegixLogo } from './AegixLogo';

interface ShieldStatsProps {
  onClose: () => void;
}

export function ShieldStats({ onClose }: ShieldStatsProps) {
  const { activeTabId, tabs, trackersBlocked, adsBlocked, shieldSettings, updateShieldSettings } = useBrowserStore();
  const activeTab = tabs.find(t => t.id === activeTabId);
  const ref = useRef<HTMLDivElement>(null);

  const [shieldsUp, setShieldsUp] = useState(shieldSettings.level !== 'disabled');
  const [advancedOpen, setAdvancedOpen] = useState(true);
  const [blockFingerprinting, setBlockFingerprinting] = useState(true);
  const [forgetOnClose, setForgetOnClose] = useState(false);

  // Sync internal UI state with global store state
  useEffect(() => {
    updateShieldSettings({ level: shieldsUp ? 'standard' : 'disabled' });
  }, [shieldsUp]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const urlObj = activeTab?.url && !activeTab.url.startsWith('aegix://') 
    ? new URL(activeTab.url.startsWith('http') ? activeTab.url : `https://${activeTab.url}`) 
    : null;
    
  let hostname = urlObj ? urlObj.hostname : "New Tab";

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="absolute top-10 left-0 w-[400px] bg-[#242528] rounded-xl z-50 overflow-hidden text-[#d9d9ea] shadow-2xl font-sans"
      ref={ref}
    >
      <div className="p-4 flex items-center border-b border-[#35363a]">
        <div className="mr-3 ml-1">
          <AegixLogo size={24} />
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="font-semibold text-lg text-white truncate">{hostname}</div>
          <div className="text-xs text-gray-400 mt-0.5">Trackers, ads, and more blocked</div>
          <a href="#" className="text-xs text-[#44EEFF] hover:underline block mt-0.5">Learn more</a>
        </div>
        <div className="text-4xl font-light text-white ml-2 pr-2">
          4
        </div>
      </div>
      
      <div className="p-4 bg-[#202226]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="text-gray-400">
               <ShieldCheck size={20} className={shieldsUp ? "text-white" : ""} />
            </div>
            <span className="font-semibold text-white">Shields are {shieldsUp ? 'UP' : 'DOWN'} <span className="font-normal text-gray-300">for this site</span></span>
          </div>
          <button 
            onClick={() => setShieldsUp(!shieldsUp)}
            className={cn("w-[42px] h-6 rounded-full flex items-center transition-colors px-[3px]", shieldsUp ? "bg-[#0077AA]" : "bg-gray-600")}
          >
            <div className={cn("w-4 h-4 bg-white rounded-full transition-transform", shieldsUp ? "translate-x-4" : "translate-x-0")} />
          </button>
        </div>
        
        <p className="text-xs text-gray-400 mb-4 leading-relaxed pr-8">
          If this site seems broken, try Shields down.<br/>
          Note: this may reduce Aegix's privacy protections.
        </p>

        <div className="border-t border-[#35363a] pt-3 -mx-4 px-4">
          <button 
            onClick={() => setAdvancedOpen(!advancedOpen)}
            className="flex items-center justify-between w-full text-sm font-semibold text-[#44EEFF] py-2 hover:bg-[#2A2B2D] px-2 -mx-2 rounded"
          >
            <div className="flex items-center gap-2">
              <List size={16} /> Advanced controls
            </div>
            <ChevronDown size={18} className={cn("transition-transform", advancedOpen ? "rotate-180" : "")} />
          </button>

          <AnimatePresence>
            {advancedOpen && (
              <motion.div 
                 initial={{ height: 0, opacity: 0 }}
                 animate={{ height: 'auto', opacity: 1 }}
                 exit={{ height: 0, opacity: 0 }}
                 className="overflow-hidden space-y-3 mt-3 text-sm"
              >
                <div className="flex items-center justify-between">
                  <select disabled={!shieldsUp} 
                          value={shieldSettings.level} 
                          onChange={(e) => updateShieldSettings({ level: e.target.value as any })}
                          className="bg-[#2A2B2D] border border-[#44464c] text-white rounded p-2 text-sm w-56 appearance-none focus:outline-none focus:border-[#0077AA]">
                    <option value="strict">Block trackers & ads (Strict)</option>
                    <option value="standard">Block trackers & ads (Standard)</option>
                    <option value="disabled">Allow trackers & ads</option>
                  </select>
                  <span className={cn("font-medium", shieldsUp ? "text-[#44EEFF]" : "text-gray-500")}>{trackersBlocked + adsBlocked}</span>
                </div>

                <div className="flex items-center justify-between">
                  <select disabled={!shieldsUp} 
                          value={shieldSettings.upgradeHttps ? 'yes' : 'no'}
                          onChange={(e) => updateShieldSettings({ upgradeHttps: e.target.value === 'yes' })}
                          className="bg-[#2A2B2D] border border-[#44464c] text-white rounded p-2 text-sm w-56 appearance-none focus:outline-none focus:border-[#0077AA]">
                    <option value="yes">Upgrade connections to HTTPS</option>
                    <option value="no">Do not upgrade connections</option>
                  </select>
                </div>

                <div className="flex items-center justify-between pl-1 pr-1">
                  <span className={cn(shieldsUp ? "text-gray-200" : "text-gray-500")}>Block scripts</span>
                  <div className="flex items-center gap-4">
                    <button 
                      disabled={!shieldsUp}
                      onClick={() => updateShieldSettings({ blockScripts: !shieldSettings.blockScripts })}
                      className={cn("w-9 h-5 rounded-full flex items-center transition-colors px-[2px]", shieldSettings.blockScripts && shieldsUp ? "bg-[#0077AA]" : "bg-gray-600", !shieldsUp && "opacity-50")}
                    >
                      <div className={cn("w-3.5 h-3.5 bg-white rounded-full transition-transform", shieldSettings.blockScripts ? "translate-x-4" : "translate-x-0")} />
                    </button>
                    <span className={shieldsUp ? "text-gray-400" : "text-gray-600"}>0</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pl-1 pr-1">
                  <span className={cn(shieldsUp ? "text-gray-200" : "text-gray-500")}>Block fingerprinting</span>
                  <div className="flex items-center gap-4">
                    <button 
                      disabled={!shieldsUp}
                      onClick={() => setBlockFingerprinting(!blockFingerprinting)}
                      className={cn("w-9 h-5 rounded-full flex items-center transition-colors px-[2px]", blockFingerprinting && shieldsUp ? "bg-[#0077AA]" : "bg-gray-600", !shieldsUp && "opacity-50")}
                    >
                      <div className={cn("w-3.5 h-3.5 bg-white rounded-full transition-transform", blockFingerprinting ? "translate-x-4" : "translate-x-0")} />
                    </button>
                    <ChevronRight size={16} className={shieldsUp ? "text-gray-400" : "text-gray-600"} />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <select disabled={!shieldsUp} className="bg-[#2A2B2D] border border-[#44464c] text-white rounded p-2 text-sm w-56 appearance-none focus:outline-none focus:border-[#0077AA]">
                    <option>Block third-party cookies</option>
                    <option>Allow all cookies</option>
                  </select>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <select disabled={!shieldsUp} 
                          value={shieldSettings.dnsOverHttps} 
                          onChange={(e) => updateShieldSettings({ dnsOverHttps: e.target.value })}
                          className="bg-[#2A2B2D] border border-[#44464c] text-white rounded p-2 text-sm w-56 appearance-none focus:outline-none focus:border-[#0077AA]">
                    <option value="off">Secure DNS: Off</option>
                    <option value="cloudflare">Secure DNS: Cloudflare</option>
                    <option value="google">Secure DNS: Google</option>
                    <option value="quad9">Secure DNS: Quad9</option>
                  </select>
                </div>

                <div className="flex items-center justify-between pl-1 pr-1 pt-2 pb-1">
                  <span className={cn(shieldsUp ? "text-gray-200" : "text-gray-500")}>Forget me when I close this site</span>
                  <button 
                    disabled={!shieldsUp}
                    onClick={() => setForgetOnClose(!forgetOnClose)}
                    className={cn("w-9 h-5 rounded-full flex items-center transition-colors px-[2px]", forgetOnClose && shieldsUp ? "bg-[#5D5CFF]" : "bg-gray-600", !shieldsUp && "opacity-50")}
                  >
                    <div className={cn("w-3.5 h-3.5 bg-white rounded-full transition-transform", forgetOnClose ? "translate-x-4" : "translate-x-0")} />
                  </button>
                </div>
                
                <p className="text-xs text-gray-400 mt-2 italic">*Changing these settings might break sites.</p>
                
                <div className="mt-4 pt-4 border-t border-[#35363a] flex flex-col gap-3">
                  <button className="flex items-center gap-2 text-sm text-[#d9d9ea] hover:text-white transition-colors">
                    <List size={16} /> Filter lists
                  </button>
                  <button className="flex items-center gap-2 text-sm text-[#d9d9ea] hover:text-white transition-colors">
                    <Settings size={16} /> Global defaults
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
