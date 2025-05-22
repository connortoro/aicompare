import ReactMarkdown from 'react-markdown';
import rehypeHighlight from "rehype-highlight";
import remarkGfm from 'remark-gfm'
import { FaCheck, FaRegCopy } from 'react-icons/fa';
import type { Element } from "hast";
import React, { useState } from 'react'
import 'katex/dist/katex.min.css';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

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
    return <code className='bg-[#232323] p-2 rounded-md text-white font-semibold' {...props}>{children}</code>;
  }

  const handleCopy = () => {
    const text = getTextFromNode(children)
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 500);
  };

  const language = className.split("-")[1]

  return (
    <div className=" leading-normal">
      <div className='h-[3rem] bg-neutral-800 rounded-t-xl flex flex-row justify-between items-center'>
        <span className='p-4 pt-'>{language}</span>
        <button onClick={handleCopy}className="p-2 mr-2 hover:bg-neutral-800 rounded text-neutral-300 hover:cursor-pointer">{copied ? <FaCheck className='text-[#98C379]'/> : <FaRegCopy />}</button>
      </div>

      <code className={`${className} rounded-b-xl pt-8`} {...props}>
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
                <div className="p-[1rem]  rounded-xl max-w-[100%] space-y-6 leading-loose">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeHighlight, rehypeKatex]}
                    components={{
                      p: ({children, ...props}) => (
                        <p className="whitespace-pre-wrap break-words" {...props}>
                          {children}
                        </p>
                      ),
                      code: Code,
                      pre: ({children, ...props}) => (
                        <pre className="whitespace-pre break-words overflow-x-auto relative" {...props}>
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
                          <li className="flex items-start ml-5 my-2" {...props}>
                            <span className="text-xl text-neutral-300 pr-2 inline-block flex-shrink-0">•</span>
                            <div className="flex-grow">{children}</div>
                          </li>
                        );
                      },

                      ul: ({ children, ...props }) => (
                        <ul className="leading-relaxed my-2" {...props}>
                          {children}
                        </ul>
                      ),
                      ol: ({ children, ...props }) => (
                        <ol className="leading-relaxed my-2" {...props}>
                          {children}
                        </ol>
                      ),
                      hr:({children}) => (
                        <div className='w-full h-[4px] bg-neutral-800 my-8'>{children}</div>
                      ),
                      strong:({children}) => (
                        <strong className='text-neutral-100 md:text-[1.4rem]'>{children}</strong>
                      ),
                      thead:({children}) => (
                        <thead className='border-b-2 border-neutral-400'>{children}</thead>
                      ),
                      tr:({children}) => (
                        <tr className='border-b-2 border-neutral-800 my-2'>{children}</tr>
                      ),
                      th: ({children, ...props}) => (
                        <th className="px-4 py-2 text-left font-semibold bg-neutral-900 text-neutral-100" {...props}>
                          {children}
                        </th>
                      ),
                      td: ({children, ...props}) => (
                        <td className="px-4 py-2 text-neutral-200" {...props}>
                          {children}
                        </td>
                      ),
                      table: ({children, ...props}) => (
                        <table className="w-full border-collapse my-4 rounded-lg overflow-hidden" {...props}>
                          {children}
                        </table>
                      ),
                    }}
                  >
                    {response}
                  </ReactMarkdown>
                </div>
              )}
            </div>
  )
}
