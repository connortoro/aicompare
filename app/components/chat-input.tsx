"use client";

import { Dispatch, SetStateAction, useState } from "react";
import { BiTrash } from "react-icons/bi";
import { FaArrowUp } from "react-icons/fa";
import ModelSelector from "./model-selector";

type ChatInputProps = {
  prompt: string;
  setPrompt: Dispatch<SetStateAction<string>>;
  onSubmit: () => void;
  onClear: () => void;
  isStreaming: boolean;
  model: string;
  models: string[];
  onSelectModel: (model: string) => void;
  onDeleteModel: (model: string) => void;
  onAddModel: (model: string) => void;
};

export default function ChatInput({
  prompt,
  setPrompt,
  onSubmit,
  onClear,
  isStreaming,
  model,
  models,
  onSelectModel,
  onDeleteModel,
  onAddModel,
}: ChatInputProps) {
  const [selectingModel, setSelectingModel] = useState(false);

  return (
    <div className="flex flex-col max-w-[62rem] w-[93%] space-y-4 justify-center items-center bg-[#212121]/60 backdrop-blur-xl rounded-t-[1rem] px-5 pt-5 font-normal border-x-2 border-t-2 border-white/5 shrink-0 translate-z-0">
      <div className="flex flex-row justify-around items-center space-x-4 w-full">
        <ModelSelector
          selectedModel={model}
          models={models}
          isOpen={selectingModel}
          onToggleOpen={() => setSelectingModel((curr) => !curr)}
          onSelectModel={(nextModel) => {
            onSelectModel(nextModel);
            setSelectingModel(false);
          }}
          onDeleteModel={onDeleteModel}
          onAddModel={onAddModel}
        />

        <textarea
          value={prompt}
          onClick={() => setSelectingModel(false)}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSubmit();
            }
          }}
          className="bg-neutral-900/40 resize-none w-full mr-5 min-h-[8rem] rounded-t-xl p-4 text-base focus:outline-none border-x-1 border-t-1 border-white/5 shadow-inner focus:border-white/10 focus:bg-neutral-900/60 placeholder:text-neutral-500"
        />
        <div className="space-y-2 text-base flex flex-col items-center justify-center">
          <button
            onClick={onSubmit}
            disabled={isStreaming}
            className="h-12 w-12 flex items-center justify-center text-neutral-200 bg-neutral-900/40 rounded-2xl border border-white/5 hover:border-white/10 hover:bg-neutral-900/60 hover:cursor-pointer text-md disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            <FaArrowUp />
          </button>
          <button
            onClick={onClear}
            className="h-12 w-12 flex items-center justify-center text-neutral-400 text-xl bg-neutral-900/40 rounded-2xl border border-white/5 hover:border-white/10 hover:text-neutral-200 hover:bg-neutral-900/60 hover:cursor-pointer transition-all shadow-sm"
          >
            <BiTrash />
          </button>
        </div>
      </div>
    </div>
  );
}

