// Hardcoded version string, kept in sync with package.json's "version" field by
// hand on every push (not every code change) — see the project's push workflow.
// Rendered fixed in the corner, outside any scaled/transformed subtree, so it's
// always at a real, readable size and lets you visually confirm a deploy landed
// even if GitHub Pages is lagging behind a successful git push.
export const APP_VERSION = 'v17';

export default function VersionFooter() {
  return (
    <div
      className="fixed bottom-1.5 left-1.5 z-[60] font-mono text-[10px] text-white/70 select-none pointer-events-none bg-black/55 rounded px-1.5 py-0.5"
    >
      {APP_VERSION}
    </div>
  );
}
