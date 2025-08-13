"use server"
import { CoreMessage, streamText } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { createStreamableValue } from 'ai/rsc';

// const openai = new OpenAI({
//   baseURL: 'https://openrouter.ai/api/v1',
//   apiKey: process.env.OPENROUTER_API_KEY
// });

const openrouter = createOpenRouter({ apiKey: process.env.OPENROUTER_API_KEY });

type Completion = {
  prompt: string,
  response: string
}

const modelMap: Record<string, string> = {
  "Gemini 2.5 Flash": "google/gemini-2.5-flash-preview",
  "Gemini 2.5 Pro": "google/gemini-2.5-pro-preview",
  "GPT-5": "openai/gpt-5",
  "GPT-5 nano": "openai/gpt-5-nano",
  "Claude 4 Sonnet": "anthropic/claude-sonnet-4",
  "Claude 4 Opus": "anthropic/claude-opus-4",
}


export async function sendPrompt(message: string, completions: Completion[], model: string) {
  const currMessages: CoreMessage[] = [
    { role: 'system', content: 'You are a helpful assistant'}
  ];

  for(const completion of completions){
    currMessages.push({ role: 'user', content: completion.prompt })
    currMessages.push({ role: 'assistant', content: completion.response })
  }
  currMessages.push({ role: 'user', content: message })

  const stream = createStreamableValue('');
  console.log(modelMap[model]);
  (async () => {
    const { textStream } = streamText({
      model: openrouter(modelMap[model]),
      messages: currMessages
    });

    for await (const delta of textStream) {
      stream.update(delta);
    }

    stream.done();
  })();

  return { output: stream.value };
}
