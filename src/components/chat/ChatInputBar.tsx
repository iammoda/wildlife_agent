"use client";

import { useState, useRef, useEffect, useCallback, KeyboardEvent } from "react";
import { VoiceRecordButton } from "@/components/voice/VoiceRecordButton";

interface ChatInputBarProps {
  onSendMessage: (message: string) => void;
  onVoiceRecord: (audioBlob: Blob) => void;
  onDocumentCapture: (file: File) => void;
  isProcessing: boolean;
  isWelcomeMode?: boolean;
}

const EXAMPLE_QUESTIONS = [
  "Log a new injured squirrel from Central Park...",
  "What birds did we intake this week?",
  "Add care notes for intake 2024-042...",
  "How many animals are currently under care?",
  "Record a release for the red-tailed hawk...",
  "Show me all pending releases...",
  "Update the weight for the baby raccoon...",
  "What's the status of the opossum from Tuesday?",
];

// Paperclip icon component
function PaperclipIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
    </svg>
  );
}

// Pawprint icon component
function PawprintIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <ellipse cx="12" cy="17" rx="3" ry="2.5" />
      <circle cx="7" cy="12" r="2" />
      <circle cx="17" cy="12" r="2" />
      <circle cx="9" cy="7" r="1.5" />
      <circle cx="15" cy="7" r="1.5" />
    </svg>
  );
}

// Document icon component
function DocumentIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14,2 14,8 20,8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

// Soundwave icon component
function SoundwaveIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      strokeLinecap="round"
    >
      <line x1="4" y1="8" x2="4" y2="16" />
      <line x1="8" y1="6" x2="8" y2="18" />
      <line x1="12" y1="4" x2="12" y2="20" />
      <line x1="16" y1="6" x2="16" y2="18" />
      <line x1="20" y1="8" x2="20" y2="16" />
    </svg>
  );
}

