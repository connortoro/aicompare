import ReactMarkdown from 'react-markdown';
import rehypeHighlight from "rehype-highlight";
import remarkGfm from 'remark-gfm'
import { FaCheck, FaRegCopy } from 'react-icons/fa';
import type { Element } from "hast";
import React, { useState, useEffect } from 'react'
import 'katex/dist/katex.min.css';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

type ResponseProps = {
  response: string
  isSearching?: boolean
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

const InlineCode = ({ className, children, ...props }: CodeProps) => (
  <code className='bg-[#1a1b26] px-1.5 py-0.5 rounded text-[#c0caf5] font-semibold border border-neutral-700' {...props}>
    {children}
  </code>
);

const CodeBlock = ({ className, children, ...props }: CodeProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = getTextFromNode(children)
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 500);
  };

  const language = className?.split("-")[1] || ''

  return (
    <div className="leading-normal my-4 rounded-xl border border-neutral-700 overflow-hidden shadow-lg shadow-black/20">
      <div className='h-[3rem] bg-neutral-800 flex flex-row justify-between items-center border-b border-neutral-700'>
        <span className='p-4 text-neutral-400 text-sm font-mono uppercase tracking-wider'>{language}</span>
        <button onClick={handleCopy} className="p-2 mr-2 hover:bg-neutral-700 rounded text-neutral-400 hover:text-white transition-colors hover:cursor-pointer">
          {copied ? <FaCheck className='text-green-400'/> : <FaRegCopy />}
        </button>
      </div>

      <code className={`${className || ''} p-4 bg-[#1a1b26] block text-[#c0caf5]`} {...props}>
        {children}
      </code>
    </div>
  );
};

const Code = (props: CodeProps) => {
  const { children, className } = props;
  
  // Detect inline code based on content:
  // - No newlines (inline code rarely has newlines)
  // - Short length (inline code is typically short)
  // - Or explicit inline prop
  const text = getTextFromNode(children);
  const hasNewlines = text.includes('\n');
  const isShort = text.length < 100;
  const isInline = props.inline === true || (!hasNewlines && isShort && !className?.includes('language-'));
  
  if (isInline) {
    return <InlineCode {...props} />;
  }
  return <CodeBlock {...props} />;
};

export default function LlmResponse({ response, isSearching }: ResponseProps) {
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (isSearching) {
      setHasSearched(true);
    }
  }, [isSearching]);

  const showSearching = hasSearched || isSearching;

  return (
    <div className="flex flex-row justify-start items-start w-full">
      <style>{`
        /* TokyoNight Moon Syntax Highlighting */
        .hljs {
          color: #c0caf5;
          background: #1a1b26;
        }
        .hljs-keyword { color: #bb9af7; font-weight: 600; }
        .hljs-function { color: #7aa2f7; }
        .hljs-string { color: #9ece6a; }
        .hljs-number { color: #ff9e64; }
        .hljs-comment { color: #565f89; font-style: italic; }
        .hljs-variable { color: #c0caf5; }
        .hljs-params { color: #c0caf5; }
        .hljs-property { color: #73daca; }
        .hljs-operator { color: #bb9af7; }
        .hljs-punctuation { color: #73daca; }
        .hljs-tag { color: #f7768e; }
        .hljs-attr { color: #e0af68; }
        .hljs-built_in { color: #e0af68; }
        .hljs-type { color: #2ac3de; }
        .hljs-class { color: #e0af68; }
        .hljs-literal { color: #ff9e64; }
        .hljs-regexp { color: #b9f27c; }
        .hljs-template-variable { color: #e0af68; }
        .hljs-title { color: #7aa2f7; }
        .hljs-name { color: #f7768e; }
        .hljs-section { color: #7aa2f7; }
        .hljs-selector-class { color: #e0af68; }
        .hljs-selector-id { color: #e0af68; }
        .hljs-selector-tag { color: #f7768e; }
        .hljs-attribute { color: #e0af68; }
        .hljs-symbol { color: #c0caf5; }
        .hljs-bullet { color: #89ddff; }
        .hljs-addition { color: #449dab; }
        .hljs-deletion { color: #914c54; }
        .hljs-link { color: #73daca; text-decoration: underline; }
        .hljs-emphasis { font-style: italic; }
        .hljs-strong { font-weight: 700; }
        .hljs-meta { color: #565f89; }
        .hljs-selector-pseudo { color: #2ac3de; }
      `}</style>
              {response === "" ? (
                <div className="p-[1rem] bg-[#222222] rounded-xl break-words text-lg animate-pulse">
                  {showSearching ? "Searching the web..." : "• • •"}
                </div>
              ) : (
                <div className="p-[1rem] rounded-xl max-w-[100%] space-y-6 leading-loose">
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
                        <pre className="whitespace-pre overflow-x-auto min-w-full" {...props}>
                          {children}
                        </pre>
                      ),
                      li: ({ children, ...props }) => {
                        const hasContent = React.Children.toArray(children).some(child =>
                          typeof child === 'string' ? child.trim() !== '' : true
                        );
                        
                        if (!hasContent) {
                          return null;
                        }

                        return (
                          <li className="flex items-start ml-5 my-2" {...props}>
                            <span className="text-lg text-neutral-300 pr-2 inline-block flex-shrink-0">•</span>
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
                        <strong className='text-neutral-100 md:text-[1.25rem]'>{children}</strong>
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
