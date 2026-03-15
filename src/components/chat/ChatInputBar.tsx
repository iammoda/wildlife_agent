"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { VoiceRecordButton } from "@/components/voice/VoiceRecordButton";
import { DOCUMENT_UPLOAD_ACCEPT } from "@/lib/document-upload";

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

function PlusIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function FilesIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2V7z" />
      <path d="M8 12h8" />
      <path d="M8 16h5" />
    </svg>
  );
}

function ScreenshotIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="5" width="18" height="12" rx="2" />
      <path d="M7 19h10" />
      <path d="M12 17v2" />
    </svg>
  );
}

function PawprintIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <ellipse cx="12" cy="17" rx="3" ry="2.5" />
      <circle cx="7" cy="12" r="2" />
      <circle cx="17" cy="12" r="2" />
      <circle cx="9" cy="7" r="1.5" />
      <circle cx="15" cy="7" r="1.5" />
    </svg>
  );
}

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

function getScreenshotErrorMessage(error: unknown): string {
  if (
    error instanceof DOMException &&
    (error.name === "AbortError" || error.name === "NotAllowedError")
  ) {
    return "Screenshot capture was cancelled.";
  }

  if (
    error instanceof DOMException &&
    (error.name === "NotFoundError" || error.name === "NotReadableError")
  ) {
    return "Unable to capture a screenshot from this browser session.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to capture a screenshot right now.";
}

async function captureScreenshotFile(): Promise<File> {
  if (!navigator.mediaDevices?.getDisplayMedia) {
    throw new Error("Screenshot capture is not supported in this browser.");
  }

  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: true,
    audio: false,
  });

  try {
    const video = document.createElement("video");
    video.srcObject = stream;
    video.muted = true;
    video.playsInline = true;

    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error("Failed to prepare screenshot capture."));
    });

    await video.play();
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });

    const width = video.videoWidth;
    const height = video.videoHeight;

    if (!width || !height) {
      throw new Error("Failed to read the captured screen.");
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Failed to prepare screenshot capture.");
    }

    context.drawImage(video, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/png");
    });

    if (!blob) {
      throw new Error("Failed to capture the screenshot.");
    }

    return new File([blob], `screenshot-${Date.now()}.png`, {
      type: "image/png",
    });
  } finally {
    stream.getTracks().forEach((track) => track.stop());
  }
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
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachmentMenuRef = useRef<HTMLDivElement>(null);

  const currentQuestion = EXAMPLE_QUESTIONS[currentQuestionIndex];

  const closeAttachmentMenu = useCallback(() => {
    setIsAttachmentMenuOpen(false);
  }, []);

  const clearAttachmentError = useCallback(() => {
    setAttachmentError(null);
  }, []);

  const typeText = useCallback(() => {
    if (!isWelcomeMode) return;

    if (isTyping && !isDeleting) {
      if (displayedPlaceholder.length < currentQuestion.length) {
        setDisplayedPlaceholder(
          currentQuestion.slice(0, displayedPlaceholder.length + 1)
        );
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

  useEffect(() => {
    if (!isAttachmentMenuOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!attachmentMenuRef.current?.contains(event.target as Node)) {
        closeAttachmentMenu();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeAttachmentMenu();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [closeAttachmentMenu, isAttachmentMenuOpen]);

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed || isProcessing) return;

    clearAttachmentError();
    onSendMessage(trimmed);
    setMessage("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: ReactKeyboardEvent<HTMLTextAreaElement>) => {
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
    e.target.value = "";

    if (!file) return;

    clearAttachmentError();
    closeAttachmentMenu();
    onDocumentCapture(file);
  };

  const openUploadPicker = () => {
    clearAttachmentError();
    closeAttachmentMenu();
    fileInputRef.current?.click();
  };

  const handleTakeScreenshot = async () => {
    clearAttachmentError();
    closeAttachmentMenu();

    try {
      const file = await captureScreenshotFile();
      onDocumentCapture(file);
    } catch (error) {
      setAttachmentError(getScreenshotErrorMessage(error));
    }
  };

  const handleNewIntakeClick = () => {
    clearAttachmentError();
    onSendMessage("I need to log a new intake");
  };

  const handleScanDocumentClick = () => {
    openUploadPicker();
  };

  const handleAttachmentMenuToggle = () => {
    clearAttachmentError();
    setIsAttachmentMenuOpen((prev) => !prev);
  };

  const attachmentMenu = (
    <div className="relative" ref={attachmentMenuRef}>
      <input
        ref={fileInputRef}
        type="file"
        accept={DOCUMENT_UPLOAD_ACCEPT}
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        onClick={handleAttachmentMenuToggle}
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
        aria-label="Open attachment menu"
        aria-haspopup="menu"
        aria-expanded={isAttachmentMenuOpen}
      >
        <PlusIcon />
      </button>

      {isAttachmentMenuOpen && (
        <div
          className="absolute bottom-full left-0 z-20 mb-2 w-64 rounded-2xl border p-2 shadow-xl backdrop-blur-sm"
          style={{
            backgroundColor: "var(--color-bg-elevated)",
            borderColor: "var(--color-border-light)",
          }}
          role="menu"
        >
          <button
            onClick={openUploadPicker}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition-colors"
            style={{ color: "var(--color-text-primary)" }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "var(--color-bg-tertiary)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
            role="menuitem"
          >
            <FilesIcon />
            Add files or photos
          </button>
          <button
            onClick={handleTakeScreenshot}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition-colors"
            style={{ color: "var(--color-text-primary)" }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "var(--color-bg-tertiary)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
            role="menuitem"
          >
            <ScreenshotIcon />
            Take a screenshot
          </button>
        </div>
      )}
    </div>
  );

  const attachmentErrorMessage = attachmentError ? (
    <p
      className="mt-3 px-1 text-sm"
      style={{ color: "var(--color-error)" }}
      role="status"
    >
      {attachmentError}
    </p>
  ) : null;

  if (isWelcomeMode) {
    return (
      <div
        className="flex flex-col items-center px-4 pb-4 w-full"
        style={{ backgroundColor: "var(--color-bg-primary)" }}
      >
        <div className="w-full max-w-2xl">
          <div
            className="rounded-2xl transition-all duration-200"
            style={{
              backgroundColor: "var(--color-bg-elevated)",
              border: "1px solid var(--color-border)",
              boxShadow: "var(--shadow-md)",
            }}
          >
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

            <div className="flex items-center justify-between px-3 pb-3">
              {attachmentMenu}

              <div className="flex items-center gap-1">
                {message.trim() ? (
                  <button
                    onClick={handleSend}
                    disabled={isProcessing}
                    className="p-2.5 rounded-xl transition-all duration-200 disabled:opacity-50"
                    style={{
                      backgroundColor: "var(--color-brand-primary)",
                      color: "white",
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

          {attachmentErrorMessage}

          <div className="flex flex-wrap justify-center gap-3 mt-4">
            <button
              onClick={handleNewIntakeClick}
              disabled={isProcessing}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200 border"
              style={{
                backgroundColor: "transparent",
                color: "var(--color-brand-primary)",
                borderColor: "var(--color-border)",
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
                borderColor: "var(--color-border)",
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
                const voiceBtn = document.querySelector(
                  '[aria-label="Start recording"]'
                ) as HTMLButtonElement | null;
                voiceBtn?.click();
              }}
              disabled={isProcessing}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200 border"
              style={{
                backgroundColor: "transparent",
                color: "var(--color-text-secondary)",
                borderColor: "var(--color-border)",
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

  return (
    <div className="px-4 py-4" style={{ backgroundColor: "var(--color-bg-primary)" }}>
      <div className="max-w-2xl mx-auto">
        <div
          className="rounded-2xl transition-all duration-200"
          style={{
            backgroundColor: "var(--color-bg-elevated)",
            border: "1px solid var(--color-border)",
            boxShadow: "var(--shadow-md)",
          }}
        >
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

          <div className="flex items-center justify-between px-3 pb-3">
            {attachmentMenu}

            <div className="flex items-center gap-1">
              {message.trim() && (
                <button
                  onClick={handleSend}
                  disabled={isProcessing}
                  className="p-2 rounded-xl transition-all duration-200 disabled:opacity-50"
                  style={{
                    backgroundColor: "var(--color-brand-primary)",
                    color: "white",
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

        {attachmentErrorMessage}
      </div>
    </div>
  );
}
