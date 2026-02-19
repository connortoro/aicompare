"use client"

import { useState, useRef, useEffect } from "react";
import ChatInput from "./components/chat-input";
import Messages from "./components/messages";
import {
  DEFAULT_OPENROUTER_MODELS,
  sanitizeModelList,
} from "@/lib/model-utils";

type Completion = {
  prompt: string,
  response: string
}

const COMPLETIONS_STORAGE_KEY = "completions";
const MODEL_STORAGE_KEY = "model";
const MODEL_LIST_STORAGE_KEY = "modelList";

export default function Home() {
  const [prompt, setPrompt] = useState<string>("")
  const [model, setModel] = useState<string>(DEFAULT_OPENROUTER_MODELS[0])
  const [models, setModels] = useState<string[]>(DEFAULT_OPENROUTER_MODELS)
  const [isStreaming, setIsStreaming] = useState(false)
  const [completions, setCompletions] = useState<Completion[]>([])
  const abortControllerRef = useRef<AbortController | null>(null);


  async function handleSubmit() {
    if(prompt.trim() === "" || isStreaming || !model){
      return
    }
    setIsStreaming(true)

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    const promptToSend = prompt;
    setPrompt("")
    setCompletions(currCompletions => [...currCompletions, {prompt: promptToSend, response: ""}])
    let fullText = ''

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: promptToSend, completions, model }),
        signal,
      });

      if (!response.ok || !response.body) {
        throw new Error("Failed to stream chat response");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done || signal.aborted) {
          break;
        }

        fullText += decoder.decode(value, { stream: true });
        setCompletions(prev => {
          const curr = [...prev]
          curr[curr.length-1].response = fullText
          return curr
        })
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        console.error("Chat request failed:", error);
      }
    } finally {
      setIsStreaming(false)
    }
  }

  function handleClear() {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setCompletions([])
    setIsStreaming(false)
  }

  function handleAddModel(nextModel: string) {
    setModels((currModels) => {
      if (currModels.includes(nextModel)) {
        return currModels;
      }
      return [nextModel, ...currModels];
    });
  }

  function handleDeleteModel(targetModel: string) {
    setModels((currModels) => {
      const nextModels = currModels.filter((currModel) => currModel !== targetModel);
      if (nextModels.length === 0) {
        return DEFAULT_OPENROUTER_MODELS;
      }
      return nextModels;
    });
  }

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    const savedCompletions = localStorage.getItem(COMPLETIONS_STORAGE_KEY);
    if (savedCompletions) {
      setCompletions(JSON.parse(savedCompletions));
    }
    const savedModelListRaw = localStorage.getItem(MODEL_LIST_STORAGE_KEY);
    const parsedModelList = savedModelListRaw ? JSON.parse(savedModelListRaw) : null;
    if (Array.isArray(parsedModelList)) {
      const cleanModelList = sanitizeModelList(parsedModelList);
      if (cleanModelList.length > 0) {
        setModels(cleanModelList);
      }
    }
    const savedModel = localStorage.getItem(MODEL_STORAGE_KEY);
    if(savedModel && sanitizeModelList([savedModel]).length > 0) {
      setModel(savedModel)
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(COMPLETIONS_STORAGE_KEY, JSON.stringify(completions));
  }, [completions]);

  useEffect(() => {
    localStorage.setItem(MODEL_LIST_STORAGE_KEY, JSON.stringify(models));
    if (!models.includes(model)) {
      setModel(models[0] ?? DEFAULT_OPENROUTER_MODELS[0]);
    }
  }, [models, model]);

  useEffect(() => {
    localStorage.setItem(MODEL_STORAGE_KEY, model);
  }, [model]);

  return (
    <div className="flex flex-col justify-start items-center h-full text-neutral-200 w-full bg-neutral-900 ">
      {/* messages section */}
      <Messages completions={completions}/>

      {/* input section */}
      <ChatInput
        prompt={prompt}
        setPrompt={setPrompt}
        onSubmit={handleSubmit}
        onClear={handleClear}
        isStreaming={isStreaming}
        model={model}
        models={models}
        onSelectModel={setModel}
        onDeleteModel={handleDeleteModel}
        onAddModel={handleAddModel}
      />
    </div>
  );
}
