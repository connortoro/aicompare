"use client"

import { sendPrompt } from "@/actions/chat";
import { ReactElement, useState, useRef, useEffect } from "react";
import { FaArrowUp, FaCaretDown, FaCaretUp, FaGoogle } from "react-icons/fa";
import { SiClaude, SiOpenai } from "react-icons/si";
import { readStreamableValue } from "ai/rsc";
import Messages from "./components/messages";
import { BiTrash } from "react-icons/bi";
import Image from "next/image";

type Completion = {
  prompt: string,
  response: string
}

const models = [
  "Gemini 2.5 Flash",
  "Gemini 2.5 Pro",
  "GPT-4.1",
  "o3",
  "Claude 4 Sonnet",
  "Claude 4 Opus",
  "DeepSeek V3"
]

const iconMap: Record<string, ReactElement> = {
  "Gemini 2.5 Flash": <FaGoogle/>,
  "Gemini 2.5 Pro": <FaGoogle/>,
  "GPT-4.1": <SiOpenai className="text-xl"/>,
  "o3": <SiOpenai className="text-xl"/>,
  "Claude 4 Sonnet": <SiClaude className="text-xl"/>,
  "Claude 4 Opus": <SiClaude className="text-xl"/>,
  "DeepSeek V3": <Image className="white-svg" src={'/deepseek.svg'} alt="DeepSeek" width={21} height={21}/>
}

export default function Home() {
  const [prompt, setPrompt] = useState<string>("")
  const [model, setModel] = useState<string>(models[0])
  const [selectingModel, setSelectingModel] = useState<boolean>(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null);


  async function handleSubmit() {
    if(prompt === "" || isStreaming){
      return
    }
    setIsStreaming(true)

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
    setIsStreaming(false)
  }

  function handleClear() {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setCompletions([])
  }

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    const savedCompletions = localStorage.getItem('completions');
    if (savedCompletions) {
      setCompletions(JSON.parse(savedCompletions));
    }
    const savedModel = localStorage.getItem('model');
    if(savedModel) {
      setModel(savedModel)
    }
  }, []);

  const [completions, setCompletions] = useState<Completion[]>([])

  useEffect(() => {
    localStorage.setItem('completions', JSON.stringify(completions));
  }, [completions]);

  useEffect(() => {
    localStorage.setItem('model', model);
  }, [model]);

  return (
    <div className="flex flex-col justify-start items-center h-full text-neutral-200 w-full bg-neutral-900 ">
      {/* messages section */}
      <Messages completions={completions}/>

      {/* input section */}
      <div className="flex flex-col max-w-[75rem] w-[93%] space-y-4 justify-center items-center bg-[#212121]/30 backdrop-blur-sm rounded-t-4xl px-4  pt-5 font-normal fixed bottom-0 left-1/2 transform -translate-x-1/2 border-x-4 border-t-4 border-neutral-800/50 outline-2 outline-neutral-700/50">
        <div className="flex flex-row justify-around items-center space-x-4 w-full ">
          <div className="relative text-md hover:cursor-pointer  rounded-xl   font-semibold">
            <button onClick={()=> setSelectingModel(!selectingModel)} className="hover:cursor-pointer w-[13rem] h-[2.5rem] text-md text-neutral-300 flex flex-row items-center justify-center space-x-4"><div>{model}</div>{iconMap[model]} <div>{selectingModel ? <FaCaretUp className="text-xl text-neutral-400"/> : <FaCaretDown className="text-xl"/>}</div></button>
            {selectingModel && <div className="outline-2 outline-neutral-800/50 flex flex-col items-start absolute bottom-full w-[15rem] bg-neutral-800/90 backdrop-blur-lg  space-y-4 mb-[1rem] p-[1rem] left-[-10] rounded-xl hover:cursor-default">
              {models.map(model => {
                return(
                  <button
                  key={model}
                    onClick={()=> {
                      setModel(model);
                      setSelectingModel(false)
                    }}
                    className="w-full hover:cursor-pointer opacity-100 outline-2 outline-neutral-500 p-[10px] rounded-xl font-semibold ">
                    <div className="flex flex-row justify-between items-center px-2 font-semibold">
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
            placeholder="Ask me something..."
            onClick={()=> setSelectingModel(false)}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit()
              }
            }}
            className="bg-neutral-800/90 resize-none w-full mr-12 min-h-[8rem] rounded-t-xl p-[.6rem] px-[.8rem] text-[1.1rem] focus:outline-none focus:ring-2 ring-neutral-800"
          ></textarea>
          <div className="space-y-2 text-lg flex flex-col item-center justify-center">
            <button onClick={() => handleSubmit()}className="flex flex-row items-center justify-center text-neutral-200 p-[1rem] bg-neutral-800 rounded-xl hover:cursor-pointer text-md"><FaArrowUp /></button>
            <button onClick={handleClear} className="flex flex-row items-center justify-center text-neutral-400 text-xl p-[1rem] scale-[.9] bg-neutral-800 rounded-xl hover:cursor-pointer"><BiTrash/></button>
          </div>
        </div>
      </div>
    </div>
  );
}
