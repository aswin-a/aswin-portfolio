/** The "COMING SOON" pill, styled like the dashed "planned" pill in the proof grid (Main.dc.html). */
export function ComingSoonPill() {
  return (
    <span className="whitespace-nowrap rounded-full border border-dashed border-rule px-2 py-[2px] font-mono text-[11px] text-muted">
      COMING SOON
    </span>
  );
}

/** A link to a hidden case study: its label in muted text, not clickable, with the pill beside it. */
export function ComingSoonLink({ label, className = "" }: { label: string; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 text-muted ${className}`}>
      <span>{label}</span>
      <ComingSoonPill />
    </span>
  );
}
