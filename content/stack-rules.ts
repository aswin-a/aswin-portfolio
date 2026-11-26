/**
 * The four Judgment rules on /stack (design update 11). `body` is from Stack.dc.html (≥ 640px);
 * `phoneBody` is the shorter copy StackMobile.dc.html shows below 640px. Word for word.
 */
export type StackRule = { id: string; title: string; body: string; phoneBody: string };

export const stackRules: StackRule[] = [
  {
    id: "R1",
    title: "AI prepares, I decide",
    body: "Research, drafts and options come from AI. The call, and the accountability, stay with me.",
    phoneBody: "AI brings research, drafts and options. The call stays with me.",
  },
  {
    id: "R2",
    title: "Verify before it ships",
    body: "Numbers, quotes and claims are checked against their source before anyone else sees them.",
    phoneBody: "Numbers, quotes and claims checked against the source.",
  },
  {
    id: "R3",
    title: "Context over prompts",
    body: "Good output starts from good context: strategy, personas, metrics and past decisions, kept current.",
    phoneBody: "Strategy, personas, metrics and decisions, kept current.",
  },
  {
    id: "R4",
    title: "Prune what doesn’t earn its place",
    body: "If a tool or agent doesn’t save time or sharpen thinking, it comes out of the stack.",
    phoneBody: "No time saved, no sharper thinking: it comes out.",
  },
];
