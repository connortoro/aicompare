"use client"

import { useState, useRef, useEffect } from "react";
import ChatInput from "./components/chat-input";
import Messages from "./components/messages";
import Sidebar from "./components/sidebar";
import {
  DEFAULT_OPENROUTER_MODELS,
  sanitizeModelList,
} from "@/lib/model-utils";

type Completion = {
  prompt: string,
  response: string
}

type Conversation = {
  id: string;
  title: string;
  completions: Completion[];
  updatedAt: number;
}

const CONVERSATIONS_STORAGE_KEY = "conversations";
const CURRENT_CONVERSATION_ID_KEY = "currentConversationId";
const MODEL_STORAGE_KEY = "model";
const MODEL_LIST_STORAGE_KEY = "modelList";

export default function Home() {
  const [prompt, setPrompt] = useState<string>("")
  const [model, setModel] = useState<string>(DEFAULT_OPENROUTER_MODELS[0])
  const [models, setModels] = useState<string[]>(DEFAULT_OPENROUTER_MODELS)
  const [isStreaming, setIsStreaming] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const abortControllerRef = useRef<AbortController | null>(null);

  const currentConversation = conversations.find(c => c.id === currentConversationId);
  const completions = currentConversation?.completions ?? [];

  function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  function generateTitle(prompt: string): string {
    return prompt.slice(0, 50) + (prompt.length > 50 ? "..." : "");
  }

  function handleNewConversation() {
    const newConversation: Conversation = {
      id: generateId(),
      title: "New conversation",
      completions: [],
      updatedAt: Date.now(),
    };
    setConversations(prev => [newConversation, ...prev]);
    setCurrentConversationId(newConversation.id);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  }

  function handleSelectConversation(id: string) {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    setCurrentConversationId(id);
  }

  function handleDeleteConversation(id: string) {
    setConversations(prev => {
      const filtered = prev.filter(c => c.id !== id);
      if (currentConversationId === id) {
        const next = filtered[0] ?? null;
        setCurrentConversationId(next?.id ?? null);
      }
      return filtered;
    });
  }

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

    setConversations(prev => {
      let targetId = currentConversationId;
      
      if (!targetId || !prev.find(c => c.id === targetId)) {
        const newConv: Conversation = {
          id: generateId(),
          title: generateTitle(promptToSend),
          completions: [{ prompt: promptToSend, response: "" }],
          updatedAt: Date.now(),
        };
        setCurrentConversationId(newConv.id);
        return [newConv, ...prev];
      }

      return prev.map(c => {
        if (c.id === targetId) {
          return {
            ...c,
            title: c.completions.length === 0 ? generateTitle(promptToSend) : c.title,
            completions: [...c.completions, { prompt: promptToSend, response: "" }],
            updatedAt: Date.now(),
          };
        }
        return c;
      });
    });

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
        setConversations(prev => {
          return prev.map(c => {
            if (c.id === currentConversationId) {
              const newCompletions = [...c.completions];
              newCompletions[newCompletions.length - 1].response = fullText;
              return { ...c, completions: newCompletions };
            }
            return c;
          });
        });
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
    
    if (currentConversationId) {
      setConversations(prev => prev.map(c => {
        if (c.id === currentConversationId) {
          return { ...c, completions: [] };
        }
        return c;
      }));
    }
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
    const savedConversations = localStorage.getItem(CONVERSATIONS_STORAGE_KEY);
    if (savedConversations) {
      const parsed = JSON.parse(savedConversations);
      if (Array.isArray(parsed)) {
        setConversations(parsed);
      }
    }
    const savedCurrentId = localStorage.getItem(CURRENT_CONVERSATION_ID_KEY);
    if (savedCurrentId) {
      setCurrentConversationId(savedCurrentId);
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
    localStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    if (currentConversationId) {
      localStorage.setItem(CURRENT_CONVERSATION_ID_KEY, currentConversationId);
    }
  }, [currentConversationId]);

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
    <div className="flex flex-row h-full w-full bg-neutral-900">
      <Sidebar
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <div className={`dot-grid-bg relative flex flex-col h-full text-neutral-200 flex-1 overflow-hidden transition-all duration-300 ${sidebarOpen ? "pl-0" : ""}`}>
        <div className="flex-1 overflow-y-auto relative z-10">
          <Messages completions={completions}/>
        </div>
        <div className="flex justify-center pb-0">
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
      </div>
    </div>
  );
}
