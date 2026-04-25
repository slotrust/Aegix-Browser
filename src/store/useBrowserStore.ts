import { create } from 'zustand';

export interface TabGroup {
  id: string;
  name: string;
  color: string;
  collapsed: boolean;
}

export interface Tab {
  id: string;
  url: string; // The current URL (could be aegix://newtab)
  title: string;
  loading: boolean;
  history: string[];
  historyIndex: number;
  isPrivate?: boolean;
  isPinned?: boolean;
  groupId?: string;
}

export interface Bookmark {
  title: string;
  url: string;
  icon?: string;
  id?: string;
}

export interface PasswordEntry {
  id: string;
  url: string;
  username: string;
  passwordMock: string;
}

export interface DownloadItem {
  id: string;
  filename: string;
  url: string;
  progress: number;
  status: 'downloading' | 'completed' | 'failed';
  date: string;
}

interface BrowserState {
  tabs: Tab[];
  tabGroups: TabGroup[];
  activeTabId: string | null;
  trackersBlocked: number;
  adsBlocked: number;
  dataSavedKb: number;
  timeSavedSeconds: number;
  bookmarks: Bookmark[];
  passwords: PasswordEntry[];
  downloads: DownloadItem[];
  
  // Search Settings
  searchEngine: 'google' | 'duckduckgo' | 'bing';
  setSearchEngine: (engine: 'google' | 'duckduckgo' | 'bing') => void;
  recentSearches: string[];
  addRecentSearch: (query: string) => void;

  // VPN State
  isVpnActive: boolean;
  vpnStatus: 'disconnected' | 'connecting' | 'connected' | 'failed';
  vpnLocation: string;
  setVpnState: (active: boolean) => void;
  setVpnLocation: (location: string) => void;

  // Shield Settings
  shieldSettings: {
    level: 'strict' | 'standard' | 'disabled';
    upgradeHttps: boolean;
    blockScripts: boolean;
    dnsOverHttps: string;
    customAdRules: string[];
    mlAdBlocking: boolean;
  };
  updateShieldSettings: (updates: Partial<BrowserState['shieldSettings']>) => void;
  
  // Tab Actions
  addTab: (url?: string, setAsActive?: boolean, isPrivate?: boolean) => void;
  closeTab: (id: string) => void;
  closeAllTabs: () => void;
  setActiveTab: (id: string) => void;
  updateTab: (id: string, updates: Partial<Tab>) => void;
  pinTab: (id: string) => void;
  
  // Tab Groups
  addTabGroup: (name: string, color: string, tabIds: string[]) => void;
  updateTabGroup: (id: string, updates: Partial<TabGroup>) => void;
  removeTabGroup: (id: string) => void;
  assignTabToGroup: (tabId: string, groupId?: string) => void;
  
  // Navigation Actions
  navigate: (id: string, url: string) => void;
  goBack: (id: string) => void;
  goForward: (id: string) => void;
  reload: (id: string) => void;
  
  // Stats & Utilities
  simulateProtection: () => void;
  addProtectionStats: (trackers: number, ads: number, dataSavedKb: number) => void;
  toggleBookmark: (url: string, title?: string) => void;
  setBookmarks: (bookmarks: Bookmark[]) => void;
  clearBrowsingData: () => void;
  addDownload: (item: Omit<DownloadItem, 'id' | 'date' | 'progress' | 'status'>) => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);
const NEW_TAB_URL = 'aegix://newtab';

