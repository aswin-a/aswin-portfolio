"use client";

/**
 * The phone dock (Mobile.dc.html / MobileNavStates.dc.html, design update 9): X-ray and "Ask my work ↑"
 * in a sticky pill at the bottom, below 640px, hidden while Ask is open. On home, a one-time X-ray hint
 * sits above it until it's dismissed or X-ray is turned on; it shares the intro banner's dismissal.
 *
 * It is the last thing in the page flow, sticky to the bottom, with a bottom margin of 16px + the safe
 * area: at the end of the page it rests in its own space, so it never covers the footer (SPEC §5).
 */
export function MobileDock({
  xray,
  showHint,
  onToggleXray,
  onDismissHint,
  onAsk,
}: {
  xray: boolean;
  showHint: boolean;
  onToggleXray: () => void;
  onDismissHint: () => void;
  onAsk: () => void;
}) {
  return (
    <div className="pointer-events-none sticky bottom-[calc(16px+env(safe-area-inset-bottom))] z-25 mb-[calc(16px+env(safe-area-inset-bottom))] hidden flex-col items-center gap-[10px] px-4 max-[640px]:flex">
      {showHint && (
        <div
          role="status"
          className="intro-only pointer-events-auto relative flex max-w-[340px] items-center gap-3 rounded-xl border border-accent bg-paper py-[10px] pr-3 pl-[14px] [box-shadow:var(--hint-shadow)]"
        >
          <span className="text-[14px] leading-[1.4]">
            <b className="font-semibold">New: X-ray.</b> Turn it on to see how the AI works here.
          </span>
          <button
            type="button"
            onClick={onDismissHint}
            className="min-h-9 flex-none cursor-pointer rounded-lg border border-accent bg-transparent px-[10px] font-sans text-[13px] text-accent"
          >
            Got it
          </button>
          <span
            aria-hidden="true"
            className="absolute -bottom-[6px] left-14 h-[10px] w-[10px] rotate-45 border-r border-b border-accent bg-paper"
          />
        </div>
      )}
      <div className="pointer-events-auto flex h-[52px] w-full max-w-[340px] items-stretch overflow-hidden rounded-full bg-xr-bg [box-shadow:var(--dock-shadow)]">
        <button
          type="button"
          onClick={onToggleXray}
          aria-pressed={xray}
          className="inline-flex flex-[0_0_auto] cursor-pointer items-center gap-2 border-0 bg-transparent px-[18px] font-mono text-[13px] text-xr-ink"
        >
          <span aria-hidden="true" className={`relative h-4 w-[26px] rounded-full ${xray ? "bg-xr-accent" : "bg-dock-rule"}`}>
            <span
              className={`absolute top-[2px] h-3 w-3 rounded-full ${xray ? "left-3 bg-xr-bg" : "left-[2px] bg-xr-muted"}`}
            />
          </span>
          {xray ? "X-ray on" : "X-ray"}
        </button>
        <span aria-hidden="true" className="my-3 w-px bg-dock-rule" />
        <button
          type="button"
          onClick={onAsk}
          className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 border-0 bg-transparent font-sans text-[15px] font-semibold text-paper"
        >
          Ask my work{" "}
          <span aria-hidden="true" className="font-mono text-[13px] font-normal text-xr-muted">
            ↑
          </span>
        </button>
      </div>
    </div>
  );
}
