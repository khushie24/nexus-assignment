import Groq from "groq-sdk";

let client: Groq | null = null;
const GROQ_TIMEOUT_MS = Number(process.env.GROQ_TIMEOUT_MS ?? 15000);

function getClient() {
  if (!process.env.GROQ_API_KEY) {
    return null;
  }

  client ??= new Groq({
    apiKey: process.env.GROQ_API_KEY,
    maxRetries: 0,
    timeout: GROQ_TIMEOUT_MS,
  });
  return client;
}

function timeoutAfter(ms: number) {
  return new Promise<null>((resolve) => {
    setTimeout(() => resolve(null), ms);
  });
}

export async function callGroq(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 4000
): Promise<string | null> {
  const groq = getClient();

  if (!groq) {
    return null;
  }

  try {
    const completion = await Promise.race([
      groq.chat.completions.create({
        model: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: maxTokens,
        temperature: 0.25,
      }),
      timeoutAfter(GROQ_TIMEOUT_MS),
    ]);

    if (!completion) {
      return null;
    }

    return completion.choices[0]?.message?.content ?? null;
  } catch (error) {
    console.error("Groq API error:", error);
    return null;
  }
}

export function parseJsonResponse<T>(raw: string): T {
  const cleaned = raw
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);

    if (!jsonMatch) {
      throw new Error("The AI response did not contain valid JSON.");
    }

    return JSON.parse(jsonMatch[0]) as T;
  }
}
