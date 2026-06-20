import { useState, useEffect } from 'react';
import SideNav, { ROLE_NAV_IDS, ROLE_DEFAULT_PAGE } from './SideNav.jsx';
import DashboardPage from './DashboardPage.jsx';
import OperationsPage from './OperationsPage.jsx';
import SchedulingPage from './SchedulingPage.jsx';
import ProjectsPage from './ProjectsPage.jsx';
import LaboratoriesPage from './LaboratoriesPage.jsx';
import StatisticsPage from './StatisticsPage.jsx';
import AssetsPage from './AssetsPage.jsx';
import FinancePage from './FinancePage.jsx';
import StubPage from './StubPage.jsx';
import { useAppState } from '../../context/AppContext.jsx';
import { getBenchesForRoom } from '../../data/selectors.js';

export default function OperateShell() {
  const state = useAppState();
  const role = state.currentRole;
  const [activePage, setActivePage] = useState(ROLE_DEFAULT_PAGE[role] || 'dashboard');
  const room = state.rooms[0];
  const benches = getBenchesForRoom(state, room.id);
  const runningCount = benches.filter((b) => b.status === 'running').length;

  // If the role changes and the current page isn't visible to the new role,
  // jump to that role's default landing page instead of showing a hidden page.
  useEffect(() => {
    const visibleIds = ROLE_NAV_IDS[role] || [];
    if (!visibleIds.includes(activePage)) {
      setActivePage(ROLE_DEFAULT_PAGE[role] || visibleIds[0] || 'dashboard');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  return (
    <div className="grid grid-cols-[240px_1fr] bg-op-bg min-h-0 flex-1 overflow-hidden">
      <SideNav
        activePage={activePage}
        onNavigate={setActivePage}
        roomLabel={room.name}
        roomSummary={`${benches.length} benches · ${runningCount} running`}
        role={role}
      />
      <div className="overflow-y-auto">
        {activePage === 'dashboard' && <DashboardPage />}
        {activePage === 'operations' && <OperationsPage />}
        {activePage === 'scheduling' && <SchedulingPage />}
        {activePage === 'projects' && <ProjectsPage />}
        {activePage === 'laboratories' && <LaboratoriesPage />}
        {activePage === 'statistics' && <StatisticsPage />}
        {activePage === 'assets' && <AssetsPage />}
        {activePage === 'finance' && <FinancePage />}
        {activePage === 'personnel' && <StubPage title="Personnel" note="Staffing and qualifications — planned for a future iteration." />}
      </div>
    </div>
  );
}
