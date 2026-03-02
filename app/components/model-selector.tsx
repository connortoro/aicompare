"use client";

import { ReactElement, useMemo, useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { BiBot, BiPlus, BiX } from "react-icons/bi";
import { FaCaretDown, FaCaretUp } from "react-icons/fa";
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

const GoogleLogo = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const GoogleLogoNeutral = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 text-neutral-400" aria-hidden="true">
    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const iconMapColored: Record<string, ReactElement> = {
  openai: <SiOpenai className="text-xl text-[#10A37F]" />,
  anthropic: <SiClaude className="text-xl text-[#D97756]" />,
  google: <GoogleLogo />,
  meta: <SiMeta className="text-xl text-blue-500" />,
  unknown: <BiBot className="text-xl text-neutral-400" />,
};

const iconMapNeutral: Record<string, ReactElement> = {
  openai: <SiOpenai className="text-xl" />,
  anthropic: <SiClaude className="text-xl" />,
  google: <GoogleLogoNeutral />,
  meta: <SiMeta className="text-xl" />,
  unknown: <BiBot className="text-xl" />,
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
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.top - 8, // Position above with small gap
        left: rect.left,
        width: rect.width,
      });
    }
  }, [isOpen]);

  const selectedModelLabel = selectedModel
    ? formatModelDisplayName(selectedModel)
    : "Select Model";
  const selectedProvider = inferProviderFromModelCode(selectedModel);
  const selectedIcon = iconMapNeutral[selectedProvider] ?? iconMapNeutral.unknown;

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

  const dropdownContent = isOpen && (
    <div 
      className="fixed z-[9999]"
      style={{
        bottom: `${window.innerHeight - dropdownPosition.top}px`,
        left: `${dropdownPosition.left}px`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex flex-col items-start w-[27rem] bg-neutral-800 mb-[0.9rem] p-[1rem] rounded-2xl border border-neutral-700/60 shadow-2xl">
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
            const icon = iconMapColored[provider] ?? iconMapColored.unknown;
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
    </div>
  );

  return (
    <div className="relative text-md rounded-xl font-semibold">
      <button
        ref={buttonRef}
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

      {dropdownContent && createPortal(dropdownContent, document.body)}
    </div>
  );
}
