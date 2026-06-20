import { useState } from 'react';
import { PAGE_ICONS, PAGE_LABELS, ROLE_TABS } from './mobileNavConfig.js';

export default function MobileTabBar({ role, activePage, onNavigate }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const tabs = ROLE_TABS[role] || { primary: [], more: [] };
  const hasMore = tabs.more.length > 0;
  const moreIsActive = tabs.more.includes(activePage);

  return (
    <>
      <div className="flex border-t border-op-border bg-op-panel">
        {tabs.primary.map((pageId) => (
          <TabButton
            key={pageId}
            icon={PAGE_ICONS[pageId]}
            label={PAGE_LABELS[pageId]}
            active={activePage === pageId}
            onClick={() => onNavigate(pageId)}
          />
        ))}
        {hasMore && (
          <TabButton
            icon="⋯"
            label="More"
            active={moreIsActive}
            onClick={() => setMoreOpen(true)}
          />
        )}
      </div>

      {moreOpen && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setMoreOpen(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full bg-op-panel rounded-t-2xl pb-6 pt-2 shadow-2xl"
          >
            <div className="w-10 h-1 bg-op-border rounded-full mx-auto mb-4" />
            <div className="px-5 pb-2 text-[13px] font-bold text-op-text">More</div>
            <div className="grid grid-cols-2 gap-2 px-4">
              {tabs.more.map((pageId) => (
                <button
                  key={pageId}
                  onClick={() => {
                    onNavigate(pageId);
                    setMoreOpen(false);
                  }}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left ${
                    activePage === pageId
                      ? 'border-op-teal bg-op-teal-glow text-op-teal-dim'
                      : 'border-op-border text-op-text-dim'
                  }`}
                >
                  <span className="text-[18px]">{PAGE_ICONS[pageId]}</span>
                  <span className="text-[14px] font-semibold">{PAGE_LABELS[pageId]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function TabButton({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 ${
        active ? 'text-op-teal-dim' : 'text-op-text-faint'
      }`}
    >
      <span className="text-[19px] leading-none">{icon}</span>
      <span className="text-[10.5px] font-semibold">{label}</span>
    </button>
  );
}
