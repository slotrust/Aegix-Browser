import React from 'react';
import { Shield, MapPin, Power } from 'lucide-react';
import { useBrowserStore } from '../store/useBrowserStore';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export function VpnMenu({ onClose }: { onClose: () => void }) {
  const { isVpnActive, vpnStatus, vpnLocation, setVpnState, setVpnLocation } = useBrowserStore();

  const locations = [
    { id: 'auto', name: 'Optimal Location (Auto)', flag: '🌍' },
    { id: 'us-nyc', name: 'United States (New York)', flag: '🇺🇸' },
    { id: 'uk-lon', name: 'United Kingdom (London)', flag: '🇬🇧' },
    { id: 'sg', name: 'Singapore', flag: '🇸🇬' },
    { id: 'in', name: 'India (Mumbai)', flag: '🇮🇳' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className="absolute top-10 left-0 w-72 bg-gray-900 border border-gray-700 shadow-2xl rounded-xl z-50 overflow-hidden"
    >
      <div className={cn(
        "p-4 text-white flex items-center justify-between", 
        vpnStatus === 'connected' ? "bg-gradient-to-r from-green-600 to-green-500" : 
        vpnStatus === 'failed' ? "bg-gradient-to-r from-red-600 to-red-500" :
        vpnStatus === 'connecting' ? "bg-gradient-to-r from-yellow-600 to-yellow-500" :
        "bg-gradient-to-r from-gray-700 to-gray-600"
      )}>
        <div className="flex items-center gap-2">
          {vpnStatus === 'connecting' ? (
            <div className="w-5 h-5 border-2 border-yellow-200 border-t-transparent rounded-full animate-spin" />
          ) : vpnStatus === 'failed' ? (
             <Shield size={20} className="text-red-300" />
          ) : (
             <Shield size={20} fill={isVpnActive ? "currentColor" : "none"} className={isVpnActive ? "text-green-200" : "text-gray-300"} />
          )}
          <span className="font-bold">
             {vpnStatus === 'connecting' ? 'Connecting...' : 
              vpnStatus === 'connected' ? 'VPN Connected' : 
              vpnStatus === 'failed' ? 'Connection Failed' : 'VPN Disconnected'}
          </span>
        </div>
        <button 
          onClick={() => {
            if (vpnStatus === 'failed') setVpnState(false);
            else setVpnState(!isVpnActive && vpnStatus !== 'connecting');
          }}
          className={cn("p-2 rounded-full transition-all text-white", isVpnActive ? "bg-green-700 hover:bg-green-800" : "bg-gray-800 hover:bg-gray-900")}
        >
          <Power size={18} />
        </button>
      </div>

      <div className="p-2 border-b border-gray-800 bg-gray-900 flex flex-col gap-1">
        <span className="text-xs font-semibold text-gray-500 uppercase px-2 pt-2">Your IP is {isVpnActive ? 'Hidden' : 'Exposed'}</span>
        {isVpnActive && <span className="text-xs text-green-400 px-2 pb-2">Traffic is encrypted and routed</span>}
      </div>

      <div className="p-2 space-y-1 bg-gray-900">
        <div className="px-2 py-1 flex items-center gap-2 text-sm text-gray-400">
          <MapPin size={14} /> Location
        </div>
        {locations.map(loc => (
          <button
            key={loc.id}
            onClick={() => { setVpnLocation(loc.id); if(!isVpnActive) setVpnState(true); }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-left transition-colors",
              vpnLocation === loc.id ? "bg-gray-800 text-white" : "text-gray-300 hover:bg-gray-800/60"
            )}
          >
            <span className="text-base">{loc.flag}</span>
            <span className="flex-1">{loc.name}</span>
            {vpnLocation === loc.id && isVpnActive && <div className="w-2 h-2 rounded-full bg-green-500" />}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
