import React, { useState } from "react";
import { Plus, X, EyeOff, Pin, Search } from "lucide-react";
import { useBrowserStore } from "../store/useBrowserStore";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { AegixLogo } from "./AegixLogo";

export function TabBar() {
  const {
    tabs,
    activeTabId,
    setActiveTab,
    closeTab,
    addTab,
    closeAllTabs,
    pinTab,
  } = useBrowserStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [tabSearch, setTabSearch] = useState("");

  const filteredTabs = tabs.filter(
    (t) =>
      t.title.toLowerCase().includes(tabSearch.toLowerCase()) ||
      t.url.toLowerCase().includes(tabSearch.toLowerCase()),
  );

  // Sort pinned tabs first
  const displayTabs = [...filteredTabs].sort(
    (a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0),
  );

  return (
    <div className="flex items-center h-11 bg-[#0f1115] border-b border-gray-800 px-2 select-none gap-2 relative">
      {/* Aegix logo / Menu area mockup */}
      <div className="flex items-center mr-1 ml-2">
        <AegixLogo size={24} />
      </div>

      {searchOpen ? (
        <div className="flex-1 flex items-center h-8 bg-gray-900 rounded-md px-2 border border-blue-500/50">
          <Search size={14} className="text-gray-400 mr-2" />
          <input
            autoFocus
            className="flex-1 bg-transparent text-sm text-white focus:outline-none"
            placeholder="Search tabs..."
            value={tabSearch}
            onChange={(e) => setTabSearch(e.target.value)}
          />
          <button
            onClick={() => {
              setSearchOpen(false);
              setTabSearch("");
            }}
            className="p-1 hover:bg-gray-800 rounded"
          >
            <X size={14} className="text-gray-400" />
          </button>
        </div>
      ) : (
        <div className="flex-1 flex overflow-x-auto no-scrollbar pt-2 gap-1 h-full items-end">
          <AnimatePresence>
            {displayTabs.map((tab, index) => {
              const isActive = tab.id === activeTabId;
              const isPrivate = tab.isPrivate;

              // Find if this tab is the first in its group to render the group header
              const group = tab.groupId
                ? useBrowserStore
                    .getState()
                    .tabGroups.find((g) => g.id === tab.groupId)
                : null;
              const isFirstInGroup =
                group &&
                (index === 0 || displayTabs[index - 1].groupId !== tab.groupId);

              if (group?.collapsed && !isFirstInGroup && !isActive) return null; // Hide collapsed tabs

              return (
                <React.Fragment key={tab.id}>
                  {isFirstInGroup && group && (
                    <motion.div
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        useBrowserStore
                          .getState()
                          .updateTabGroup(group.id, {
                            collapsed: !group.collapsed,
                          });
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        useBrowserStore.getState().removeTabGroup(group.id);
                      }}
                      className={cn(
                        "flex flex-shrink-0 cursor-pointer items-center justify-center h-6 mt-3 px-3 mx-1 rounded-full text-xs font-medium border text-black transition-all",
                        group.collapsed ? "opacity-80" : "opacity-100",
                      )}
                      style={{
                        backgroundColor: group.color,
                        borderColor: group.color,
                      }}
                    >
                      {group.name}
                    </motion.div>
                  )}

                  {(!group?.collapsed || isActive || isFirstInGroup) && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8, width: 0 }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                        width: tab.isPinned ? "48px" : "220px",
                      }}
                      exit={{ opacity: 0, scale: 0.5, width: 0 }}
                      onClick={() => setActiveTab(tab.id)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        // Fast way to group: right click either pins or creates a group
                        if (!tab.groupId) {
                          const colors = [
                            "#FF5555",
                            "#55FF55",
                            "#5555FF",
                            "#FFFF55",
                            "#FF55FF",
                            "#55FFFF",
                          ];
                          const randomColor =
                            colors[Math.floor(Math.random() * colors.length)];
                          useBrowserStore
                            .getState()
                            .addTabGroup(
                              "Group " + Math.floor(Math.random() * 100),
                              randomColor,
                              [tab.id],
                            );
                        } else {
                          useBrowserStore
                            .getState()
                            .assignTabToGroup(tab.id, undefined);
                        }
                      }}
                      onDoubleClick={(e) => {
                        e.preventDefault();
                        pinTab(tab.id);
                      }}
                      className={cn(
                        "group relative flex items-center justify-between h-9 min-w-[48px] max-w-[220px] px-3 rounded-t-lg cursor-pointer text-sm transition-colors border-x border-t",
                        isActive
                          ? isPrivate
                            ? "bg-[#181a1f] text-[#44EEFF] border-gray-800"
                            : "bg-[#202226] text-white border-gray-700"
                          : isPrivate
                            ? "bg-transparent text-gray-500 border-transparent hover:bg-[#181a1f]/50"
                            : "bg-transparent text-gray-400 border-transparent hover:bg-gray-800/50",
                      )}
                    >
                      {group && (
                        <div
                          className="absolute top-0 left-0 right-0 h-1 overflow-hidden pointer-events-none rounded-t-lg"
                          style={{ backgroundColor: group.color }}
                        />
                      )}
                      <div className="flex items-center gap-2 overflow-hidden w-full text-xs mt-0.5">
                        {tab.loading ? (
                          <div
                            className={cn(
                              "w-3.5 h-3.5 border-2 rounded-full animate-spin shrink-0",
                              isPrivate
                                ? "border-[#0077AA] border-t-[#44EEFF]"
                                : "border-gray-500 border-t-[#44EEFF]",
                            )}
                          />
                        ) : isPrivate ? (
                          <EyeOff
                            size={14}
                            className="text-[#44EEFF] shrink-0"
                          />
                        ) : tab.isPinned ? (
                          <Pin size={14} className="text-[#44EEFF] shrink-0" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full bg-[#0077AA]/20 flex items-center justify-center shrink-0">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#44EEFF]" />
                          </div>
                        )}
                        {!tab.isPinned && (
                          <span className="truncate flex-1">
                            {getTabTitle(tab.title)}
                          </span>
                        )}
                      </div>
                      {!tab.isPinned && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            closeTab(tab.id);
                          }}
                          className={cn(
                            "p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity absolute right-2",
                            isActive
                              ? "bg-black/20"
                              : "hover:bg-gray-700 hover:text-white",
                          )}
                        >
                          <X size={14} />
                        </button>
                      )}
                      {isActive && (
                        <div
                          className={cn(
                            "absolute top-full left-0 right-0 h-[2px] -mt-[1px] z-10",
                            isPrivate ? "bg-[#44EEFF]" : "bg-[#44EEFF]",
                          )}
                        />
                      )}
                    </motion.div>
                  )}
                </React.Fragment>
              );
            })}
          </AnimatePresence>
          <button
            onClick={() => addTab()}
            className="p-1.5 ml-1 mb-1 rounded hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
            title="New Tab"
          >
            <Plus size={16} />
          </button>
        </div>
      )}

      <div className="flex items-center gap-1">
        <button
          onClick={() => setSearchOpen(!searchOpen)}
          className="p-1.5 rounded hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
          title="Search Tabs"
        >
          <Search size={16} />
        </button>
        <button
          onClick={() => closeAllTabs()}
          className="p-1.5 rounded hover:bg-red-900/30 text-gray-400 hover:text-red-400 transition-colors"
          title="Close All Tabs"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}

function getTabTitle(title: string) {
  if (title.startsWith("aegix://search")) {
    const q = new URL(title.replace("aegix://", "http://")).searchParams.get(
      "q",
    );
    return q ? `${q} - Aegix Search` : "Search";
  }
  return title;
}
