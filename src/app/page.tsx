"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useChat } from "@/hooks/useChat";
import { useSummary } from "@/hooks/useSummary";
import { GreetingHeader } from "@/components/chat/GreetingHeader";
import { ChatView } from "@/components/chat/ChatView";
import { WelcomeView } from "@/components/chat/WelcomeView";
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
    clearMessages,
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

  const handleLogoClick = () => {
    clearMessages();
  };

  const isInChatMode = messages.length > 0;

  // Welcome mode - greeting and input are grouped together in center
  if (!isInChatMode) {
    return (
      <div 
        className="min-h-screen flex flex-col relative"
        style={{ backgroundColor: "var(--color-bg-primary)" }}
      >
        {/* Centered content container */}
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <WelcomeView 
            userName={user.name}
            onSettingsClick={handleSettingsClick}
          />
          <ChatInputBar
            onSendMessage={sendTextMessage}
            onVoiceRecord={sendVoiceMessage}
            onDocumentCapture={sendDocumentCapture}
            isProcessing={isProcessing}
            isWelcomeMode={true}
          />
        </div>
        
        {/* Summary bar pinned to bottom */}
        <SummaryBar stats={stats} isLoading={summaryLoading} />
      </div>
    );
  }

  // Chat mode - standard layout
  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "var(--color-bg-primary)" }}
    >
      <GreetingHeader
        userName={user.name}
        onSettingsClick={handleSettingsClick}
        onLogoClick={handleLogoClick}
      />
      
      <ChatView
        messages={messages}
        isProcessing={isProcessing}
        onConfirmIntake={handleConfirmIntake}
        onEditIntake={handleEditIntake}
      />
      
      <ChatInputBar
        onSendMessage={sendTextMessage}
        onVoiceRecord={sendVoiceMessage}
        onDocumentCapture={sendDocumentCapture}
        isProcessing={isProcessing}
        isWelcomeMode={false}
      />
      
      <SummaryBar stats={stats} isLoading={summaryLoading} />
      
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
