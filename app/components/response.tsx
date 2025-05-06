import ReactMarkdown from 'react-markdown';
import rehypeHighlight from "rehype-highlight";
import { FaCheck, FaRegCopy } from 'react-icons/fa';
import type { Element } from "hast";
import React, { useState } from 'react'

type ResponseProps = {
  response: string
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
    return <code className='bg-[#282C34] p-1 rounded-sm text-white' {...props}>{children}</code>;
  }

  const handleCopy = () => {
    const text = getTextFromNode(children)
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 500);
  };

  return (
    <div className="relative">
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-2 hover:bg-neutral-800 rounded text-neutral-300 hover:cursor-pointer"
      >
        {copied ? <FaCheck className='text-[#98C379]'/> : <FaRegCopy />}
      </button>
      <code className={`${className} break-all rounded-xl block pt-8`} {...props}>
        {children}
      </code>
    </div>
  );
};


export default function LlmResponse({ response }: ResponseProps) {
  return (
    <div className="flex flex-row justify-start items-start w-full">
              {response === "" ? (
                <div className="p-[1rem] bg-[#222222] rounded-xl break-words text-2xl animate-pulse">
                  • • •
                </div>
              ) : (
                <div className="p-[1rem] bg-[#222222] rounded-xl  lg:text-lg text-md max-w-[100%] space-y-6">
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
                        const hasContent = React.Children.toArray(children).some(child =>
                          typeof child === 'string' ? child.trim() !== '' : true
                        );

                        console.log(children)
                        if (!hasContent) {
                          return null;
                        }

                        return (
                          <li className="my-2 flex items-start ml-5" {...props}>
                            <span className="text-xl text-neutral-300 pr-2 inline-block flex-shrink-0">•</span>
                            <div className="flex-grow">{children}</div>
                          </li>
                        );
                      },

                      ul: ({ children, ...props }) => (
                        <ul className="my-2" {...props}>
                          {children}
                        </ul>
                      ),
                      ol: ({ children, ...props }) => (
                        <ol className="my-2" {...props}>
                          {children}
                        </ol>
                      ),
                      hr:({children}) => (
                        <div className='w-full h-[4px] bg-neutral-800 my-8'>{children}</div>
                      ),
                      strong:({children}) => (
                        <strong className='text-neutral-100 text-[1.2rem]'>{children}</strong>
                      )
                    }}
                  >
                    {response}
                  </ReactMarkdown>
                </div>
              )}
            </div>
  )
}
