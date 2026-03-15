"use client";

import { useState, useCallback, useRef } from "react";
import {
  ChatMessage,
  ParsedIntake,
  EmbeddedContent,
  ParseIntakeResponse,
} from "@/lib/types";
import { generateId } from "@/lib/utils";
import {
  REQUIRED_INTAKE_FIELDS,
  VOICE_SAVE_COMMANDS,
  VOICE_CANCEL_COMMANDS,
  isRequiredIntakeFieldMissing,
} from "@/lib/constants";
import { isSupportedDocument } from "@/lib/document-upload";
import {
  requiresSpeciesClarification,
  SQUIRREL_SPECIES_OPTIONS,
} from "@/lib/species";

const MAX_MESSAGES = 100;
const UNSUPPORTED_DOCUMENT_MESSAGE =
  "Only images and PDFs are supported right now.";

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
      setMessages((prev) => {
        const next = [...prev, message];
        if (next.length > MAX_MESSAGES) {
          return next.slice(-MAX_MESSAGES);
        }
        return next;
      });
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

  const updateEmbeddedContent = useCallback(
    (id: string, type: "care_log" | "intake", data: any) => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (!msg.embedded) return msg;

          if (type === "care_log") {
            if (msg.embedded.type === "care_logs") {
              const updatedLogs = msg.embedded.data.logs.map((log) =>
                log.id === id ? { ...log, ...data } : log
              );
              return {
                ...msg,
                embedded: {
                  ...msg.embedded,
                  data: {
                    ...msg.embedded.data,
                    logs: updatedLogs,
                  },
                },
              };
            }
            if (msg.embedded.type === "care_log_updated") {
              if (msg.embedded.data.id !== id) return msg;
              return {
                ...msg,
                embedded: {
                  ...msg.embedded,
                  data: { ...msg.embedded.data, ...data },
                },
              };
            }
            if (msg.embedded.type === "care_log_created") {
              if (msg.embedded.data.log.id !== id) return msg;
              return {
                ...msg,
                embedded: {
                  ...msg.embedded,
                  data: {
                    ...msg.embedded.data,
                    log: { ...msg.embedded.data.log, ...data },
                  },
                },
              };
            }
          }

          if (type === "intake") {
            if (
              msg.embedded.type === "animal_record" ||
              msg.embedded.type === "animal_record_full" ||
              msg.embedded.type === "intake_edit"
            ) {
              if (msg.embedded.data.id !== id) return msg;
              return {
                ...msg,
                embedded: {
                  ...msg.embedded,
                  data: { ...msg.embedded.data, ...data },
                },
              };
            }
          }

          return msg;
        })
      );
    },
    []
  );

  const matchesCommand = (text: string, commands: string[]): boolean => {
    const normalized = text.toLowerCase().trim();
    return commands.some((cmd) => normalized === cmd);
  };

  const buildParseIntakeResponse = (
    parsed: ParsedIntake
  ): ParseIntakeResponse => {
    const missingFields = REQUIRED_INTAKE_FIELDS.filter((field) => {
      const value = parsed[field.key as keyof typeof parsed];
      return isRequiredIntakeFieldMissing(field.key, value);
    }).map((field) => field.label);

    return {
      parsed,
      missingFields,
      isComplete: missingFields.length === 0,
    };
  };

  const clearPendingIntake = useCallback(() => {
    setPendingIntake(null);
    pendingMessageIdRef.current = null;
  }, []);

  const discardPendingIntake = useCallback(() => {
    // Remove intake_confirmation and species_clarification cards from messages
    setMessages((prev) =>
      prev.map((msg) => {
        if (
          msg.embedded?.type === "intake_confirmation" ||
          msg.embedded?.type === "species_clarification"
        ) {
          // Remove the embedded content; keep the text if any, or drop the message
          const { ...rest } = msg;
          return { ...rest, embedded: undefined };
        }
        return msg;
      }).filter((msg) => msg.content || msg.embedded) // Drop empty messages
    );
    setPendingIntake(null);
    pendingMessageIdRef.current = null;
    addMessage("assistant", "Intake discarded. What would you like to do?");
  }, [addMessage]);

  const upsertPendingMessage = useCallback(
    (content: string, embedded?: EmbeddedContent) => {
      if (pendingMessageIdRef.current) {
        updateMessage(pendingMessageIdRef.current, { content, embedded });
        return;
      }

      const msg = addMessage("assistant", content, embedded);
      pendingMessageIdRef.current = msg.id;
    },
    [addMessage, updateMessage]
  );

  const saveIntake = useCallback(
    async (data: ParsedIntake) => {
      setIsProcessing(true);
      try {
        if (requiresSpeciesClarification(data.species)) {
          setPendingIntake(data);
          addMessage("assistant", "", {
            type: "species_clarification",
            data: {
              question: "What type of squirrel?",
              options: [...SQUIRREL_SPECIES_OPTIONS],
            },
          });
          setIsProcessing(false);
          return;
        }

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
    [addMessage, clearPendingIntake, upsertPendingMessage]
  );

  const editExistingIntake = useCallback(
    async (intakeId: string, data: ParsedIntake) => {
      setIsProcessing(true);
      try {
        const res = await fetch(`/api/intakes/${intakeId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const result = await res.json();
        if (result.success) {
          addMessage(
            "assistant",
            `Intake ${result.data.intake_number} updated successfully!`,
            {
              type: "animal_record",
              data: result.data,
            }
          );
        } else {
          addMessage("assistant", "", {
            type: "error",
            message: result.error || "Failed to update intake",
          });
        }
      } catch {
        addMessage("assistant", "", {
          type: "error",
          message: "Failed to update intake. Please try again.",
        });
      } finally {
        setIsProcessing(false);
      }
    },
    [addMessage]
  );

  const deleteIntake = useCallback(
    async (intakeId: string, name?: string) => {
      setIsProcessing(true);
      try {
        const res = await fetch(`/api/intakes/${intakeId}`, {
          method: "DELETE",
        });
        const result = await res.json();
        if (result.success) {
          addMessage("assistant", "", {
            type: "deleted_confirmation",
            data: {
              status: "deleted",
              recordType: "intake",
              name: name || "Intake",
            },
          });
        } else {
          addMessage("assistant", "", {
            type: "error",
            message: result.error || "Failed to delete intake",
          });
        }
      } catch {
        addMessage("assistant", "", {
          type: "error",
          message: "Failed to delete intake. Please try again.",
        });
      } finally {
        setIsProcessing(false);
      }
    },
    [addMessage]
  );

  const deleteCareLog = useCallback(
    async (logId: string, name?: string) => {
      setIsProcessing(true);
      try {
        const res = await fetch(`/api/care-logs/${logId}`, {
          method: "DELETE",
        });
        const result = await res.json();
        if (result.success) {
          addMessage("assistant", "", {
            type: "deleted_confirmation",
            data: {
              status: "deleted",
              recordType: "care_log",
              name: name || "Care log",
            },
          });
        } else {
          addMessage("assistant", "", {
            type: "error",
            message: result.error || "Failed to delete care log",
          });
        }
      } catch {
        addMessage("assistant", "", {
          type: "error",
          message: "Failed to delete care log. Please try again.",
        });
      } finally {
        setIsProcessing(false);
      }
    },
    [addMessage]
  );

  const undoCareLog = useCallback(
    async (logId: string) => {
      try {
        const res = await fetch(`/api/care-logs/${logId}`, {
          method: "DELETE",
        });
        const result = await res.json();
        if (result.success) {
          addMessage("assistant", "Care log undone.");
        } else {
          addMessage("assistant", "", {
            type: "error",
            message: "Failed to undo care log.",
          });
        }
      } catch {
        addMessage("assistant", "", {
          type: "error",
          message: "Failed to undo care log.",
        });
      }
    },
    [addMessage]
  );

  const handleParsedIntake = useCallback(
    (response: ParseIntakeResponse, isUpdate: boolean = false) => {
      const { parsed, missingFields, isComplete } = response;

      setPendingIntake(parsed);

      if (requiresSpeciesClarification(parsed.species)) {
        addMessage("assistant", "", {
          type: "species_clarification",
          data: {
            question: "What type of squirrel?",
            options: [...SQUIRREL_SPECIES_OPTIONS],
          },
        });
        return;
      }

      // Reset pendingMessageIdRef so new intake cards always appear as
      // new messages after the user's reply — avoids the card appearing
      // above the user's answer in the chat.
      pendingMessageIdRef.current = null;

      let messageContent: string;
      if (isComplete) {
        messageContent = isUpdate
          ? "Updated! All required fields are complete — ready to save."
          : "Here's what I captured. Ready to save!";
      } else {
        const missingList = missingFields.join(", ");
        messageContent = isUpdate
          ? `Updated! Still need: ${missingList}. You can add more details or save as-is.`
          : `Here's what I captured. Still need: ${missingList}. You can add more, edit, or save as-is.`;
      }

      addMessage("assistant", messageContent, {
        type: "intake_confirmation",
        data: parsed,
      });
      pendingMessageIdRef.current = null;
    },
    [addMessage]
  );

  const sendTextMessage = useCallback(
    async (text: string) => {
      addMessage("user", text);
      setIsProcessing(true);
      try {
        const intakeToSave = pendingIntake;
        if (intakeToSave) {
          if (matchesCommand(text, VOICE_SAVE_COMMANDS)) {
            await saveIntake(intakeToSave);
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
              existingIntake: intakeToSave,
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
          if (data.data.embedded?.type === "intake_confirmation") {
            handleParsedIntake(
              buildParseIntakeResponse(data.data.embedded.data),
              false
            );
          } else {
            addMessage("assistant", data.data.message, data.data.embedded);
          }
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
      buildParseIntakeResponse,
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

        const intakeToSave = pendingIntake;
        if (intakeToSave) {
          if (matchesCommand(transcribedText, VOICE_SAVE_COMMANDS)) {
            await saveIntake(intakeToSave);
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
              existingIntake: intakeToSave,
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

        const chatRes = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: transcribedText }),
        });
        const chatData = await chatRes.json();
        if (chatData.success) {
          if (chatData.data.embedded?.type === "intake_confirmation") {
            handleParsedIntake(
              buildParseIntakeResponse(chatData.data.embedded.data),
              false
            );
          } else {
            addMessage("assistant", chatData.data.message, chatData.data.embedded);
          }
        } else {
          addMessage("assistant", "", {
            type: "error",
            message: chatData.error || "Something went wrong",
          });
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
      buildParseIntakeResponse,
    ]
  );

  const sendDocumentCapture = useCallback(
    async (file: File) => {
      if (!isSupportedDocument(file)) {
        addMessage("assistant", "", {
          type: "error",
          message: UNSUPPORTED_DOCUMENT_MESSAGE,
        });
        return;
      }

      setIsProcessing(true);
      addMessage("user", "Uploaded document for processing");
      try {
        const formData = new FormData();
        formData.append("file", file);
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

  const resolveSpecies = useCallback(
    (species: string) => {
      if (!pendingIntake) return;
      const updated = { ...pendingIntake, species };
      const response = buildParseIntakeResponse(updated);
      // Reset so the intake card appears as a new message below
      pendingMessageIdRef.current = null;
      handleParsedIntake(response, true);
    },
    [pendingIntake, buildParseIntakeResponse, handleParsedIntake]
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
    editExistingIntake,
    deleteIntake,
    deleteCareLog,
    undoCareLog,
    addMessage,
    clearMessages,
    updatePendingIntake,
    confirmPendingIntake,
    clearPendingIntake,
    discardPendingIntake,
    updateEmbeddedContent,
    resolveSpecies,
  };
}
