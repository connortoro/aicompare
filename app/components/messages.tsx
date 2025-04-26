"use client"
import React from 'react'
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from "rehype-highlight";
import 'highlight.js/styles/atom-one-dark.css';

type Completion = {
  prompt: string,
  response: string
}

type MessageProps = {
  completions: Completion[]
}

export default function Messages({ completions }: MessageProps) {
  return (
    <div className="flex flex-col 2xl:w-[70rem] xl:w-[50rem] w-[45rem] justify-start items-center bg-neutral-900 rounded-xl p-[2rem] overflow-y-auto space-y-6 custom-scrollbar pb-[12rem] text-neutral-300">
      {completions.length == 0 && (
        <div className="flex flex-col items-center justify-center space-y-8">
          <h1 className="text-3xl font-bold mt-[80%]">Hey, what&apos;s up?</h1>
          <h2 className="text-neutral-300 text-lg">pick a model down below and ask a question!</h2>
        </div>
      )}
      
      {completions.map((comp, i) => {
        return (
          <div className="flex flex-col justify-start items-center w-full space-y-6 text-sm" key={i}>
            <div className="flex flex-row justify-end items-start w-full">
              <div className="p-[1rem] bg-neutral-800 rounded-xl break-words text-lg max-w-[70%]">
                {comp.prompt}
              </div>
            </div>
            <div className="flex flex-row justify-start items-start w-full">
              {comp.response === "" ? (
                <div className="p-[.8rem] bg-neutral-800 rounded-xl break-words text-2xl animate-pulse">
                  • • •
                </div>
              ) : (
                <div className="p-[.8rem] bg-neutral-800 rounded-xl text-lg max-w-[70%]">
                  <ReactMarkdown
                    rehypePlugins={[rehypeHighlight]}
                    components={{
                      p: ({children, ...props}) => (
                        <p className="whitespace-pre-wrap break-words" {...props}>
                          {children}
                        </p>
                      ),
                      code: ({className, children, ...props}) => (
                        <code className={`${className || ''} break-all rounded-xl`} {...props}>
                          {children}
                        </code>
                      ),
                      pre: ({children, ...props}) => (
                        <pre className="whitespace-pre-wrap break-words overflow-x-hidden" {...props}>
                          {children}
                        </pre>
                      )
                    }}
                  >
                    {comp.response}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  )
}