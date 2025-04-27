"use client"

import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from "rehype-highlight";
import 'highlight.js/styles/atom-one-dark.css';
import { FaCheck, FaRegCopy } from 'react-icons/fa';
import type { Element } from "hast";

type Completion = {
  prompt: string,
  response: string
}

type MessageProps = {
  completions: Completion[]
}

function getTextFromNode(node: React.ReactNode | string | number): string {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (!node) return '';
  if (Array.isArray(node)) return node.map(getTextFromNode).join('');
  if (typeof node === 'object' &&
      'props' in node &&
      node.props &&
      typeof node.props === 'object' &&
      'children' in node.props) {
    return getTextFromNode(node.props.children as React.ReactNode);
  }
  return '';
}

type CodeProps = React.HTMLAttributes<HTMLElement> & {
  inline?: boolean;
  node?: Element;
  children?: React.ReactNode;
};
const Code = ({ className, children, ...props }: CodeProps) => {
  const [copied, setCopied] = useState(false);
  if (!className) {
    return <code {...props}>{children}</code>;
  }

  const handleCopy = () => {
    const text = getTextFromNode(children)
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  };

  return (
    <div className="relative">
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-2 hover:bg-neutral-800 rounded"
      >
        {copied ? <FaCheck className='text-[#98C379]'/> : <FaRegCopy />}
      </button>
      <code className={`${className} break-all rounded-xl block pt-8`} {...props}>
        {children}
      </code>
    </div>
  );
};


export default function Messages({ completions }: MessageProps) {
  const [promptCopied, setPromptCopied] = useState(false)
  function handlePromptCopy(text: string) {
    setPromptCopied(true)
    navigator.clipboard.writeText(text)
    setTimeout(() => {
      setPromptCopied(false)
    }, 800);
  }

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
          <div className="flex flex-col justify-start items-center w-full space-y-6 text-sm h-full" key={i}>
            <div className="flex flex-row justify-end items-start w-full h-full">
              <div className="flex flex-col p-[1rem] bg-neutral-800 rounded-xl break-words text-lg max-w-[70%] whitespace-pre-wrap h-full">
                {comp.prompt}
              </div>
              <button onClick={()=>handlePromptCopy(comp.prompt)} className="text-lg relative top-full right-10 rounded hover:bg-neutral-700 p-2 mt-[5px]">{promptCopied ? <FaCheck className='text-[#98C379]'/> : <FaRegCopy/>}</button>

            </div>
            <div className="flex flex-row justify-start items-start w-full">
              {comp.response === "" ? (
                <div className="p-[.8rem] bg-neutral-800 rounded-xl break-words text-2xl animate-pulse">
                  • • •
                </div>
              ) : (
                <div className="p-[.8rem] bg-neutral-800 rounded-xl text-lg max-w-[83%] space-y-6">
                  <ReactMarkdown
                    rehypePlugins={[rehypeHighlight]}
                    components={{
                      p: ({children, ...props}) => (
                        <p className="whitespace-pre-wrap break-words" {...props}>
                          {children}
                        </p>
                      ),
                      code: Code,
                      pre: ({children, ...props}) => (
                        <pre className="whitespace-pre-wrap break-words overflow-x-hidden relative" {...props}>
                          {children}
                        </pre>
                      ),
                      li: ({ children, ...props }) => {
                        // Check if children exist and are not just whitespace
                        const hasContent = React.Children.toArray(children).some(child =>
                          typeof child === 'string' ? child.trim() !== '' : true
                        );

                        if (!hasContent) {
                          return null; // Don't render anything if there's no real content
                        }

                        return (
                          <li className="my-2" {...props}>
                            • {children}
                          </li>
                        );
                      },

                      ul: ({ children, ...props }) => (
                        <ul className="my-2" {...props}> {/* Adds margin top and bottom */}
                          {children}
                        </ul>
                      ),
                      ol: ({ children, ...props }) => (
                        <ol className="my-2" {...props}> {/* Adds margin top and bottom */}
                          {children}
                        </ol>
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
