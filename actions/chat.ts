"use server"
import OpenAI  from 'openai'
import {
  ChatCompletionUserMessageParam,
  ChatCompletionAssistantMessageParam,
} from "openai/resources/chat/completions";

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY
});

type Completion = {
  prompt: string,
  response: string
}

const modelMap: Record<string, string> = {
  "Gemini 2.0 Flash": "google/gemini-2.0-flash-001",
  "Gemini 2.5 Pro": "google/gemini-2.5-pro-preview-03-25",
  "GPT-4.1": "openai/gpt-4.1",
  "o4-mini": "openai/o4-mini",
  "Claude 3.7 Sonnet": "anthropic/claude-3.7-sonnet",
  "Claude 3.5 Sonnet": "anthropic/claude-3.5-sonnet",
}


export async function sendPrompt(message: string, completions: Completion[], model: string): Promise<string> {
  var currMessages: (
    | ChatCompletionUserMessageParam
    | ChatCompletionAssistantMessageParam
  )[] = [];

  for(const completion of completions){
    currMessages.push({ role: 'user', content: completion.prompt })
    currMessages.push({ role: 'assistant', content: completion.response })
  }

  currMessages.push({ role: 'user', content: message })

  const openRouterModel = modelMap[model]
  if(!openRouterModel){
    return "Error..."
  }

  const completion = await openai.chat.completions.create({
    model: openRouterModel,
    messages: [...currMessages]
  });
  return completion.choices[0].message.content || "Error, something bad happened"
}
