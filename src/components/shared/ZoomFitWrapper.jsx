import { useEffect, useState } from 'react';

// Stopgap for small screens, ahead of a real mobile redesign.
// Renders the app at its normal desktop design width (DESIGN_WIDTH), then scales
// the whole thing down with a CSS transform so it fits the actual viewport without
// horizontal scrolling. Text becomes small — that's the known, accepted tradeoff
// for this interim view; the real mobile layout is a separate, later piece of work.
const DESIGN_WIDTH = 1440;
const MOBILE_BREAKPOINT = 860; // below this viewport width, auto-apply the zoom-fit

export default function ZoomFitWrapper({ children }) {
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : DESIGN_WIDTH
  );
  const [viewportHeight, setViewportHeight] = useState(
    typeof window !== 'undefined' ? window.innerHeight : 900
  );

  useEffect(() => {
    function handleResize() {
      setViewportWidth(window.innerWidth);
      setViewportHeight(window.innerHeight);
    }
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  const isSmallScreen = viewportWidth < MOBILE_BREAKPOINT;

  if (!isSmallScreen) {
    return children;
  }

  const scale = viewportWidth / DESIGN_WIDTH;
  const scaledHeight = viewportHeight / scale;

  return (
    <div
      style={{
        width: viewportWidth,
        height: viewportHeight,
        overflow: 'hidden',
        position: 'fixed',
        top: 0,
        left: 0,
      }}
    >
      <div
        style={{
          width: DESIGN_WIDTH,
          height: scaledHeight,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        {children}
      </div>
    </div>
  );
}
