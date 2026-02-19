"use client";

import { ReactElement, useMemo, useState } from "react";
import { BiBot, BiPlus, BiX } from "react-icons/bi";
import { FaCaretDown, FaCaretUp, FaGoogle } from "react-icons/fa";
import { SiClaude, SiMeta, SiOpenai } from "react-icons/si";
import {
  formatModelDisplayName,
  inferProviderFromModelCode,
  isValidModelCode,
  normalizeModelCode,
} from "@/lib/model-utils";

type ModelSelectorProps = {
  selectedModel: string;
  models: string[];
  isOpen: boolean;
  onToggleOpen: () => void;
  onSelectModel: (model: string) => void;
  onDeleteModel: (model: string) => void;
  onAddModel: (model: string) => void;
};

const iconMap: Record<string, ReactElement> = {
  openai: <SiOpenai className="text-base" />,
  anthropic: <SiClaude className="text-base" />,
  google: <FaGoogle className="text-base" />,
  meta: <SiMeta className="text-base" />,
  unknown: <BiBot className="text-lg" />,
};

export default function ModelSelector({
  selectedModel,
  models,
  isOpen,
  onToggleOpen,
  onSelectModel,
  onDeleteModel,
  onAddModel,
}: ModelSelectorProps) {
  const [newModelInput, setNewModelInput] = useState("");
  const [inputError, setInputError] = useState("");

  const selectedModelLabel = selectedModel
    ? formatModelDisplayName(selectedModel)
    : "Select Model";
  const selectedProvider = inferProviderFromModelCode(selectedModel);
  const selectedIcon = iconMap[selectedProvider] ?? iconMap.unknown;

  const sortedModels = useMemo(() => [...models], [models]);

  function handleAddModel() {
    const normalized = normalizeModelCode(newModelInput);
    if (!normalized) {
      return;
    }

    if (!isValidModelCode(normalized)) {
      setInputError("Use provider/model format, e.g. anthropic/claude-sonnet-4.5");
      return;
    }

    setInputError("");
    onAddModel(normalized);
    onSelectModel(normalized);
    setNewModelInput("");
  }

  return (
    <div className="relative text-md rounded-xl font-semibold">
      <button
        onClick={onToggleOpen}
        className="hover:cursor-pointer min-w-[14.5rem] h-[2.75rem] text-sm text-neutral-300 grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl px-3 bg-neutral-800/80 border border-neutral-700/60"
      >
        <div className="flex flex-row items-center justify-start">
          {selectedIcon}
        </div>
        <span className="truncate text-center">{selectedModelLabel}</span>
        <div className="justify-self-end">
          {isOpen ? (
            <FaCaretUp className="text-xl text-neutral-400" />
          ) : (
            <FaCaretDown className="text-xl text-neutral-400" />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="flex flex-col items-start absolute bottom-full w-[27rem] bg-neutral-800/95 backdrop-blur-lg mb-[0.9rem] p-[1rem] left-0 rounded-2xl border border-neutral-700/60 shadow-2xl">
          <div className="w-full flex flex-row items-center gap-2">
            <input
              value={newModelInput}
              onChange={(e) => setNewModelInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddModel();
                }
              }}
              placeholder="openai/gpt-5 or anthropic/claude-sonnet-4.5..."
              className="w-full bg-neutral-900/80 rounded-lg p-2.5 text-sm font-normal text-neutral-200 focus:outline-none focus:ring-1 ring-neutral-500"
            />
            <button
              onClick={handleAddModel}
              className="h-[2.6rem] w-[2.6rem] shrink-0 flex items-center justify-center rounded-lg bg-neutral-700 hover:bg-neutral-600"
              aria-label="Add model"
            >
              <BiPlus className="text-xl" />
            </button>
          </div>
          {inputError ? (
            <div className="text-xs text-red-300 mt-2 font-normal">{inputError}</div>
          ) : null}

          <div className="w-full mt-3 max-h-[18rem] overflow-y-auto space-y-2 model-scrollbar pr-1">
            {sortedModels.map((model) => {
              const provider = inferProviderFromModelCode(model);
              const icon = iconMap[provider] ?? iconMap.unknown;
              const displayName = formatModelDisplayName(model);

              return (
                <div
                  key={model}
                  className={`w-full p-2.5 rounded-lg ${
                    selectedModel === model ? "bg-neutral-700/90" : "bg-neutral-900/30 hover:bg-neutral-700/60"
                  }`}
                >
                  <div className="flex flex-row justify-between items-center gap-2">
                    <button
                      onClick={() => onSelectModel(model)}
                      className="flex flex-row items-center gap-2 truncate text-left min-w-0 grow hover:cursor-pointer"
                    >
                      {icon}
                      <div className="flex flex-col min-w-0">
                        <span className="truncate text-sm font-medium">{displayName}</span>
                        <span className="truncate text-xs text-neutral-400 font-normal">{model}</span>
                      </div>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteModel(model);
                      }}
                      className="h-8 w-8 shrink-0 flex items-center justify-center rounded hover:bg-neutral-600"
                      aria-label={`Delete ${model}`}
                    >
                      <BiX className="text-lg text-neutral-300" />
                    </button>
                  </div>
                </div>
              );
            })}
            {sortedModels.length === 0 ? (
              <div className="text-xs text-neutral-400 font-normal">
                Add a model code to get started.
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

