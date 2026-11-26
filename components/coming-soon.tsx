/** The "COMING SOON" pill, styled like the dashed "planned" pill in the proof grid (Main.dc.html). */
export function ComingSoonPill() {
  return (
    <span className="whitespace-nowrap rounded-full border border-dashed border-rule px-2 py-[2px] font-mono text-[11px] tracking-[0.04em] text-muted">
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

/** A hidden case study's chip: the label in a ruled chip, then the pill (BuildLog.dc.html / LogPost.dc.html, design update 12). */
export function StudyChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2 self-start">
      <span className="rounded-md border border-rule px-[10px] py-[6px] font-mono text-[12px] text-muted">{label}</span>
      <ComingSoonPill />
    </span>
  );
}
