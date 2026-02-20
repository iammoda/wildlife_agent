"use client";

import { useEffect, useRef } from "react";
import { ChatMessage } from "@/lib/types";
import { ChatMessageBubble } from "./ChatMessageBubble";
import { SquirrelLogo } from "@/components/ui/SquirrelLogo";

interface ChatViewProps {
  messages: ChatMessage[];
  isProcessing: boolean;
  onConfirmIntake: (data: any) => void;
  onEditIntake: (data: any) => void;
  onEditExistingIntake?: (data: any) => void;
  onConfirmDelete?: (recordType: "intake" | "care_log", id: string, name: string) => void;
  onCancelDelete?: () => void;
  onAddCareLog?: (intakeNumber: string) => void;
  onDeleteIntake?: (intake: any) => void;
  onEditCareLog?: (log: any) => void;
  onDeleteCareLog?: (logId: string) => void;
  onUndoCareLog?: (logId: string) => void;
}

export function ChatView({
  messages,
  isProcessing,
  onConfirmIntake,
  onEditIntake,
  onEditExistingIntake,
  onConfirmDelete,
  onCancelDelete,
  onAddCareLog,
  onDeleteIntake,
  onEditCareLog,
  onDeleteCareLog,
  onUndoCareLog,
}: ChatViewProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isProcessing]);

  // Empty state is now handled by WelcomeView
  if (messages.length === 0) {
    return null;
  }

  return (
    <div 
      className="flex-1 overflow-y-auto px-4 py-6"
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
            onEditExistingIntake={onEditExistingIntake}
            onConfirmDelete={onConfirmDelete}
            onCancelDelete={onCancelDelete}
            onAddCareLog={onAddCareLog}
            onDeleteIntake={onDeleteIntake}
            onEditCareLog={onEditCareLog}
            onDeleteCareLog={onDeleteCareLog}
            onUndoCareLog={onUndoCareLog}
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
    </div>
  );
}
