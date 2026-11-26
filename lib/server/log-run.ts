import { createClient } from "@supabase/supabase-js";
import { isProduction, type ServerEnv } from "./env";

/**
 * One row of `runs` (SPEC §10). Run metrics only: there is deliberately no field for the JD,
 * the question, the attempt or a URL, so visitor text cannot be logged.
 */
export type RunRow = {
  id: string;
  mode: "fit" | "ask";
  drill: "kb" | "rate" | null;
  branch: "link" | "text" | null;
  steps: { tool: string; status: string; ms: number }[];
  guard_fired: string | null;
  retries: number;
  /** Fit check only (null otherwise): the "This run" fields in X-ray (SPEC §10). */
  requirement_count: number | null;
  sources_retrieved: number | null;
  sources_cited: number | null;
  fallback: "error" | "limited" | "budget" | "link" | null;
  model: string;
  input_tokens: number;
  output_tokens: number;
  cached_tokens: number;
  cost_usd: number;
  latency_ms: number;
  prompt_version: string;
};

export type RunLogger = (row: RunRow, env: ServerEnv) => Promise<void>;

/** Inserts with the service role (RLS on, no policies). Outside production, no Supabase env → skipped. */
export const logRun: RunLogger = async (row, env) => {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    if (isProduction(env)) console.error("run log skipped: Supabase env is not set");
    return;
  }
  const db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const { error } = await db.from("runs").insert(row);
  if (error) console.error("run log failed:", error.message);
};
