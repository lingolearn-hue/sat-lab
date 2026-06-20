import { useState } from 'react';
import { AppProvider } from './context/AppContext.jsx';
import TopBar from './components/shared/TopBar.jsx';
import ZoomFitWrapper from './components/shared/ZoomFitWrapper.jsx';
import OperateShell from './components/operate/OperateShell.jsx';
import BuildShell from './components/build/BuildShell.jsx';

function AppShell() {
  const [mode, setMode] = useState('operate');

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <TopBar mode={mode} onModeChange={setMode} />
      {mode === 'operate' ? <OperateShell /> : <BuildShell />}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <ZoomFitWrapper>
        <AppShell />
      </ZoomFitWrapper>
    </AppProvider>
  );
}
