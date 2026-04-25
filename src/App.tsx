/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { TabBar } from './components/TabBar';
import { Toolbar } from './components/Toolbar';
import { BrowserViewport } from './components/BrowserViewport';
import { SyncManager } from './components/SyncManager';

export default function App() {
  return (
    <div className="w-full h-screen flex flex-col bg-gray-900 overflow-hidden font-sans text-gray-100">
      <SyncManager />
      <TabBar />
      <Toolbar />
      <BrowserViewport />
    </div>
  );
}
