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
import { CareLogEditModal } from "@/components/intake/CareLogEditModal";
import { DailyCareLog, ParsedIntake } from "@/lib/types";
import { useToast } from "@/components/ui/Toast";

function toEditableIntake(data: any): ParsedIntake {
  return {
    intake_number: data?.intake_number ?? null,
    intake_date: data?.intake_date ?? null,
    species: data?.species ?? null,
    quantity: data?.quantity ?? null,
    sex: data?.sex ?? null,
    intake_reason: data?.intake_reason ?? null,
    found_location: data?.found_location ?? null,
    found_date: data?.found_date ?? null,
    finder_name: data?.finder_name ?? null,
    finder_phone: data?.finder_phone ?? null,
    finder_email: data?.finder_email ?? null,
    finder_address: data?.finder_address ?? null,
    food_offered: data?.food_offered ?? null,
    donation_amount: data?.donation_amount ?? null,
    notes: data?.notes ?? null,
    disposition: data?.disposition ?? null,
    disposition_date: data?.disposition_date ?? null,
    weight: data?.weight ?? null,
    age: data?.age ?? null,
    distress_code: data?.distress_code ?? null,
    distress_subcode: data?.distress_subcode ?? null,
    exam_notes: data?.exam_notes ?? null,
    how_description: data?.how_description ?? null,
  };
}

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const accountSetupCompleted = user?.accountSetupCompleted ?? false;
  const { stats, isLoading: summaryLoading, refresh: refreshSummary } =
    useSummary(isAuthenticated && accountSetupCompleted);
  const {
    messages,
    isProcessing,
    sendTextMessage,
    sendVoiceMessage,
    sendDocumentCapture,
    saveIntake,
    editExistingIntake,
    deleteIntake,
    deleteCareLog,
    undoCareLog,
    clearMessages,
    updateEmbeddedContent,
  } = useChat();
  const { showToast } = useToast();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingIntake, setEditingIntake] = useState<ParsedIntake | null>(
    null
  );
  const [editingIntakeId, setEditingIntakeId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<"create" | "edit">("create");
  const [careLogModalOpen, setCareLogModalOpen] = useState(false);
  const [editingCareLog, setEditingCareLog] = useState<
    (Partial<DailyCareLog> & { intakeNumber?: string }) | null
  >(null);
  const [careLogMode, setCareLogMode] = useState<"create" | "edit">("create");

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (user && !user.accountSetupCompleted) {
      router.replace("/activate-account");
    }
  }, [authLoading, isAuthenticated, router, user]);

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

  if (!isAuthenticated || !user || !accountSetupCompleted) {
    return null;
  }

  const handleConfirmIntake = async (data: ParsedIntake) => {
    await saveIntake(data);
    refreshSummary();
  };

  const handleEditIntake = (data: ParsedIntake) => {
    setEditingIntake(data);
    setEditMode("create");
    setEditModalOpen(true);
  };

  const handleEditExistingIntake = (data: any) => {
    setEditingIntake(toEditableIntake(data));
    setEditingIntakeId(data.id as string);
    setEditMode("edit");
    setEditModalOpen(true);
  };

  const handleSaveEditedIntake = async (data: ParsedIntake) => {
    if (editMode === "edit" && editingIntakeId) {
      await editExistingIntake(editingIntakeId, data);
    } else {
      await saveIntake(data);
    }
    refreshSummary();
    setEditModalOpen(false);
    setEditingIntake(null);
    setEditingIntakeId(null);
    setEditMode("create");
  };

  const handleConfirmDelete = async (
    recordType: "intake" | "care_log",
    id: string,
    name: string
  ) => {
    if (recordType === "intake") {
      await deleteIntake(id, name);
    } else {
      await deleteCareLog(id, name);
    }
    refreshSummary();
  };

  const handleCancelDelete = () => {
  };

  const handleAddCareLog = (intakeNumber: string) => {
    sendTextMessage(`add care log for intake ${intakeNumber}`);
  };

  const handleDeleteIntake = (intake: any) => {
    sendTextMessage(`delete intake ${intake.intake_number}`);
  };

  const handleEditCareLog = (log: DailyCareLog) => {
    setEditingCareLog(log);
    setCareLogMode("edit");
    setCareLogModalOpen(true);
  };

  const handleSaveCareLog = async (data: Partial<DailyCareLog>) => {
    if (careLogMode === "edit" && data.id) {
      try {
        const res = await fetch(`/api/care-logs/${data.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const result = await res.json();
        if (!result.success) {
          showToast(result.error || "Failed to update care log", "error");
          return;
        }
        if (result.data?.id) {
          updateEmbeddedContent(result.data.id, "care_log", result.data);
        }
      } catch (error) {
        console.error("Failed to update care log:", error);
        showToast("Failed to update care log", "error");
        return;
      }
      showToast("Care log updated");
    }
    setCareLogModalOpen(false);
    setEditingCareLog(null);
  };

  const handleSettingsClick = () => {
    router.push("/settings");
  };

  const handleLogoClick = () => {
    clearMessages();
  };

  const handleAnimalsInCareClick = () => {
    sendTextMessage("show current intakes");
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
        <SummaryBar
          stats={stats}
          isLoading={summaryLoading}
          onAnimalsClick={handleAnimalsInCareClick}
        />
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
          onEditExistingIntake={handleEditExistingIntake}
          onConfirmDelete={handleConfirmDelete}
          onCancelDelete={handleCancelDelete}
          onAddCareLog={handleAddCareLog}
          onDeleteIntake={handleDeleteIntake}
          onEditCareLog={handleEditCareLog}
          onDeleteCareLog={(logId) => deleteCareLog(logId)}
          onUndoCareLog={undoCareLog}
        />
      
      <ChatInputBar
        onSendMessage={sendTextMessage}
        onVoiceRecord={sendVoiceMessage}
        onDocumentCapture={sendDocumentCapture}
        isProcessing={isProcessing}
        isWelcomeMode={false}
      />
      
      <SummaryBar
        stats={stats}
        isLoading={summaryLoading}
        onAnimalsClick={handleAnimalsInCareClick}
      />
      
      {editingIntake && (
        <IntakeEditModal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setEditingIntake(null);
            setEditingIntakeId(null);
            setEditMode("create");
          }}
          initialData={editingIntake}
          onSave={handleSaveEditedIntake}
          mode={editMode}
        />
      )}
      {editingCareLog && (
        <CareLogEditModal
          isOpen={careLogModalOpen}
          onClose={() => {
            setCareLogModalOpen(false);
            setEditingCareLog(null);
          }}
          initialData={editingCareLog}
          onSave={handleSaveCareLog}
          mode={careLogMode}
        />
      )}
    </div>
  );
}
