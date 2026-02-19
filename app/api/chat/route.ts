import { ModelMessage, streamText } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { isValidModelCode, normalizeModelCode } from "@/lib/model-utils";

type Completion = {
  prompt: string;
  response: string;
};

type ChatRequest = {
  message: string;
  completions: Completion[];
  model: string;
};

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

export async function POST(request: Request) {
  if (!process.env.OPENROUTER_API_KEY) {
    return Response.json(
      { error: "Missing OPENROUTER_API_KEY environment variable" },
      { status: 500 },
    );
  }

  let payload: ChatRequest;
  try {
    payload = (await request.json()) as ChatRequest;
  } catch {
    return Response.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const modelCode = normalizeModelCode(payload.model);
  if (!isValidModelCode(modelCode)) {
    return Response.json({ error: "Invalid model code" }, { status: 400 });
  }

  const messages: ModelMessage[] = [
    { role: "system", content: "You are a helpful assistant" },
  ];

  for (const completion of payload.completions ?? []) {
    messages.push({ role: "user", content: completion.prompt });
    messages.push({ role: "assistant", content: completion.response });
  }
  messages.push({ role: "user", content: payload.message });

  const result = streamText({
    model: openrouter(modelCode),
    messages,
  });

  return result.toTextStreamResponse();
}

