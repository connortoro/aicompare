"use client";

import { BiPlus, BiTrash, BiMenu, BiX } from "react-icons/bi";

type Completion = {
  prompt: string;
  response: string;
};

type Conversation = {
  id: string;
  title: string;
  completions: Completion[];
  updatedAt: number;
};

type SidebarProps = {
  conversations: Conversation[];
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  isOpen: boolean;
  onToggle: () => void;
};

export default function Sidebar({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  isOpen,
  onToggle,
}: SidebarProps) {
  return (
    <>
      <div
        className={`flex flex-col bg-neutral-900/95 border-r-2 border-neutral-800/30 outline-1 outline-neutral-800/30 transition-all duration-300 ease-in-out ${
          isOpen ? "w-72" : "w-0 overflow-hidden"
        }`}
      >
        <div className="relative flex items-center justify-center p-4 border-b-2 border-neutral-800/30">
          <span className="font-[var(--font-syne)] font-extrabold text-xl tracking-tight text-neutral-200">torochat</span>
          <button
            onClick={onToggle}
            className="absolute right-4 p-1.5 text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 rounded-md"
            title="Close sidebar"
          >
            <BiX className="text-lg" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-2 flex justify-center">
              <button
                onClick={onNewConversation}
                className="flex items-center gap-2 p-3 text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 rounded-lg text-sm"
              >
                <BiPlus className="text-lg" />
                <span>New conversation</span>
              </button>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => onSelectConversation(conversation.id)}
                  className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer ${
                    conversation.id === currentConversationId
                      ? "bg-neutral-800 text-neutral-200"
                      : "text-neutral-500 hover:bg-neutral-800/60 hover:text-neutral-300"
                  }`}
                >
                  <div className="flex-1 min-w-0 mr-2">
                    <p className="text-sm truncate">{conversation.title}</p>
                    <p className="text-xs text-neutral-600 truncate">
                      {conversation.completions.length} messages
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteConversation(conversation.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-neutral-600 hover:text-red-400"
                    title="Delete conversation"
                  >
                    <BiTrash className="text-lg" />
                  </button>
                </div>
              ))}
              <button
                onClick={onNewConversation}
                className="w-full flex items-center justify-center gap-2 p-3 text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 rounded-lg text-sm mt-1"
              >
                <BiPlus className="text-lg" />
                <span>New conversation</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {!isOpen && (
        <button
          onClick={onToggle}
          className="fixed top-4 left-4 z-50 p-2 text-neutral-500 hover:text-neutral-300 bg-neutral-800/60 hover:bg-neutral-800 rounded-lg"
          title="Open sidebar"
        >
          <BiMenu className="text-xl" />
        </button>
      )}
    </>
  );
}
