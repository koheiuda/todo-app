import Anthropic from "@anthropic-ai/sdk";

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.warn("[claude] ANTHROPIC_API_KEY is not set — agent calls will fail.");
}

export const anthropic = new Anthropic({ apiKey: apiKey ?? "" });

export const MODEL_DRAFT = "claude-sonnet-4-6";
export const MODEL_EDITOR = "claude-sonnet-4-6";

export async function completeText(opts: {
  model?: string;
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
}): Promise<string> {
  const res = await anthropic.messages.create({
    model: opts.model ?? MODEL_DRAFT,
    max_tokens: opts.maxTokens ?? 1024,
    temperature: opts.temperature ?? 0.7,
    system: opts.system,
    messages: [{ role: "user", content: opts.user }],
  });

  const text = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();

  return text;
}
