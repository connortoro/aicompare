import { useState } from "react"
import { FaCheck, FaRegCopy } from "react-icons/fa"

type PromptProps = {
  prompt: string
}

export default function Prompt({ prompt }: PromptProps) {
  const [promptCopied, setPromptCopied] = useState(false)
  function handlePromptCopy(text: string) {
    setPromptCopied(true)
    navigator.clipboard.writeText(text)
    setTimeout(() => {
      setPromptCopied(false)
    }, 500);
  }

  const [copyShowing, setCopyShowing] = useState(false)
  function buttonColor() {
    if(copyShowing) {
      return 'text-neutral-400'
    } else{
      return 'text-transparent'
    }
  }

  return (
    <div className="flex flex-col items-end w-full mb-2" onMouseOver={() => setCopyShowing(true)} onMouseOut={() => setCopyShowing(false)}>
      <div className="p-[1rem] bg-[#222222] rounded-xl break-words lg:text-lg text-md max-w-[70%] whitespace-pre-wrap h-full">
        {prompt}
      </div>
      <button
        onClick={() => handlePromptCopy(prompt)}
        onMouseOver={() => setCopyShowing(true)}
        onMouseOut={() => setCopyShowing(false)}
        className={"text-lg text-neutral-400 rounded hover:bg-neutral-700 p-2 mt-[5px] hover:cursor-pointer " + buttonColor()}
      > {/* Remove relative, top-full, and right-10 */}
        {promptCopied ? <FaCheck className='text-[#98C379]' /> : <FaRegCopy />}
      </button>
    </div>
  );

}
