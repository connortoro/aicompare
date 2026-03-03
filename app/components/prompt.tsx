"use client"
import { useState, useRef, useEffect } from "react"
import { FaCheck, FaRegCopy, FaPen, FaArrowUp } from "react-icons/fa"
import { BiTrash } from "react-icons/bi"

type PromptProps = {
  prompt: string
  onEdit: (newText: string) => void
}

export default function Prompt({ prompt, onEdit }: PromptProps) {
  const [promptCopied, setPromptCopied] = useState(false)
  const [copyShowing, setCopyShowing] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(prompt)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function handlePromptCopy(text: string) {
    setPromptCopied(true)
    navigator.clipboard.writeText(text)
    setTimeout(() => {
      setPromptCopied(false)
    }, 500);
  }

  function buttonColor() {
    if (copyShowing) return 'text-neutral-400'
    else return 'text-transparent'
  }

  function handleEditClick() {
    setEditText(prompt)
    setIsEditing(true)
  }

  function handleCancel() {
    setIsEditing(false)
    setEditText(prompt)
  }

  function handleSend() {
    const trimmed = editText.trim()
    if (!trimmed) return
    setIsEditing(false)
    onEdit(trimmed)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
    if (e.key === "Escape") {
      handleCancel()
    }
  }

  // Auto-resize textarea and focus when editing starts
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      const el = textareaRef.current
      el.focus()
      el.selectionStart = el.selectionEnd = el.value.length
      el.style.height = "auto"
      el.style.height = el.scrollHeight + "px"
    }
  }, [isEditing])

  function handleTextareaInput() {
    const el = textareaRef.current
    if (el) {
      el.style.height = "auto"
      el.style.height = el.scrollHeight + "px"
    }
  }

  if (isEditing) {
    return (
      <div className="flex flex-col items-end w-full mb-2">
        <div className="flex flex-col w-full max-w-[65%] bg-[#222222] rounded-xl p-[1rem] gap-2">
          <textarea
            ref={textareaRef}
            value={editText}
            onChange={e => setEditText(e.target.value)}
            onInput={handleTextareaInput}
            onKeyDown={handleKeyDown}
            rows={1}
            className="w-full bg-transparent text-neutral-200 resize-none outline-none whitespace-pre-wrap break-words overflow-hidden leading-relaxed"
          />
          <div className="flex flex-row gap-2 justify-end">
            <button
              onClick={handleCancel}
              title="Cancel"
              className="h-8 w-8 flex items-center justify-center text-neutral-400 text-lg bg-neutral-900/40 rounded-xl border border-white/5 hover:border-white/10 hover:text-neutral-200 hover:bg-neutral-700 hover:cursor-pointer transition-all"
            >
              <BiTrash />
            </button>
            <button
              onClick={handleSend}
              disabled={!editText.trim()}
              title="Send"
              className="h-8 w-8 flex items-center justify-center text-neutral-200 bg-neutral-900/40 rounded-xl border border-white/5 hover:border-white/10 hover:bg-neutral-700 hover:cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FaArrowUp />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="flex flex-col items-end w-full mb-2"
      onMouseOver={() => setCopyShowing(true)}
      onMouseOut={() => setCopyShowing(false)}
    >
      <div className="p-[1rem] bg-[#222222] rounded-xl break-words max-w-[65%] whitespace-pre-wrap h-full">
        {prompt}
      </div>
      <div className="flex flex-row gap-1">
        <button
          onClick={handleEditClick}
          onMouseOver={() => setCopyShowing(true)}
          onMouseOut={() => setCopyShowing(false)}
          className={"text-sm text-neutral-400 rounded hover:bg-neutral-700 p-2 mt-[5px] hover:cursor-pointer " + buttonColor()}
          title="Edit message"
        >
          <FaPen />
        </button>
        <button
          onClick={() => handlePromptCopy(prompt)}
          onMouseOver={() => setCopyShowing(true)}
          onMouseOut={() => setCopyShowing(false)}
          className={"text-base text-neutral-400 rounded hover:bg-neutral-700 p-2 mt-[5px] hover:cursor-pointer " + buttonColor()}
        >
          {promptCopied ? <FaCheck className='text-[#98C379]' /> : <FaRegCopy />}
        </button>
      </div>
    </div>
  );
}
