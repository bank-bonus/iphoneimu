/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Smartphone, 
  RotateCcw, 
  RotateCw, 
  Globe, 
  Info, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Menu,
  Monitor,
  Layout
} from 'lucide-react';
import { cn } from './lib/utils';

// Device presets
const DEVICES = {
  iphone15: { name: 'iPhone 15 Pro', width: 393, height: 852, bezel: 12, radius: 48 },
  iphoneSE: { name: 'iPhone SE', width: 375, height: 667, bezel: 10, radius: 20 },
  iphone13Mini: { name: 'iPhone 13 Mini', width: 375, height: 812, bezel: 12, radius: 44 },
};

type DeviceKey = keyof typeof DEVICES;

export default function App() {
  const [url, setUrl] = useState('https://www.google.com');
  const [inputUrl, setInputUrl] = useState(url);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [device, setDevice] = useState<DeviceKey>('iphone15');
  const [scale, setScale] = useState(0.8);
  const [isLoading, setIsLoading] = useState(false);
  const [useProxy, setUseProxy] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const currentDevice = DEVICES[device];

  const getEffectiveUrl = () => {
    if (!url) return '';
    if (useProxy) {
      return `/api/proxy?url=${encodeURIComponent(url)}&ua=${encodeURIComponent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1')}`;
    }
    return url;
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let formattedUrl = inputUrl.trim();
    if (!formattedUrl) return;
    
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
    }
    
    setIsLoading(true);
    setUrl(formattedUrl);
    setInputUrl(formattedUrl);
  };

  const toggleOrientation = () => {
    setOrientation(prev => prev === 'portrait' ? 'landscape' : 'portrait');
  };

  const refreshFrame = () => {
    setIsLoading(true);
    const currentUrl = url;
    setUrl('');
    setTimeout(() => setUrl(currentUrl), 50);
  };

  // Adjust zoom automatically based on screen size
  useEffect(() => {
    const handleResize = () => {
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      const deviceWidth = orientation === 'portrait' ? currentDevice.width : currentDevice.height;
      const deviceHeight = orientation === 'portrait' ? currentDevice.height : currentDevice.width;
      
      const horizontalScale = (screenWidth - 400) / deviceWidth;
      const verticalScale = (screenHeight - 200) / deviceHeight;
      const newScale = Math.min(horizontalScale, verticalScale, 1);
      setScale(Math.max(newScale, 0.4));
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [orientation, device]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans overflow-hidden flex flex-col">
      {/* Navbar */}
      <header className="h-16 border-b border-white/10 px-6 flex items-center justify-between bg-black/50 backdrop-blur-md z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Smartphone className="w-5 h-5" />
          </div>
          <h1 className="font-semibold text-lg tracking-tight hidden sm:block">iOS Emulator</h1>
        </div>

        <form onSubmit={handleUrlSubmit} className="flex-1 max-w-2xl mx-4">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/30 group-focus-within:text-blue-500 transition-colors">
              <Globe className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
              placeholder="Enter URL (e.g. google.com)"
            />
          </div>
        </form>

        <div className="flex items-center gap-2">
          <button 
            onClick={refreshFrame}
            className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/60 hover:text-white"
            title="Refresh Frame"
          >
            <RotateCw className={cn("w-5 h-5", isLoading && "animate-spin")} />
          </button>
          <button 
            onClick={toggleOrientation}
            className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/60 hover:text-white"
            title="Rotate Device"
          >
            {orientation === 'portrait' ? <RotateCcw className="w-5 h-5" /> : <RotateCw className="w-5 h-5" />}
          </button>
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/60 hover:text-white"
            title="Open in new tab"
          >
            <ExternalLink className="w-5 h-5" />
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative flex overflow-hidden">
        {/* Sidebar Controls */}
        <aside className="w-64 border-r border-white/10 p-6 flex flex-col gap-8 bg-black/20 overflow-y-auto hidden md:flex">
          <div>
            <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">Device Model</h2>
            <div className="space-y-2">
              {(Object.keys(DEVICES) as DeviceKey[]).map((key) => (
                <button
                  key={key}
                  onClick={() => setDevice(key)}
                  className={cn(
                    "w-full text-left px-4 py-2 rounded-xl transition-all flex items-center justify-between group",
                    device === key ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "hover:bg-white/5 text-white/60"
                  )}
                >
                  <span className="text-sm font-medium">{DEVICES[key].name}</span>
                  <Smartphone className={cn("w-4 h-4", device === key ? "opacity-100" : "opacity-0 group-hover:opacity-40")} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">Appearance</h2>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => setOrientation('portrait')}
                className={cn(
                  "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all",
                  orientation === 'portrait' ? "border-blue-600 bg-blue-600/10 text-blue-400" : "border-white/10 hover:border-white/20 text-white/40"
                )}
              >
                <Smartphone className="w-6 h-6" />
                <span className="text-[10px] uppercase font-bold">Portrait</span>
              </button>
              <button 
                onClick={() => setOrientation('landscape')}
                className={cn(
                  "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all",
                  orientation === 'landscape' ? "border-blue-600 bg-blue-600/10 text-blue-400" : "border-white/10 hover:border-white/20 text-white/40"
                )}
              >
                <Smartphone className="w-6 h-6 rotate-90" />
                <span className="text-[10px] uppercase font-bold">Landscape</span>
              </button>
            </div>
          </div>

          <div className="mt-auto space-y-4">
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-bold uppercase tracking-wider">Safe Mode</span>
                </div>
                <button
                  onClick={() => setUseProxy(!useProxy)}
                  className={cn(
                    "w-10 h-5 rounded-full transition-colors relative",
                    useProxy ? "bg-blue-600" : "bg-neutral-800"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-3 h-3 bg-white rounded-full transition-transform",
                    useProxy ? "left-6" : "left-1"
                  )} />
                </button>
              </div>
              <p className="text-[11px] text-white/50 leading-relaxed">
                Safe Mode (Proxy) bypasses restrictions like X-Frame-Options, allowing you to view sites like Google or YouTube.
              </p>
            </div>

            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <div className="flex items-center gap-2 text-yellow-500 mb-2">
                <Info className="w-4 h-4" />
                <span className="text-xs font-bold uppercase">Note</span>
              </div>
              <p className="text-[11px] text-white/50 leading-relaxed">
                Some sites may still experience issues with complex JS or relative paths when in Proxy Mode.
              </p>
            </div>
          </div>
        </aside>

        {/* Device Viewport */}
        <section className="flex-1 flex items-center justify-center relative p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-600/5 via-transparent to-transparent pointer-events-none" />
          
          <motion.div
            initial={false}
            animate={{
              width: orientation === 'portrait' ? currentDevice.width : currentDevice.height,
              height: orientation === 'portrait' ? currentDevice.height : currentDevice.width,
              rotate: orientation === 'portrait' ? 0 : 0, // Visual rotation handled by container
              scale: scale
            }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative shadow-[0_0_100px_rgba(0,0,0,0.5)] z-10"
          >
            {/* iPhone Frame */}
            <div 
              className="absolute inset-0 bg-neutral-900 border-[10px] border-neutral-800 shadow-2xl ring-2 ring-white/10"
              style={{ borderRadius: currentDevice.radius + 'px' }}
            >
              {/* Dynamic Island / Notch */}
              <div className={cn(
                "absolute bg-black z-20 transition-all",
                orientation === 'portrait' 
                  ? "top-4 left-1/2 -translate-x-1/2 w-32 h-8 rounded-full" 
                  : "top-1/2 left-4 -translate-y-1/2 w-8 h-32 rounded-full"
              )} />
              
              {/* Buttons */}
              <div className={cn("absolute bg-neutral-700 w-[3px] rounded-r-sm", orientation === 'portrait' ? "top-24 -left-[13px] h-12" : "left-24 -top-[13px] w-12 h-[3px]")} />
              <div className={cn("absolute bg-neutral-700 w-[3px] rounded-r-sm", orientation === 'portrait' ? "top-40 -left-[13px] h-16" : "left-40 -top-[13px] w-16 h-[3px]")} />
              <div className={cn("absolute bg-neutral-700 w-[3px] rounded-r-sm", orientation === 'portrait' ? "top-60 -left-[13px] h-16" : "left-60 -top-[13px] w-16 h-[3px]")} />
              <div className={cn("absolute bg-neutral-700 w-[3px] rounded-l-sm", orientation === 'portrait' ? "top-32 -right-[13px] h-24" : "left-32 -bottom-[13px] w-24 h-[3px]")} />

              {/* Screen */}
              <div 
                className="w-full h-full relative overflow-hidden bg-white"
                style={{ borderRadius: (currentDevice.radius - 10) + 'px' }}
              >
                <AnimatePresence mode="wait">
                  <motion.iframe
                    key={url + orientation + useProxy}
                    ref={iframeRef}
                    src={getEffectiveUrl()}
                    className="w-full h-full border-none bg-white font-sans"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onLoad={() => setIsLoading(false)}
                    allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
                    sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
                  />
                </AnimatePresence>

                {/* Loading State */}
                {isLoading && (
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-50 p-6 text-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full mb-4"
                    />
                    <p className="text-white font-medium mb-4">Loading Emulator...</p>
                    <button 
                      onClick={() => setIsLoading(false)}
                      className="text-[10px] text-white/40 hover:text-white border border-white/10 px-3 py-1.5 rounded-full transition-colors"
                    >
                      Wait, it's taking too long? Click to dismiss overlay.
                    </button>
                    <div className="mt-8 text-[11px] text-white/30 max-w-[200px]">
                      If the site is very complex, it might not work perfectly in an emulator frame.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </section>

        {/* Floating Scale Control */}
        <div className="absolute bottom-6 right-6 flex flex-col gap-2 bg-black/80 backdrop-blur-md p-2 rounded-2xl border border-white/10">
          <button 
            onClick={() => setScale(s => Math.min(s + 0.1, 1.5))}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <ChevronRight className="w-5 h-5 -rotate-90" />
          </button>
          <div className="h-[1px] bg-white/10 mx-2" />
          <button 
            onClick={() => setScale(s => Math.max(s - 0.1, 0.2))}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <ChevronRight className="w-5 h-5 rotate-90" />
          </button>
        </div>
      </main>

      {/* Footer / Status */}
      <footer className="h-10 border-t border-white/10 px-6 flex items-center justify-between bg-black/80 text-[10px] text-white/40 font-mono uppercase tracking-widest">
        <div className="flex gap-6">
          <span>Resolution: {orientation === 'portrait' ? `${currentDevice.width}x${currentDevice.height}` : `${currentDevice.height}x${currentDevice.width}`}</span>
          <span>DPR: 3.0</span>
        </div>
        <div className="flex gap-4">
          <span className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            System Online
          </span>
          <span>v1.0.4</span>
        </div>
      </footer>
    </div>
  );
}
