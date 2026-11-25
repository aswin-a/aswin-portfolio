import { createAnthropic } from "@ai-sdk/anthropic";
import type { LanguageModel } from "ai";
import { isFake, serverEnv, type ServerEnv } from "@/lib/server/env";
import { isPriced } from "./cost";

/** Which env var picks the model: FIT_CHECK_MODEL for the fit check, CHAT_MODEL for Ask and Break my AI. */
export type ModelRole = "fit" | "chat";

export type ResolvedModel = {
  model: LanguageModel;
  /** The model id, used for pricing and the `runs.model` column. */
  id: string;
  /** "provider · model", shown in X-ray (RunTraceSchema.model). */
  label: string;
};

export class ModelConfigError extends Error {}

/** Model IDs come from env (SPEC §13). Throws when the key is missing or the model is unpriced. */
export async function getModel(role: ModelRole, env: ServerEnv = serverEnv()): Promise<ResolvedModel> {
  if (isFake(env)) {
    // Imported only under AI_FAKE, which production refuses.
    const { fakeModel } = await import("./fake");
    return { model: fakeModel(), id: "fake", label: "Fake · test model (AI_FAKE)" };
  }
  const id = role === "fit" ? env.FIT_CHECK_MODEL : env.CHAT_MODEL;
  if (!env.ANTHROPIC_API_KEY) throw new ModelConfigError("ANTHROPIC_API_KEY is not set");
  if (!isPriced(id)) throw new ModelConfigError(`Model ${id} has no price in lib/ai/cost.ts`);
  const anthropic = createAnthropic({ apiKey: env.ANTHROPIC_API_KEY });
  return { model: anthropic(id), id, label: `Anthropic · ${id}` };
}
