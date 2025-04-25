"use client"

import { sendPrompt } from "@/actions/chat";
import { ReactElement, useState } from "react";
import { FaArrowUp, FaGoogle } from "react-icons/fa";
import { FaX } from "react-icons/fa6";
import { SiClaude, SiOpenai } from "react-icons/si";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Completion = {
  prompt: string,
  response: string
}

const models = [
  "Gemini 2.0 Flash",
  "Gemini 2.5 Pro",
  "GPT-4.1",
  "o4-mini",
  "Claude 3.7 Sonnet",
]

const iconMap: Record<string, ReactElement> = {
  "Gemini 2.0 Flash": <FaGoogle/>,
  "Gemini 2.5 Pro": <FaGoogle/>,
  "GPT-4.1": <SiOpenai className="text-xl"/>,
  "o4-mini": <SiOpenai className="text-xl"/>,
  "Claude 3.7 Sonnet": <SiClaude className="text-xl"/>,
}


export default function Home() {
  const [prompt, setPrompt] = useState<string>("")
  const [model, setModel] = useState<string>("Gemini 2.0 Flash")
  const [selectingModel, setSelectingModel] = useState<boolean>(false)
  const [completions, setCompletions] = useState<Completion[]>([])

  async function handleSubmit() {
    setPrompt("")
    setCompletions(currCompletions => [...currCompletions, {prompt, response: ""}])
    const response = await sendPrompt(prompt, completions, model)
    setCompletions(currCompletions =>
      currCompletions.map(completion =>
        completion.prompt === prompt ? { ...completion, response: response } : completion
      )
    )
  }

  function handleClear() {
    setCompletions([])
  }

  return (
    <div className="flex flex-col justify-center items-center h-screen text-white w-full">
      <h1 className="text-4xl font-bold underline decoration-dashed underline-offset-4">chatoro</h1>
      {/* messages section */}
      <div className="flex flex-col max-w-[100rem] w-[85%] justify-start items-center bg-neutral-900 h-[75%] mt-9 rounded-xl p-[2rem] overflow-y-auto space-y-3">
        {completions.length == 0 && (
          <div className="flex flex-col items-center justify-center space-y-8">
            <h1 className="text-4xl font-bold mt-[20rem]">Hey, what's up?</h1>
            <h2 className="text-neutral-300 text-xl">pick a model down below and ask a question!</h2>
          </div>
          )}
        {completions.map((comp, i) => {
          return (
            <div className="flex flex-row justify-between w-full" key={i}>
              <div className="flex flex-col justify-end items-start max-w-[60%] text-wrap whitespace-pre-line">
                <p className="w-[100%] p-[1rem] rounded-xl mt-[2rem] bg-transparent text-transparent text-wrap break-words" style={{ userSelect: 'none' }}>
                    {comp.prompt}
                </p>
                {comp.response === "" ?
                <p className="max-w-[100%] p-[.8rem] bg-neutral-800 rounded-xl mt-[2rem] break-words text-3xl animate-pulse">
                • • •
                </p>
                :
                <div className="w-full p-[.8rem] bg-neutral-800 rounded-xl mt-[2rem]">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      // This applies styles to the root element
                      p: ({node, children, ...props}) => (
                        <p className="whitespace-pre-wrap break-words" {...props}>
                          {children}
                        </p>
                      ),
                      code: ({node, className, children, ...props}) => (
                        <code className={`${className || ''} break-all`} {...props}>
                          {children}
                        </code>
                      ),
                      pre: ({node, children, ...props}) => (
                        <pre className="whitespace-pre-wrap break-words overflow-x-hidden" {...props}>
                          {children}
                        </pre>
                      )
                    }}
                  >
                    {comp.response}
                  </ReactMarkdown>
                </div>

                 }

              </div>
              <div className="flex flex-row justify-end items-start max-w-[80%] text-wrap whitespace-pre-line">
                <p className="max-w-[100%] p-[1rem] bg-neutral-800 rounded-xl break-words">
                  {comp.prompt}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      {/* input section */}
      <div className="flex flex-col max-w-[100rem]  w-[75%] space-y-4 justify-center items-center bg-neutral-900 mt-9 rounded-xl p-[1.5rem]">
        <div className="flex flex-row justify-center items-center space-x-6 w-full">
          <div className="relative text-md hover:cursor-pointer outline-2 outline-neutral-600 p-2 rounded-xl font-semibold">
            <button onClick={()=> setSelectingModel(!selectingModel)} className="hover:cursor-pointer w-[8rem] h-[5rem] px-[8px]">{model}</button>
            {selectingModel && <div className="flex flex-col items-start  absolute bottom-full w-[18rem] bg-neutral-800 opacity-80 backdrop-blur-3xl space-y-4 mb-[1rem] p-[2rem] left-[-64] rounded-xl hover:cursor-default">
              {models.map(model => {
                return(
                  <button
                  key={model}
                    onClick={()=> {
                      setModel(model);
                      setSelectingModel(false)
                    }}
                    className="w-full hover:cursor-pointer opacity-100 text-white outline-2 outline-neutral-500 p-[10px] rounded-xl font-semibold ">
                    <div className="flex flex-row justify-between items-center px-2">
                      {model}
                      {iconMap[model]}
                    </div>
                  </button>
                )
              })}
            </div>}
          </div>
          <textarea
            value={prompt}
            placeholder="Ask me something"
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit()
              }
            }}
            className="bg-neutral-700 resize-none w-[75%] min-h-[7rem] rounded-xl p-[.6rem] text-xl focus:outline-none"
          ></textarea>
          <div className="space-y-2 text-lg flex flex-col item-center justify-center">
            <button onClick={handleSubmit}className="text-white p-[1rem] bg-neutral-700 rounded-xl hover:cursor-pointer hover:scale-[1.2] transition"><FaArrowUp /></button>
            <button onClick={handleClear} className="text-neutral-300 p-[1rem] bg-neutral-700 rounded-xl hover:cursor-pointer hover:scale-[1] scale-[.9] transition"><FaX/></button>
          </div>
        </div>
      </div>
    </div>
  );
}
