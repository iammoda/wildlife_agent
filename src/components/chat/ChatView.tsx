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
}

export function ChatView({
  messages,
  isProcessing,
  onConfirmIntake,
  onEditIntake,
}: ChatViewProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isProcessing]);

  if (messages.length === 0) {
    return (
      <div 
        className="flex-1 flex flex-col items-center justify-center px-4 py-8"
        style={{ backgroundColor: "var(--color-bg-primary)" }}
      >
        {/* Green tinted squirrel icon */}
        <div 
          className="mb-8 p-4 rounded-full"
          style={{ 
            backgroundColor: "var(--color-brand-light)",
            color: "var(--color-brand-primary)"
          }}
        >
          <SquirrelLogo size={56} />
        </div>
        
        {/* Welcome heading - Claude-style serif font */}
        <h2 
          className="text-2xl font-title font-semibold mb-3"
          style={{ color: "var(--color-text-primary)" }}
        >
          Welcome to Wildlife Intake
        </h2>
        
        {/* Subtitle */}
        <p 
          className="text-center max-w-md mb-8 leading-relaxed"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Record your first intake by speaking, typing, or scanning a paper
          form. I&apos;m here to help!
        </p>
        
        {/* Quick action pills - Claude-style */}
        <div className="flex flex-wrap justify-center gap-2">
          <span 
            className="px-4 py-2 rounded-full text-sm font-medium cursor-default"
            style={{ 
              backgroundColor: "var(--color-brand-light)",
              color: "var(--color-brand-primary)"
            }}
          >
            New Intake
          </span>
          <span 
            className="px-4 py-2 rounded-full text-sm font-medium cursor-default"
            style={{ 
              backgroundColor: "var(--color-bg-tertiary)",
              color: "var(--color-text-secondary)"
            }}
          >
            Scan Document
          </span>
          <span 
            className="px-4 py-2 rounded-full text-sm font-medium cursor-default"
            style={{ 
              backgroundColor: "var(--color-bg-tertiary)",
              color: "var(--color-text-secondary)"
            }}
          >
            Voice Recording
          </span>
        </div>
      </div>
    );
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
            onConfirmIntake={onConfirmIntake}
            onEditIntake={onEditIntake}
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
