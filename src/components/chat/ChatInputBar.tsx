"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { VoiceRecordButton } from "@/components/voice/VoiceRecordButton";
import { DocumentCaptureButton } from "@/components/voice/DocumentCaptureButton";

interface ChatInputBarProps {
  onSendMessage: (message: string) => void;
  onVoiceRecord: (audioBlob: Blob) => void;
  onDocumentCapture: (file: File) => void;
  isProcessing: boolean;
}

export function ChatInputBar({
  onSendMessage,
  onVoiceRecord,
  onDocumentCapture,
  isProcessing,
}: ChatInputBarProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed || isProcessing) return;
    onSendMessage(trimmed);
    setMessage("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  };

  return (
    <div 
      className="px-4 py-4 backdrop-blur-sm"
      style={{ backgroundColor: "var(--color-bg-primary)" }}
    >
      <div className="max-w-2xl mx-auto">
        {/* Claude-style input container */}
        <div 
          className="flex items-end rounded-2xl px-4 py-3 transition-all duration-200"
          style={{ 
            backgroundColor: "var(--color-bg-elevated)",
            border: "1px solid var(--color-border)",
            boxShadow: "var(--shadow-md)"
          }}
        >
          {/* Camera/Document button */}
          <DocumentCaptureButton
            onCapture={onDocumentCapture}
            disabled={isProcessing}
          />
          
          {/* Text input area */}
          <div className="flex-1 mx-3">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              onInput={handleInput}
              placeholder="How can I help you today?"
              disabled={isProcessing}
              rows={1}
              className="w-full resize-none bg-transparent focus:outline-none text-[15px] leading-relaxed max-h-[120px]"
              style={{ 
                color: "var(--color-text-primary)",
              }}
            />
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {message.trim() && (
              <button
                onClick={handleSend}
                disabled={isProcessing}
                className="p-2 rounded-xl transition-all duration-200 disabled:opacity-50"
                style={{ 
                  backgroundColor: "var(--color-brand-primary)",
                  color: "white"
                }}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 12h14M12 5l7 7-7 7"
                  />
                </svg>
              </button>
            )}
            <VoiceRecordButton
              onRecordComplete={onVoiceRecord}
              disabled={isProcessing}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
