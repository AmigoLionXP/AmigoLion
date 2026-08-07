'use client';

import { AppProvider, useApp } from '@/lib/app-context';
import { AppBar } from './AppBar';
import { NavBar } from './NavBar';
import { HomeScreen } from './screens/Home';
import { PainelScreen } from './screens/Painel';
import { MetodoScreen } from './screens/Metodo';
import { AiScreen } from './screens/Ai';
import { CeoScreen } from './screens/Ceo';
import { StepDetailOverlay } from './overlays/StepDetailOverlay';
import { MoreHubOverlay } from './overlays/MoreHubOverlay';
import { ScreenOverlay } from './overlays/ScreenOverlay';
import { BusinessScanOverlay } from './business-scan/BusinessScanOverlay';

function Shell() {
  const { tab, openStep, more, screen, businessScanOpen } = useApp();

  return (
    <div className="om-frame">
      <div
        className="relative flex h-full w-full flex-col overflow-hidden text-text font-body desktop:grid desktop:grid-cols-[236px_1fr] desktop:grid-rows-[auto_1fr]"
        style={{ background: 'radial-gradient(120% 70% at 80% -5%, #0d2a5e, #0B2149 52%, #08132C)' }}
      >
        <AppBar />

        <div className="appscroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-[18px] pb-[108px] pt-[18px] desktop:col-start-2 desktop:row-start-2 desktop:px-10 desktop:pb-[60px] desktop:pt-[30px] desktop:[&>*]:mx-auto desktop:[&>*]:max-w-[920px] wide:[&>*]:max-w-[1040px]">
          {tab === 'home' && <HomeScreen />}
          {tab === 'painel' && <PainelScreen />}
          {tab === 'metodo' && <MetodoScreen />}
          {tab === 'ai' && <AiScreen />}
          {tab === 'ceo' && <CeoScreen />}
        </div>

        {/* Rendered last in DOM so mobile's plain flex-column stacking puts it at the
            bottom; the desktop grid still places it in the sidebar via explicit col/row. */}
        <NavBar />

        {openStep !== null && <StepDetailOverlay />}
        {more && <MoreHubOverlay />}
        {screen !== null && <ScreenOverlay />}
        {businessScanOpen && <BusinessScanOverlay />}
      </div>
    </div>
  );
}

export function AppShell() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