export const useBrowserStore = create<BrowserState>((set, get) => ({
  tabs: [{ id: 'default-tab', url: NEW_TAB_URL, title: 'New Tab', loading: false, history: [NEW_TAB_URL], historyIndex: 0 }],
  activeTabId: 'default-tab',
  
  tabGroups: [],
  
  addTabGroup: (name, color, tabIds) => set((state) => {
    const groupId = generateId();
    const newGroup = { id: groupId, name, color, collapsed: false };
    const newTabs = state.tabs.map(t => tabIds.includes(t.id) ? { ...t, groupId } : t);
    return { tabGroups: [...state.tabGroups, newGroup], tabs: newTabs };
  }),

  updateTabGroup: (id, updates) => set((state) => ({
    tabGroups: state.tabGroups.map(g => g.id === id ? { ...g, ...updates } : g)
  })),

  removeTabGroup: (id) => set((state) => ({
    tabGroups: state.tabGroups.filter(g => g.id !== id),
    tabs: state.tabs.map(t => t.groupId === id ? { ...t, groupId: undefined } : t)
  })),

  assignTabToGroup: (tabId, groupId) => set((state) => ({
    tabs: state.tabs.map(t => t.id === tabId ? { ...t, groupId } : t)
  })),
  
  trackersBlocked: 0,
  adsBlocked: 0,
  dataSavedKb: 0, // in KB
  timeSavedSeconds: 0,
  bookmarks: [
    { title: 'DuckDuckGo', url: 'https://duckduckgo.com', icon: 'ð¦' },
    { title: 'Wikipedia', url: 'https://www.wikipedia.org', icon: 'ð' },
    { title: 'BBC News', url: 'https://www.bbc.com', icon: 'ð°' }
  ],

  passwords: [],
  downloads: [],
  
  searchEngine: 'google',
  setSearchEngine: (engine) => set({ searchEngine: engine }),
  recentSearches: [],
  addRecentSearch: (query) => set((state) => {
    const fresh = state.recentSearches.filter(q => q !== query);
    return { recentSearches: [query, ...fresh].slice(0, 10) };
  }),

  isVpnActive: false,
  vpnStatus: 'disconnected',
  vpnLocation: 'auto',
  shieldSettings: {
    level: 'standard',
    upgradeHttps: true,
    blockScripts: false,
    dnsOverHttps: 'off',
    customAdRules: [],
    mlAdBlocking: true
  },
  setVpnState: (active) => {
    if (active) {
      set({ vpnStatus: 'connecting', isVpnActive: false });
      // Simulate real VPN connection sequence
      setTimeout(() => {
        // Occasional simulated failover connection error (10% chance)
        if (Math.random() > 0.9) {
          set({ vpnStatus: 'failed', isVpnActive: false });
        } else {
          set({ vpnStatus: 'connected', isVpnActive: true });
        }
      }, 1500);
    } else {
      set({ vpnStatus: 'disconnected', isVpnActive: false });
    }
  },
  setVpnLocation: (location) => {
    set({ vpnLocation: location });
    const { isVpnActive, setVpnState } = get();
    // If we're already connected, we need to reconnect to the new location
    if (isVpnActive) {
      setVpnState(false);
      setTimeout(() => setVpnState(true), 500);
    }
  },
  updateShieldSettings: (updates) => set((state) => ({ shieldSettings: { ...state.shieldSettings, ...updates } })),
  setBookmarks: (bookmarks) => set({ bookmarks }),

  clearBrowsingData: () => set({ 
     tabs: [{ id: generateId(), url: NEW_TAB_URL, title: 'New Tab', loading: false, history: [NEW_TAB_URL], historyIndex: 0 }],
     activeTabId: null,
     downloads: [],
     passwords: []
  }),

  addTab: (url = NEW_TAB_URL, setAsActive = true, isPrivate = false) => set((state) => {
    const newTab: Tab = {
      id: generateId(),
      url,
      title: url === NEW_TAB_URL ? 'New Tab' : url,
      loading: false,
      history: [url],
      historyIndex: 0,
      isPrivate
    };
    return {
      tabs: [...state.tabs, newTab],
      activeTabId: setAsActive ? newTab.id : state.activeTabId
    };
  }),

  closeTab: (id) => set((state) => {
    const newTabs = state.tabs.filter(t => t.id !== id);
    if (newTabs.length === 0) {
      // Create a fresh tab if all are closed
      const freshTab = { id: generateId(), url: NEW_TAB_URL, title: 'New Tab', loading: false, history: [NEW_TAB_URL], historyIndex: 0 };
      return { tabs: [freshTab], activeTabId: freshTab.id };
    }
    let newActiveId = state.activeTabId;
    if (state.activeTabId === id) {
      const closedIndex = state.tabs.findIndex(t => t.id === id);
      const nextTab = newTabs[Math.min(closedIndex, newTabs.length - 1)];
      newActiveId = nextTab?.id || newTabs[0].id;
    }
    return { tabs: newTabs, activeTabId: newActiveId };
  }),

  closeAllTabs: () => set((state) => {
    const freshTab = { id: generateId(), url: NEW_TAB_URL, title: 'New Tab', loading: false, history: [NEW_TAB_URL], historyIndex: 0 };
    return { tabs: [freshTab], activeTabId: freshTab.id };
  }),

  setActiveTab: (id) => set({ activeTabId: id }),

  updateTab: (id, updates) => set((state) => ({
    tabs: state.tabs.map(tab => tab.id === id ? { ...tab, ...updates } : tab)
  })),
  
  pinTab: (id) => set((state) => ({
    tabs: state.tabs.map(tab => tab.id === id ? { ...tab, isPinned: !tab.isPinned } : tab)
  })),

  navigate: (id, rawUrl) => set((state) => {
    let url = rawUrl;
    const isDomain = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/|$)/.test(rawUrl) && !rawUrl.includes(' ');
    
    // Process input
    if (rawUrl !== NEW_TAB_URL && !rawUrl.startsWith('aegix://')) {
      if (!/^https?:\/\//i.test(rawUrl)) {
        if (isDomain) {
          url = `https://${rawUrl}`;
        } else {
          const engine = get().searchEngine;
          if (engine === 'google') url = `https://www.google.com/search?q=${encodeURIComponent(rawUrl)}`;
          else if (engine === 'duckduckgo') url = `https://duckduckgo.com/?q=${encodeURIComponent(rawUrl)}`;
          else url = `https://www.bing.com/search?q=${encodeURIComponent(rawUrl)}`;
          
          // Only add to recent searches if it wasn't a direct URL navigation
          get().addRecentSearch(rawUrl);
        }
      }
    }

    return {
      tabs: state.tabs.map(tab => {
        if (tab.id !== id) return tab;
        const newHistory = tab.history.slice(0, tab.historyIndex + 1);
        newHistory.push(url);
        return {
          ...tab,
          url,
          title: url === NEW_TAB_URL ? 'New Tab' : url,
          loading: true,
          history: newHistory,
          historyIndex: newHistory.length - 1
        };
      })
    };
  }),

  goBack: (id) => set((state) => ({
    tabs: state.tabs.map(tab => {
      if (tab.id !== id || tab.historyIndex <= 0) return tab;
      const newIndex = tab.historyIndex - 1;
      return {
        ...tab,
        url: tab.history[newIndex],
        historyIndex: newIndex,
        loading: true
      };
    })
  })),

  goForward: (id) => set((state) => ({
    tabs: state.tabs.map(tab => {
      if (tab.id !== id || tab.historyIndex >= tab.history.length - 1) return tab;
      const newIndex = tab.historyIndex + 1;
      return {
        ...tab,
        url: tab.history[newIndex],
        historyIndex: newIndex,
        loading: true
      };
    })
  })),

  reload: (id) => set((state) => ({
    tabs: state.tabs.map(tab => tab.id === id ? { ...tab, loading: true } : tab)
  })),

  simulateProtection: () => set((state) => {
    const trackers = Math.floor(Math.random() * 8) + 1; // 1 to 8 per page load
    const ads = Math.floor(Math.random() * 4);
    const totalNew = trackers + ads;
    return {
      trackersBlocked: state.trackersBlocked + trackers,
      adsBlocked: state.adsBlocked + ads,
      dataSavedKb: state.dataSavedKb + (totalNew * 45), // ~45KB per tracker/ad
      timeSavedSeconds: state.timeSavedSeconds + (totalNew * 0.5) // ~0.5s per tracker/ad
    };
  }),
  
  addProtectionStats: (trackers: number, ads: number, dataSavedKb: number) => set((state) => ({
      trackersBlocked: state.trackersBlocked + trackers,
      adsBlocked: state.adsBlocked + ads,
      dataSavedKb: state.dataSavedKb + dataSavedKb,
      timeSavedSeconds: state.timeSavedSeconds + ((trackers + ads) * 0.5)
  })),

  toggleBookmark: (url, title = url) => set((state) => {
    const exists = state.bookmarks.find(b => b.url === url);
    if (exists) {
      return { bookmarks: state.bookmarks.filter(b => b.url !== url) };
    } else {
      return { bookmarks: [...state.bookmarks, { url, title }] };
    }
  }),

  addDownload: (item) => set((state) => ({
    downloads: [{ ...item, id: generateId(), progress: 100, status: 'completed', date: new Date().toISOString() }, ...state.downloads]
  }))
}));