export function ChatInputBar({
  onSendMessage,
  onVoiceRecord,
  onDocumentCapture,
  isProcessing,
  isWelcomeMode = false,
}: ChatInputBarProps) {
  const [message, setMessage] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [displayedPlaceholder, setDisplayedPlaceholder] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentQuestion = EXAMPLE_QUESTIONS[currentQuestionIndex];

  // Typewriter effect for placeholder
  const typeText = useCallback(() => {
    if (!isWelcomeMode) return;
    
    if (isTyping && !isDeleting) {
      if (displayedPlaceholder.length < currentQuestion.length) {
        setDisplayedPlaceholder(currentQuestion.slice(0, displayedPlaceholder.length + 1));
      } else {
        setIsTyping(false);
        setTimeout(() => {
          setIsDeleting(true);
        }, 3000);
      }
    } else if (isDeleting) {
      if (displayedPlaceholder.length > 0) {
        setDisplayedPlaceholder(displayedPlaceholder.slice(0, -1));
      } else {
        setIsDeleting(false);
        setIsTyping(true);
        setCurrentQuestionIndex((prev) => (prev + 1) % EXAMPLE_QUESTIONS.length);
      }
    }
  }, [currentQuestion, displayedPlaceholder, isTyping, isDeleting, isWelcomeMode]);

  useEffect(() => {
    if (!isWelcomeMode) return;
    const typingSpeed = isDeleting ? 25 : 45;
    const timer = setTimeout(typeText, typingSpeed);
    return () => clearTimeout(timer);
  }, [typeText, isDeleting, isWelcomeMode]);

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
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onDocumentCapture(file);
      e.target.value = "";
    }
  };

  const handleNewIntakeClick = () => {
    onSendMessage("I need to log a new intake");
  };

  const handleScanDocumentClick = () => {
    fileInputRef.current?.click();
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  // Welcome mode - centered, polished input (1.5x longer, no divider line)
  if (isWelcomeMode) {
    return (
      <div 
        className="flex flex-col items-center px-4 pb-4 w-full"
        style={{ backgroundColor: "var(--color-bg-primary)" }}
      >
        <div className="w-full max-w-2xl">
          {/* Polished input container - no internal divider */}
          <div 
            className="rounded-2xl transition-all duration-200"
            style={{ 
              backgroundColor: "var(--color-bg-elevated)",
              border: "1px solid var(--color-border)",
              boxShadow: "var(--shadow-md)"
            }}
          >
            {/* Text input area - 1.5x taller */}
            <div className="px-5 pt-5 pb-3">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                onInput={handleInput}
                placeholder={displayedPlaceholder || "How can I help you today?"}
                disabled={isProcessing}
                rows={2}
                className="w-full resize-none bg-transparent focus:outline-none text-[16px] leading-relaxed"
                style={{ 
                  color: "var(--color-text-primary)",
                  minHeight: "52px",
                }}
              />
            </div>
            
            {/* Bottom toolbar - no border/line */}
            <div className="flex items-center justify-between px-3 pb-3">
              {/* Left side - paperclip attachment */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                onClick={handleAttachClick}
                disabled={isProcessing}
                className="p-2 rounded-lg transition-all duration-200 disabled:opacity-50"
                style={{ color: "var(--color-text-muted)" }}
                onMouseOver={(e) => {
                  e.currentTarget.style.color = "var(--color-brand-primary)";
                  e.currentTarget.style.backgroundColor = "var(--color-brand-lighter)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.color = "var(--color-text-muted)";
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
                aria-label="Attach file"
              >
                <PaperclipIcon />
              </button>
              
              {/* Right side - send or soundwave */}
              <div className="flex items-center gap-1">
                {message.trim() ? (
                  <button
                    onClick={handleSend}
                    disabled={isProcessing}
                    className="p-2.5 rounded-xl transition-all duration-200 disabled:opacity-50"
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
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 12h14M12 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                ) : (
                  <VoiceRecordButton
                    onRecordComplete={onVoiceRecord}
                    disabled={isProcessing}
                  />
                )}
              </div>
            </div>
          </div>
          
          {/* Quick action buttons - rounded like chat box (rounded-2xl) */}
          <div className="flex flex-wrap justify-center gap-3 mt-4">
            <button
              onClick={handleNewIntakeClick}
              disabled={isProcessing}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200 border"
              style={{ 
                backgroundColor: "transparent",
                color: "var(--color-brand-primary)",
                borderColor: "var(--color-border)"
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "var(--color-brand-lighter)";
                e.currentTarget.style.borderColor = "var(--color-brand-primary)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.borderColor = "var(--color-border)";
              }}
            >
              <PawprintIcon />
              New Intake
            </button>
            <button
              onClick={handleScanDocumentClick}
              disabled={isProcessing}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200 border"
              style={{ 
                backgroundColor: "transparent",
                color: "var(--color-text-secondary)",
                borderColor: "var(--color-border)"
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "var(--color-brand-lighter)";
                e.currentTarget.style.color = "var(--color-brand-primary)";
                e.currentTarget.style.borderColor = "var(--color-brand-primary)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "var(--color-text-secondary)";
                e.currentTarget.style.borderColor = "var(--color-border)";
              }}
            >
              <DocumentIcon />
              Scan Document
            </button>
            <button
              onClick={() => {
                const voiceBtn = document.querySelector('[aria-label="Start recording"]') as HTMLButtonElement;
                if (voiceBtn) voiceBtn.click();
              }}
              disabled={isProcessing}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200 border"
              style={{ 
                backgroundColor: "transparent",
                color: "var(--color-text-secondary)",
                borderColor: "var(--color-border)"
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "var(--color-brand-lighter)";
                e.currentTarget.style.color = "var(--color-brand-primary)";
                e.currentTarget.style.borderColor = "var(--color-brand-primary)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "var(--color-text-secondary)";
                e.currentTarget.style.borderColor = "var(--color-border)";
              }}
            >
              <SoundwaveIcon />
              Voice Recording
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Chat mode - compact input at bottom (no divider line)
  return (
    <div 
      className="px-4 py-4"
      style={{ backgroundColor: "var(--color-bg-primary)" }}
    >
      <div className="max-w-2xl mx-auto">
        <div 
          className="rounded-2xl transition-all duration-200"
          style={{ 
            backgroundColor: "var(--color-bg-elevated)",
            border: "1px solid var(--color-border)",
            boxShadow: "var(--shadow-md)"
          }}
        >
          {/* Text input */}
          <div className="px-4 pt-4 pb-2">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              onInput={handleInput}
              placeholder="Type a message..."
              disabled={isProcessing}
              rows={1}
              className="w-full resize-none bg-transparent focus:outline-none text-[15px] leading-relaxed max-h-[120px]"
              style={{ 
                color: "var(--color-text-primary)",
              }}
            />
          </div>
          
          {/* Bottom toolbar - no border */}
          <div className="flex items-center justify-between px-3 pb-3">
            {/* Paperclip attachment button */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={handleAttachClick}
              disabled={isProcessing}
              className="p-2 rounded-lg transition-all duration-200 disabled:opacity-50"
              style={{ color: "var(--color-text-muted)" }}
              onMouseOver={(e) => {
                e.currentTarget.style.color = "var(--color-brand-primary)";
                e.currentTarget.style.backgroundColor = "var(--color-brand-lighter)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.color = "var(--color-text-muted)";
                e.currentTarget.style.backgroundColor = "transparent";
              }}
              aria-label="Attach file"
            >
              <PaperclipIcon />
            </button>
            
            <div className="flex items-center gap-1">
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
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
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
    </div>
  );
}
