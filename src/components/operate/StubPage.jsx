export default function StubPage({ title, note }) {
  return (
    <div className="px-8 py-7">
      <div className="text-xl font-bold tracking-tight text-op-text mb-1">{title}</div>
      <div className="text-[13px] text-op-text-dim mb-6">{note || 'Not part of the v1 vertical slice yet.'}</div>
      <div className="bg-op-panel border border-dashed border-op-border-strong rounded-lg p-10 text-center text-op-text-faint text-[13px]">
        This module is planned for a future iteration.
      </div>
    </div>
  );
}
