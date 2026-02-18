"use client";

import { useState, useCallback } from "react";
import { ChatMessage, ParsedIntake, EmbeddedContent } from "@/lib/types";
import { generateId } from "@/lib/utils";

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const addMessage = useCallback(
    (role: "user" | "assistant", content: string, embedded?: EmbeddedContent) => {
      const message: ChatMessage = {
        id: generateId(),
        role,
        content,
        timestamp: new Date(),
        embedded,
      };
      setMessages((prev) => [...prev, message]);
      return message;
    },
    []
  );

  const sendTextMessage = useCallback(
    async (text: string) => {
      addMessage("user", text);
      setIsProcessing(true);
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text }),
        });
        const data = await res.json();
        if (data.success) {
          addMessage("assistant", data.data.message, data.data.embedded);
        } else {
          addMessage("assistant", "", {
            type: "error",
            message: data.error || "Something went wrong",
          });
        }
      } catch {
        addMessage("assistant", "", {
          type: "error",
          message: "Failed to send message. Please try again.",
        });
      } finally {
        setIsProcessing(false);
      }
    },
    [addMessage]
  );

  const sendVoiceMessage = useCallback(
    async (audioBlob: Blob) => {
      setIsProcessing(true);
      try {
        const formData = new FormData();
        formData.append("audio", audioBlob, "recording.webm");
        const transcribeRes = await fetch("/api/transcribe", {
          method: "POST",
          body: formData,
        });
        const transcribeData = await transcribeRes.json();
        if (!transcribeData.success) {
          throw new Error(transcribeData.error || "Transcription failed");
        }
        const transcribedText = transcribeData.data.text;
        addMessage("user", transcribedText);
        const parseRes = await fetch("/api/parse-intake", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: transcribedText }),
        });
        const parseData = await parseRes.json();
        if (parseData.success && parseData.data.species) {
          addMessage("assistant", "Here's what I understood:", {
            type: "intake_confirmation",
            data: parseData.data,
          });
        } else {
          const chatRes = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: transcribedText }),
          });
          const chatData = await chatRes.json();
          if (chatData.success) {
            addMessage("assistant", chatData.data.message, chatData.data.embedded);
          }
        }
      } catch (error) {
        addMessage("assistant", "", {
          type: "error",
          message:
            error instanceof Error
              ? error.message
              : "Failed to process voice message",
        });
      } finally {
        setIsProcessing(false);
      }
    },
    [addMessage]
  );

  const sendDocumentCapture = useCallback(
    async (file: File) => {
      setIsProcessing(true);
      addMessage("user", "📄 Uploaded document for scanning");
      try {
        const formData = new FormData();
        formData.append("image", file);
        const extractRes = await fetch("/api/extract-document", {
          method: "POST",
          body: formData,
        });
        const extractData = await extractRes.json();
        if (!extractData.success) {
          throw new Error(extractData.error || "Document extraction failed");
        }
        const parseRes = await fetch("/api/parse-intake", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: extractData.data.text }),
        });
        const parseData = await parseRes.json();
        if (parseData.success && parseData.data.species) {
          addMessage("assistant", "I extracted the following from the form:", {
            type: "intake_confirmation",
            data: parseData.data,
          });
        } else {
          addMessage("assistant", "", {
            type: "error",
            message: "Could not extract intake information from the document.",
          });
        }
      } catch (error) {
        addMessage("assistant", "", {
          type: "error",
          message:
            error instanceof Error
              ? error.message
              : "Failed to process document",
        });
      } finally {
        setIsProcessing(false);
      }
    },
    [addMessage]
  );

  const saveIntake = useCallback(
    async (data: ParsedIntake) => {
      setIsProcessing(true);
      try {
        const res = await fetch("/api/intakes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const result = await res.json();
        if (result.success) {
          addMessage(
            "assistant",
            `Intake ${result.data.intake_number} saved successfully!`,
            {
              type: "animal_record",
              data: result.data,
            }
          );
        } else {
          addMessage("assistant", "", {
            type: "error",
            message: result.error || "Failed to save intake",
          });
        }
      } catch {
        addMessage("assistant", "", {
          type: "error",
          message: "Failed to save intake. Please try again.",
        });
      } finally {
        setIsProcessing(false);
      }
    },
    [addMessage]
  );

  return {
    messages,
    isProcessing,
    sendTextMessage,
    sendVoiceMessage,
    sendDocumentCapture,
    saveIntake,
    addMessage,
  };
}
