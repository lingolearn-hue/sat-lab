// Single, consistent Mobile/Desktop toggle — used by both the desktop TopBar and
// the mobile MobileTopBar so there's exactly one visual language and one place to
// tap/click, instead of a full button on desktop and a buried sheet item on mobile.
//
// Deliberately icon-only with a fixed pixel size (not a text label that can shrink
// to illegibility under ZoomFitWrapper's scale-down) — this button needs to survive
// being the way *out* of a cramped view, so it can't be allowed to shrink with
// everything else around it. flex-shrink-0 plus an explicit min-width/min-height
// keep it tappable even at the smallest desktop-mode scale factor.
export default function ViewModeToggle({ viewMode, onViewModeChange, theme }) {
  if (!onViewModeChange) return null;
  const isMobile = viewMode === 'mobile';

  return (
    <button
      onClick={() => onViewModeChange(isMobile ? 'desktop' : 'mobile')}
      title={isMobile ? 'Switch to Desktop view' : 'Switch to Mobile view'}
      aria-label={isMobile ? 'Switch to Desktop view' : 'Switch to Mobile view'}
      className={`flex-shrink-0 flex items-center justify-center rounded-md border transition-colors ${
        theme ? `${theme.chipBg} ${theme.chipBorder} ${theme.textDim} hover:${theme.text}` : 'bg-op-panel border-op-border text-op-text-dim hover:text-op-text'
      }`}
      style={{ width: 32, height: 32, minWidth: 32, minHeight: 32 }}
    >
      <span style={{ fontSize: 15, lineHeight: 1 }}>{isMobile ? '▭' : '▯'}</span>
    </button>
  );
}
