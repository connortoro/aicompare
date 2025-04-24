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

  const completion = await openai.chat.completions.create({
    model,
    messages: [...currMessages]
  });
  return completion.choices[0].message.content || "Error, something bad happened"
}
