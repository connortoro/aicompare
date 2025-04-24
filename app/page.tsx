"use client"

import { sendPrompt } from "@/actions/chat";
import { useState } from "react";
import { FaArrowUp, FaCross } from "react-icons/fa";
import { FaX } from "react-icons/fa6";

type Completion = {
  prompt: string,
  response: string
}


export default function Home() {
  const [prompt, setPrompt] = useState<string>("")
  const [completions, setCompletions] = useState<Completion[]>([])

  async function handleSubmit() {
    setPrompt("")
    setCompletions(currCompletions => [...currCompletions, {prompt, response: ""}])
    const response = await sendPrompt(prompt, completions, "microsoft/mai-ds-r1:free")
    setCompletions(currCompletions =>
      currCompletions.map(completion =>
        completion.prompt === prompt ? { ...completion, response: response } : completion
      )
    )
  }

  function handleClear() {
    setPrompt("")
    setCompletions([])
  }

  return (
    <div className="flex flex-col justify-center items-center h-screen text-white text-xl w-full">
      <h1 className="text-4xl font-bold underline decoration-dashed underline-offset-4">chatoro</h1>
      {/* messages section */}
      <div className="flex flex-col w-[85%] justify-start items-center bg-neutral-900 h-[75%] mt-9 rounded-xl p-[2rem] overflow-y-auto space-y-3">
        {completions.length == 0 && <h1 className="text-4xl font-bold mt-[20rem]">Hey, what's up?</h1>}
        {completions.map((comp, i) => {
          return (
            <div className="flex flex-row justify-between w-full" key={i}>
              <div className="flex flex-col justify-end items-start max-w-[60%] text-wrap whitespace-pre-line">
              <p className="max-w-[100%] p-[1rem] rounded-xl mt-[2rem] bg-transparent text-transparent text-wrap break-words" style={{ userSelect: 'none' }}>
                  {comp.prompt}
                </p>
                {comp.response === "" ?
                <p className="max-w-[100%] p-[.8rem] bg-neutral-800 rounded-xl mt-[2rem] break-words text-3xl animate-pulse">
                • • •
                </p>
                :
                <p className="max-w-[100%] p-[1rem] bg-neutral-800 rounded-xl mt-[2rem] break-words">
                  {comp.response}
                </p>
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
      <div className="flex flex-col w-[60%] space-y-4 justify-center items-center bg-neutral-900 mt-9 rounded-xl p-[1.5rem]">
        <div className="flex flex-row justify-center items-center space-x-6 w-full">
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
            className="bg-neutral-700 resize-none w-[90%] min-h-[7rem] rounded-xl p-[.6rem]"
          ></textarea>
          <div className="space-y-4">
            <button
              onClick={handleSubmit}
              className="text-white p-[1rem] bg-neutral-700 rounded-xl hover:cursor-pointer hover:scale-[1.2] transition"
            >
              <FaArrowUp />
            </button>
            <button onClick={handleClear} className="text-white p-[.6rem] bg-neutral-700 rounded-lg hover:cursor-pointer hover:scale-[1.2] transition"><FaX/></button>
          </div>
        </div>
      </div>
    </div>
  );
}
