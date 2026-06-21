import { useState } from 'react';
import { AppProvider } from './context/AppContext.jsx';
import TopBar from './components/shared/TopBar.jsx';
import ZoomFitWrapper from './components/shared/ZoomFitWrapper.jsx';
import ViewModeToggle from './components/shared/ViewModeToggle.jsx';
import OperateShell from './components/operate/OperateShell.jsx';
import BuildShell from './components/build/BuildShell.jsx';
import MobileShell from './components/mobile/MobileShell.jsx';

function AppShell({ viewMode, onViewModeChange }) {
  const [mode, setMode] = useState('operate');

  if (viewMode === 'mobile') {
    // Mobile view covers Operate mode only this round — Build mode (CAD grid,
    // channel maps) isn't part of this pass and stays Desktop-only for now.
    return <MobileShell onViewModeChange={onViewModeChange} />;
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <TopBar mode={mode} onModeChange={setMode} viewMode={viewMode} onViewModeChange={onViewModeChange} />
      {mode === 'operate' ? <OperateShell /> : <BuildShell />}
    </div>
  );
}

export default function App() {
  // 'desktop' = today's layout (auto-scaled via ZoomFitWrapper if the screen is small).
  // 'mobile' = the real restructured mobile layout (bottom tabs, stacked cards, etc).
  // Defaults to mobile on small screens on first load, but the person can always
  // switch back to Desktop and still see the complete layout, just scaled down.
  const [viewMode, setViewMode] = useState(
    typeof window !== 'undefined' && window.innerWidth < 860 ? 'mobile' : 'desktop'
  );

  return (
    <AppProvider>
      {viewMode === 'desktop' ? (
        <>
          <ZoomFitWrapper>
            <AppShell viewMode={viewMode} onViewModeChange={setViewMode} />
          </ZoomFitWrapper>
          {/* Rendered outside ZoomFitWrapper's scaled subtree on purpose: a CSS
              transform: scale() shrinks the *visual* size of everything inside it,
              including a fixed-pixel-size child — so the toggle has to live outside
              that subtree entirely to stay a real, clickable size no matter how
              small the desktop layout has been scaled down. Fixed-positioned in the
              actual viewport, top-right corner, always on top. */}
          <div className="fixed top-2 right-2 z-[60]">
            <ViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} />
          </div>
        </>
      ) : (
        <AppShell viewMode={viewMode} onViewModeChange={setViewMode} />
      )}
    </AppProvider>
  );
}
