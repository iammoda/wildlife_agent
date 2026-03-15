"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChatMessage } from "@/lib/types";
import { ChatMessageBubble } from "./ChatMessageBubble";

interface ChatViewProps {
  messages: ChatMessage[];
  isProcessing: boolean;
  onConfirmIntake: (data: any) => void;
  onEditIntake: (data: any) => void;
  onDiscardIntake?: () => void;
  onSelectSpecies?: (species: string) => void;
  onEditExistingIntake?: (data: any) => void;
  onConfirmDelete?: (recordType: "intake" | "care_log", id: string, name: string) => void;
  onCancelDelete?: () => void;
  onAddCareLog?: (intakeNumber: string) => void;
  onDeleteIntake?: (intake: any) => void;
  onEditCareLog?: (log: any) => void;
  onDeleteCareLog?: (logId: string) => void;
  onUndoCareLog?: (logId: string) => void;
  onViewAnimal?: (intakeNumber: string) => void;
}

export function ChatView({
  messages,
  isProcessing,
  onConfirmIntake,
  onEditIntake,
  onDiscardIntake,
  onSelectSpecies,
  onEditExistingIntake,
  onConfirmDelete,
  onCancelDelete,
  onAddCareLog,
  onDeleteIntake,
  onEditCareLog,
  onDeleteCareLog,
  onUndoCareLog,
  onViewAnimal,
}: ChatViewProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const checkIfNearBottom = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const threshold = 150;
    const nearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
    isNearBottomRef.current = nearBottom;
    setShowScrollButton(!nearBottom);
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (isNearBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } else {
      setShowScrollButton(true);
    }
  }, [messages, isProcessing]);

  // Empty state is now handled by WelcomeView
  if (messages.length === 0) {
    return null;
  }

  return (
    <div
      ref={scrollContainerRef}
      onScroll={checkIfNearBottom}
      className="flex-1 overflow-y-auto px-4 py-6 relative"
      style={{ backgroundColor: "var(--color-bg-primary)" }}
    >
      <div className="max-w-2xl mx-auto space-y-4">
        {messages.map((message) => (
          <ChatMessageBubble
            key={message.id}
            message={message}
            isProcessing={isProcessing}
            onConfirmIntake={onConfirmIntake}
            onEditIntake={onEditIntake}
            onDiscardIntake={onDiscardIntake}
            onSelectSpecies={onSelectSpecies}
            onEditExistingIntake={onEditExistingIntake}
            onConfirmDelete={onConfirmDelete}
            onCancelDelete={onCancelDelete}
            onAddCareLog={onAddCareLog}
            onDeleteIntake={onDeleteIntake}
            onEditCareLog={onEditCareLog}
            onDeleteCareLog={onDeleteCareLog}
            onUndoCareLog={onUndoCareLog}
            onViewAnimal={onViewAnimal}
          />
        ))}
        {isProcessing && (
          <div className="flex items-start">
            <div 
              className="rounded-2xl rounded-bl-md px-4 py-3"
              style={{ backgroundColor: "var(--color-bubble-assistant)" }}
            >
              <div className="flex gap-1.5">
                <span
                  className="w-2 h-2 rounded-full animate-bounce"
                  style={{ backgroundColor: "var(--color-brand-primary)", animationDelay: "0ms" }}
                />
                <span
                  className="w-2 h-2 rounded-full animate-bounce"
                  style={{ backgroundColor: "var(--color-brand-primary)", opacity: 0.7, animationDelay: "150ms" }}
                />
                <span
                  className="w-2 h-2 rounded-full animate-bounce"
                  style={{ backgroundColor: "var(--color-brand-primary)", opacity: 0.4, animationDelay: "300ms" }}
                />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="sticky bottom-4 left-1/2 -translate-x-1/2 z-10 px-3 py-1.5 rounded-full text-xs font-medium transition-all shadow-md"
          style={{
            backgroundColor: "var(--color-bg-elevated)",
            color: "var(--color-text-secondary)",
            border: "1px solid var(--color-border)",
          }}
        >
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            New messages
          </span>
        </button>
      )}
    </div>
  );
}
