"use client";

import { useState, useCallback, useRef } from "react";
import {
  ChatMessage,
  ParsedIntake,
  EmbeddedContent,
  ParseIntakeResponse,
} from "@/lib/types";
import { generateId } from "@/lib/utils";
import { VOICE_SAVE_COMMANDS, VOICE_CANCEL_COMMANDS } from "@/lib/constants";

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingIntake, setPendingIntake] = useState<ParsedIntake | null>(null);
  const pendingMessageIdRef = useRef<string | null>(null);

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

  const updateMessage = useCallback(
    (
      messageId: string,
      updates: { content?: string; embedded?: EmbeddedContent }
    ) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, ...updates, timestamp: new Date() }
            : msg
        )
      );
    },
    []
  );

  const matchesCommand = (text: string, commands: string[]): boolean => {
    const normalized = text.toLowerCase().trim();
    return commands.some(
      (cmd) => normalized === cmd || normalized.includes(cmd)
    );
  };

  const clearPendingIntake = useCallback(() => {
    setPendingIntake(null);
    pendingMessageIdRef.current = null;
  }, []);

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
          clearPendingIntake();
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
    [addMessage, clearPendingIntake]
  );

  const handleParsedIntake = useCallback(
    (response: ParseIntakeResponse, isUpdate: boolean = false) => {
      const { parsed, missingFields, isComplete } = response;

      setPendingIntake(parsed);
      let messageContent: string;
      if (isComplete) {
        messageContent = isUpdate
          ? "I've updated the intake. All required fields are complete - ready to save!"
          : "Here's what I understood. Ready to save!";
      } else {
        const missingList = missingFields.join(", ");
        messageContent = isUpdate
          ? `Updated! Still missing: **${missingList}**. Provide more details or save as-is.`
          : `I captured the intake info. Missing: **${missingList}**. You can provide more details, edit, or save as-is.`;
      }

      if (isUpdate && pendingMessageIdRef.current) {
        updateMessage(pendingMessageIdRef.current, {
          content: messageContent,
          embedded: { type: "intake_confirmation", data: parsed },
        });
      } else {
        const msg = addMessage("assistant", messageContent, {
          type: "intake_confirmation",
          data: parsed,
        });
        pendingMessageIdRef.current = msg.id;
      }
    },
    [addMessage, updateMessage]
  );

  const sendTextMessage = useCallback(
    async (text: string) => {
      addMessage("user", text);
      setIsProcessing(true);
      try {
        if (pendingIntake) {
          if (matchesCommand(text, VOICE_SAVE_COMMANDS)) {
            await saveIntake(pendingIntake);
            return;
          }
          if (matchesCommand(text, VOICE_CANCEL_COMMANDS)) {
            clearPendingIntake();
            addMessage(
              "assistant",
              "Intake cancelled. What would you like to do?"
            );
            setIsProcessing(false);
            return;
          }
          const mergeRes = await fetch("/api/merge-intake", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              existingIntake: pendingIntake,
              additionalText: text,
            }),
          });
          const mergeData = await mergeRes.json();
          if (mergeData.success) {
            handleParsedIntake(mergeData.data, true);
            setIsProcessing(false);
            return;
          }
        }

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
    [
      addMessage,
      pendingIntake,
      saveIntake,
      clearPendingIntake,
      handleParsedIntake,
    ]
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

        if (pendingIntake) {
          if (matchesCommand(transcribedText, VOICE_SAVE_COMMANDS)) {
            await saveIntake(pendingIntake);
            return;
          }
          if (matchesCommand(transcribedText, VOICE_CANCEL_COMMANDS)) {
            clearPendingIntake();
            addMessage(
              "assistant",
              "Intake cancelled. What would you like to do?"
            );
            setIsProcessing(false);
            return;
          }
          const mergeRes = await fetch("/api/merge-intake", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              existingIntake: pendingIntake,
              additionalText: transcribedText,
            }),
          });
          const mergeData = await mergeRes.json();
          if (mergeData.success) {
            handleParsedIntake(mergeData.data, true);
            setIsProcessing(false);
            return;
          }
        }

        const parseRes = await fetch("/api/parse-intake", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: transcribedText }),
        });
        const parseData = await parseRes.json();
        if (parseData.success && parseData.data.parsed?.species) {
          handleParsedIntake(parseData.data, false);
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
    [
      addMessage,
      pendingIntake,
      saveIntake,
      clearPendingIntake,
      handleParsedIntake,
    ]
  );

  const sendDocumentCapture = useCallback(
    async (file: File) => {
      setIsProcessing(true);
      addMessage("user", "Uploaded document for scanning");
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
        if (parseData.success && parseData.data.parsed?.species) {
          handleParsedIntake(parseData.data, false);
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
    [addMessage, handleParsedIntake]
  );

  const updatePendingIntake = useCallback(
    (data: ParsedIntake) => {
      setPendingIntake(data);
      if (pendingMessageIdRef.current) {
        updateMessage(pendingMessageIdRef.current, {
          embedded: { type: "intake_confirmation", data },
        });
      }
    },
    [updateMessage]
  );

  const confirmPendingIntake = useCallback(async () => {
    if (pendingIntake) {
      await saveIntake(pendingIntake);
    }
  }, [pendingIntake, saveIntake]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setIsProcessing(false);
    clearPendingIntake();
  }, [clearPendingIntake]);

  return {
    messages,
    isProcessing,
    pendingIntake,
    sendTextMessage,
    sendVoiceMessage,
    sendDocumentCapture,
    saveIntake,
    addMessage,
    clearMessages,
    updatePendingIntake,
    confirmPendingIntake,
    clearPendingIntake,
  };
}
