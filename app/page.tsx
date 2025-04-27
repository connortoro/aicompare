"use client"

import { sendPrompt } from "@/actions/chat";
import { ReactElement, useState, useRef } from "react";
import { FaArrowUp, FaCaretDown, FaCaretUp, FaGoogle } from "react-icons/fa";
import { FaX } from "react-icons/fa6";
import { SiClaude, SiOpenai } from "react-icons/si";
import { readStreamableValue } from "ai/rsc";

import Messages from "./components/messages";

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
  "Claude 3.5 Sonnet",
]

const iconMap: Record<string, ReactElement> = {
  "Gemini 2.0 Flash": <FaGoogle/>,
  "Gemini 2.5 Pro": <FaGoogle/>,
  "GPT-4.1": <SiOpenai className="text-xl"/>,
  "o4-mini": <SiOpenai className="text-xl"/>,
  "Claude 3.7 Sonnet": <SiClaude className="text-xl"/>,
  "Claude 3.5 Sonnet": <SiClaude className="text-xl"/>
}


export default function Home() {
  const [prompt, setPrompt] = useState<string>("")
  const [model, setModel] = useState<string>("Gemini 2.0 Flash")
  const [selectingModel, setSelectingModel] = useState<boolean>(false)
  const [completions, setCompletions] = useState<Completion[]>([])
  const abortControllerRef = useRef<AbortController | null>(null);

  async function handleSubmit() {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setPrompt("")
    setCompletions(currCompletions => [...currCompletions, {prompt, response: ""}])
    const { output } = await sendPrompt(prompt, completions, model)
    let fullText = ''

    for await (const delta of readStreamableValue(output)) {
      if (signal.aborted) {
        break;
      }
      fullText += delta
      setCompletions(prev => {
        const curr = [...prev]
        curr[curr.length-1].response = fullText
        return curr
        })
    }
    if (!signal.aborted) {
      setCompletions(prev => {
        const curr = [...prev]
        curr[curr.length-1].response = fullText
        return curr
        })
    }
  }

  function handleClear() {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setCompletions([])
  }

  return (
    <div className="flex flex-col justify-start items-center h-full text-neutral-200 w-full bg-neutral-900">
      <h2 className="fixed top-4 left-6 text-xl font-semibold text-neutral-400">ai_compare</h2>
      {/* messages section */}
      <Messages completions={completions}/>

      {/* input section */}
      <div className="flex flex-col 2xl:w-[70rem] xl:w-[60rem] md:w-[50rem] w-full space-y-4 justify-center items-center bg-neutral-900/20 backdrop-blur-md rounded-t-4xl px-4 py-7 font-normal fixed bottom-0 left-1/2 transform -translate-x-1/2 border-t-2 border-x-2 border-neutral-800">
        <div className="flex flex-row justify-center items-center space-x-4 w-full">
          <div className="relative text-sm hover:cursor-pointer outline-2 outline-neutral-700 p-2 rounded-xl bg-neutral-800/40 backdrop-blur-md mr-[3rem]">
            <button onClick={()=> setSelectingModel(!selectingModel)} className="hover:cursor-pointer w-[10rem] h-[2.5rem] text-sm text-neutral-300 flex flex-row items-center justify-between">{model} {iconMap[model]} {selectingModel ? <FaCaretUp/> : <FaCaretDown/>}</button>
            {selectingModel && <div className="flex flex-col items-start  absolute bottom-full w-[15rem] bg-neutral-600/10 backdrop-blur-sm  space-y-4 mb-[1rem] p-[1rem] left-[-64] rounded-xl hover:cursor-default">
              {models.map(model => {
                return(
                  <button
                  key={model}
                    onClick={()=> {
                      setModel(model);
                      setSelectingModel(false)
                    }}
                    className="w-full hover:cursor-pointer opacity-100 outline-2 outline-neutral-500 p-[10px] rounded-xl font-semibold ">
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
            onClick={()=> setSelectingModel(false)}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit()
              }
            }}
            className="bg-neutral-800/80 resize-none w-[50%] min-h-[7rem] rounded-xl p-[.6rem] px-[.8rem] text-md focus:outline-none focus:ring-2 ring-neutral-700"
          ></textarea>
          <div className="space-y-2 text-lg flex flex-col item-center justify-center">
            <button onClick={handleSubmit}className="text-neutral-300 p-[1rem] bg-neutral-800 rounded-xl hover:cursor-pointer hover:scale-[1.2] transition text-md"><FaArrowUp /></button>
            <button onClick={handleClear} className="text-neutral-400 p-[1rem] bg-neutral-800 rounded-xl hover:cursor-pointer hover:scale-[1] scale-[.9] transition"><FaX/></button>
          </div>
        </div>
      </div>
    </div>
  );
}
