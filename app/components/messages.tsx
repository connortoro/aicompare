"use client"
import 'highlight.js/styles/atom-one-dark.css';
import Prompt from './prompt';
import LlmResponse from './response';

type Completion = {
  prompt: string,
  response: string
}

type MessageProps = {
  completions: Completion[]
}

export default function Messages({ completions }: MessageProps) {
  return (
    <div className="flex flex-col w-full justify-start items-center rounded-xl p-[2rem] space-y-6 text-neutral-200 min-h-full">
      {completions.length == 0 && (
        <div className="flex flex-col items-center justify-start space-y-8">
          <h1 className="text-2xl font-bold mt-[60%]">Hey, what&apos;s up?</h1>
          <h2 className="text-neutral-300 text-base">pick or add an OpenRouter model code below and ask a question!</h2>
        </div>
      )}
      <div className='space-y-10 w-full flex flex-col items-center justify-start'>
      {completions.map((comp, i) => {
        return (
          <div className="flex flex-col justify-start items-center w-full max-w-[60rem] text-[1.15rem]" key={i}>
            <Prompt prompt={comp.prompt}/>
            <LlmResponse response={comp.response}/>
          </div>
        );
      })}
      </div>
    </div>
  )
}
