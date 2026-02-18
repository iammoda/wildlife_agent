"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useChat } from "@/hooks/useChat";
import { useSummary } from "@/hooks/useSummary";
import { GreetingHeader } from "@/components/chat/GreetingHeader";
import { ChatView } from "@/components/chat/ChatView";
import { ChatInputBar } from "@/components/chat/ChatInputBar";
import { SummaryBar } from "@/components/chat/SummaryBar";
import { IntakeEditModal } from "@/components/intake/IntakeEditModal";
import { ParsedIntake } from "@/lib/types";

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { stats, isLoading: summaryLoading, refresh: refreshSummary } =
    useSummary();
  const {
    messages,
    isProcessing,
    sendTextMessage,
    sendVoiceMessage,
    sendDocumentCapture,
    saveIntake,
  } = useChat();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingIntake, setEditingIntake] = useState<ParsedIntake | null>(
    null
  );

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--color-bg-primary)" }}
      >
        <div 
          className="flex flex-col items-center gap-3"
        >
          <div 
            className="w-8 h-8 rounded-full animate-pulse"
            style={{ backgroundColor: "var(--color-brand-primary)" }}
          />
          <span style={{ color: "var(--color-text-secondary)" }}>Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const handleConfirmIntake = async (data: ParsedIntake) => {
    await saveIntake(data);
    refreshSummary();
  };

  const handleEditIntake = (data: ParsedIntake) => {
    setEditingIntake(data);
    setEditModalOpen(true);
  };

  const handleSaveEditedIntake = async (data: ParsedIntake) => {
    await saveIntake(data);
    refreshSummary();
    setEditModalOpen(false);
    setEditingIntake(null);
  };

  const handleSettingsClick = () => {
    router.push("/settings");
  };

  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "var(--color-bg-primary)" }}
    >
      <GreetingHeader
        userName={user.name}
        onSettingsClick={handleSettingsClick}
      />
      <ChatView
        messages={messages}
        isProcessing={isProcessing}
        onConfirmIntake={handleConfirmIntake}
        onEditIntake={handleEditIntake}
      />
      <SummaryBar stats={stats} isLoading={summaryLoading} />
      <ChatInputBar
        onSendMessage={sendTextMessage}
        onVoiceRecord={sendVoiceMessage}
        onDocumentCapture={sendDocumentCapture}
        isProcessing={isProcessing}
      />
      {editingIntake && (
        <IntakeEditModal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setEditingIntake(null);
          }}
          initialData={editingIntake}
          onSave={handleSaveEditedIntake}
        />
      )}
    </div>
  );
}
