import { ModelMessage, streamText, tool, stepCountIs } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { isValidModelCode, normalizeModelCode } from "@/lib/model-utils";
import { z } from "zod";

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

async function tavilySearch(query: string): Promise<string> {
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: process.env.TAVILY_API_KEY,
      query,
      search_depth: "basic",
      max_results: 5,
      include_answer: true,
    }),
  });

  if (!res.ok) {
    throw new Error(`Tavily search failed: ${res.status}`);
  }

  const data = await res.json();

  const parts: string[] = [];
  if (data.answer) {
    parts.push(`Summary: ${data.answer}`);
  }
  for (const result of data.results ?? []) {
    parts.push(`[${result.title}](${result.url})\n${result.content}`);
  }
  return parts.join("\n\n");
}

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
    {
      role: "system",
      content:
        "You are a helpful assistant with access to a web search tool. " +
        "Use the web_search tool whenever the user asks about recent events, current information, " +
        "or anything that may require up-to-date knowledge beyond your training data.",
    },
  ];

  for (const completion of payload.completions ?? []) {
    messages.push({ role: "user", content: completion.prompt });
    messages.push({ role: "assistant", content: completion.response });
  }
  messages.push({ role: "user", content: payload.message });

  const result = streamText({
    model: openrouter(modelCode),
    messages,
    stopWhen: stepCountIs(5),
    tools: {
      web_search: tool({
        description:
          "Search the web for current, up-to-date information. Use this for recent events, live data, or anything beyond your training knowledge.",
        inputSchema: z.object({
          query: z.string().describe("The search query to look up"),
        }),
        execute: async (input: { query: string }) => tavilySearch(input.query),
      }),
    },
  });

  // Stream a custom newline-delimited JSON protocol so the client can
  // distinguish text deltas from tool-call events:
  //   {"type":"text","value":"..."}
  //   {"type":"tool-call-start","query":"..."}
  //   {"type":"tool-result"}
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const part of result.fullStream) {
          let line: string | null = null;

          if (part.type === "text-delta") {
            line = JSON.stringify({ type: "text", value: part.text });
          } else if (part.type === "tool-call") {
            const input = part.input as { query?: string } | undefined;
            line = JSON.stringify({
              type: "tool-call-start",
              query: input?.query ?? "",
            });
          } else if (part.type === "tool-result") {
            line = JSON.stringify({ type: "tool-result" });
          }

          if (line !== null) {
            controller.enqueue(encoder.encode(line + "\n"));
          }
        }
      } catch (err) {
        controller.error(err);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson" },
  });
}
