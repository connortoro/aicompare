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
  response: string,
  isStreaming?: boolean,
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
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());

  const currentConversation = conversations.find(c => c.id === currentConversationId);
  const completions = currentConversation?.completions ?? [];
  const isStreaming = completions.some(c => c.isStreaming);

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
    // Note: We no longer abort other conversations' streams
  }

  function handleSelectConversation(id: string) {
    // Note: We no longer abort other conversations' streams when switching
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

  async function handleEditPrompt(index: number, newText: string) {
    if (newText.trim() === "" || !currentConversationId) return;

    // Cancel any in-flight stream for this specific conversation only
    const existingController = abortControllersRef.current.get(currentConversationId);
    if (existingController) {
      existingController.abort();
      abortControllersRef.current.delete(currentConversationId);
    }

    // Slice completions up to (not including) the edited index, then add the edited prompt with empty response
    const slicedCompletions = completions.slice(0, index);
    const newCompletion: Completion = { prompt: newText, response: "", isStreaming: true };

    setConversations(prev => prev.map(c => {
      if (c.id === currentConversationId) {
        return {
          ...c,
          completions: [...slicedCompletions, newCompletion],
          updatedAt: Date.now(),
        };
      }
      return c;
    }));

    // Stream the response for the edited prompt
    const controller = new AbortController();
    abortControllersRef.current.set(currentConversationId, controller);
    const signal = controller.signal;
    let fullText = "";

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: newText, completions: slicedCompletions, model }),
        signal,
      });

      if (!response.ok || !response.body) {
        throw new Error("Failed to stream chat response");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done || signal.aborted) break;

        fullText += decoder.decode(value, { stream: true });
        setConversations(prev => prev.map(c => {
          if (c.id === currentConversationId) {
            const newCompletions = [...c.completions];
            newCompletions[newCompletions.length - 1].response = fullText;
            return { ...c, completions: newCompletions };
          }
          return c;
        }));
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        console.error("Edit prompt request failed:", error);
      }
    } finally {
      // Mark streaming as complete for this completion
      setConversations(prev => prev.map(c => {
        if (c.id === currentConversationId) {
          const newCompletions = [...c.completions];
          if (newCompletions.length > 0) {
            newCompletions[newCompletions.length - 1].isStreaming = false;
          }
          return { ...c, completions: newCompletions };
        }
        return c;
      }));
      abortControllersRef.current.delete(currentConversationId);
    }
  }

  async function handleSubmit() {
    const targetId = currentConversationId || generateId();
    
    // Check if already streaming in this specific conversation
    const targetConv = conversations.find(c => c.id === targetId);
    if (prompt.trim() === "" || targetConv?.completions.some(c => c.isStreaming) || !model) {
      return;
    }

    // Cancel any in-flight stream for this specific conversation only
    const existingController = abortControllersRef.current.get(targetId);
    if (existingController) {
      existingController.abort();
      abortControllersRef.current.delete(targetId);
    }

    const promptToSend = prompt;
    setPrompt("");

    // Create new completion with isStreaming flag
    setConversations(prev => {
      if (!currentConversationId || !prev.find(c => c.id === currentConversationId)) {
        const newConv: Conversation = {
          id: targetId,
          title: generateTitle(promptToSend),
          completions: [{ prompt: promptToSend, response: "", isStreaming: true }],
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
            completions: [...c.completions, { prompt: promptToSend, response: "", isStreaming: true }],
            updatedAt: Date.now(),
          };
        }
        return c;
      });
    });

    // Setup abort controller for this specific conversation
    const controller = new AbortController();
    abortControllersRef.current.set(targetId, controller);
    const signal = controller.signal;
    let fullText = '';

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: promptToSend, completions: targetConv?.completions ?? [], model }),
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
            if (c.id === targetId) {
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
      // Mark streaming as complete for this completion
      setConversations(prev => prev.map(c => {
        if (c.id === targetId) {
          const newCompletions = [...c.completions];
          if (newCompletions.length > 0) {
            newCompletions[newCompletions.length - 1].isStreaming = false;
          }
          return { ...c, completions: newCompletions };
        }
        return c;
      }));
      abortControllersRef.current.delete(targetId);
    }
  }

  function handleClear() {
    if (currentConversationId) {
      // Abort only this conversation's stream
      const controller = abortControllersRef.current.get(currentConversationId);
      if (controller) {
        controller.abort();
        abortControllersRef.current.delete(currentConversationId);
      }
      
      setConversations(prev => prev.map(c => {
        if (c.id === currentConversationId) {
          return { ...c, completions: [] };
        }
        return c;
      }));
    }
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
          <Messages completions={completions} onEditPrompt={handleEditPrompt}/>
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
