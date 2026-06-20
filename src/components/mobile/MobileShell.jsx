import { useState, useEffect } from 'react';
import { useAppState } from '../../context/AppContext.jsx';
import MobileTopBar from './MobileTopBar.jsx';
import MobileTabBar from './MobileTabBar.jsx';
import MobileDashboardPage from './MobileDashboardPage.jsx';
import MobileSchedulingPage from './MobileSchedulingPage.jsx';
import { ROLE_TABS, ROLE_DEFAULT_MOBILE_PAGE, MOBILE_READY_PAGES } from './mobileNavConfig.js';

// Desktop page components, used as a fallback (scaled down) for any page that
// doesn't have a real mobile layout yet. See MOBILE_READY_PAGES.
import OperationsPage from '../operate/OperationsPage.jsx';
import ProjectsPage from '../operate/ProjectsPage.jsx';
import LaboratoriesPage from '../operate/LaboratoriesPage.jsx';
import StatisticsPage from '../operate/StatisticsPage.jsx';
import AssetsPage from '../operate/AssetsPage.jsx';
import ConsumablesPage from '../operate/ConsumablesPage.jsx';
import FinancePage from '../operate/FinancePage.jsx';
import AuditLogPage from '../operate/AuditLogPage.jsx';
import PersonnelPage from '../operate/PersonnelPage.jsx';

const DESKTOP_FALLBACK_PAGES = {
  operations: OperationsPage,
  projects: ProjectsPage,
  laboratories: LaboratoriesPage,
  statistics: StatisticsPage,
  assets: AssetsPage,
  consumables: ConsumablesPage,
  finance: FinancePage,
  auditlog: AuditLogPage,
  personnel: PersonnelPage,
};

// Width the desktop fallback components are designed for; scaled to fit whatever
// the actual mobile content area width is, same technique as ZoomFitWrapper.
const DESKTOP_FALLBACK_WIDTH = 1440;

export default function MobileShell({ onViewModeChange }) {
  const state = useAppState();
  const role = state.currentRole;
  const [activePage, setActivePage] = useState(ROLE_DEFAULT_MOBILE_PAGE[role] || 'dashboard');

  useEffect(() => {
    const tabs = ROLE_TABS[role];
    const allIds = tabs ? [...tabs.primary, ...tabs.more] : [];
    if (!allIds.includes(activePage)) {
      setActivePage(ROLE_DEFAULT_MOBILE_PAGE[role] || allIds[0] || 'dashboard');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const isMobileReady = MOBILE_READY_PAGES.has(activePage);

  return (
    <div className="h-full flex flex-col overflow-hidden bg-op-bg">
      <MobileTopBar onViewModeChange={onViewModeChange} />

      <div className="flex-1 overflow-y-auto">
        {activePage === 'dashboard' && <MobileDashboardPage />}
        {activePage === 'scheduling' && <MobileSchedulingPage />}
        {!isMobileReady && DESKTOP_FALLBACK_PAGES[activePage] && (
          <ScaledFallback Component={DESKTOP_FALLBACK_PAGES[activePage]} />
        )}
      </div>

      <MobileTabBar role={role} activePage={activePage} onNavigate={setActivePage} />
    </div>
  );
}

// Renders a desktop page component scaled down to fit the mobile content width —
// same technique as the old automatic zoom-fit, now scoped to just the pages that
// don't have a real mobile layout yet, rather than the whole app.
function ScaledFallback({ Component }) {
  const [containerWidth, setContainerWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : DESKTOP_FALLBACK_WIDTH
  );

  useEffect(() => {
    function handleResize() {
      setContainerWidth(window.innerWidth);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const scale = containerWidth / DESKTOP_FALLBACK_WIDTH;

  return (
    <div>
      <div className="px-3 pt-2.5 pb-1 text-[10.5px] text-op-text-faint bg-op-panel-raised border-b border-op-border">
        Desktop layout, scaled to fit — a mobile-optimized version of this page is planned.
      </div>
      <div style={{ width: containerWidth, overflow: 'hidden' }}>
        <div style={{ width: DESKTOP_FALLBACK_WIDTH, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
          <Component />
        </div>
      </div>
    </div>
  );
}
