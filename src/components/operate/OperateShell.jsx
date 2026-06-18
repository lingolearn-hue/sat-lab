import { useState } from 'react';
import SideNav from './SideNav.jsx';
import DashboardPage from './DashboardPage.jsx';
import SchedulingPage from './SchedulingPage.jsx';
import StubPage from './StubPage.jsx';
import { useAppState } from '../../context/AppContext.jsx';
import { getBenchesForRoom } from '../../data/selectors.js';

export default function OperateShell() {
  const state = useAppState();
  const [activePage, setActivePage] = useState('scheduling');
  const room = state.rooms[0];
  const benches = getBenchesForRoom(state, room.id);
  const runningCount = benches.filter((b) => b.status === 'running').length;

  return (
    <div className="grid grid-cols-[240px_1fr] bg-op-bg min-h-0 flex-1 overflow-hidden">
      <SideNav
        activePage={activePage}
        onNavigate={setActivePage}
        roomLabel={room.name}
        roomSummary={`${benches.length} benches · ${runningCount} running`}
      />
      <div className="overflow-y-auto">
        {activePage === 'dashboard' && <DashboardPage />}
        {activePage === 'scheduling' && <SchedulingPage />}
        {activePage === 'projects' && <StubPage title="Projects" note="Project → Test Request → DUT hierarchy browser." />}
        {activePage === 'laboratories' && <StubPage title="Laboratories" note="Digital twin view — see it live in Build mode for now." />}
        {activePage === 'assets' && <StubPage title="Assets" note="Asset registry: benches, chambers, sensors, lifetime tracking." />}
        {activePage === 'personnel' && <StubPage title="Personnel" note="Staffing and qualifications — planned for a future iteration." />}
        {activePage === 'finance' && <StubPage title="Finance" note="Revenue, opex, capex breakdown and cost-per-test reporting." />}
      </div>
    </div>
  );
}
