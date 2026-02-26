"use client";

import { ChatMessage } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { IntakeConfirmationCard } from "@/components/intake/IntakeConfirmationCard";
import { AnimalRecordCard } from "@/components/intake/AnimalRecordCard";
import { CareLogsList } from "@/components/intake/CareLogsList";
import { AnimalsInCareList } from "@/components/intake/AnimalsInCareList";
import { DeleteConfirmation } from "@/components/intake/DeleteConfirmation";
import { CareLogConfirmation } from "@/components/intake/CareLogConfirmation";
import { QuickStatusCard } from "@/components/intake/QuickStatusCard";
import { StatisticsCard } from "@/components/analytics/StatisticsCard";
import { ChartCard } from "@/components/analytics/ChartCard";
import { ProcessingIndicator } from "@/components/ui/ProcessingIndicator";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Card } from "@/components/ui/Card";

interface ChatMessageBubbleProps {
  message: ChatMessage;
  isProcessing?: boolean;
  onConfirmIntake?: (data: any) => void;
  onEditIntake?: (data: any) => void;
  onEditExistingIntake?: (data: any) => void;
  onConfirmDelete?: (recordType: "intake" | "care_log", id: string, name: string) => void;
  onCancelDelete?: () => void;
  onAddCareLog?: (intakeNumber: string) => void;
  onDeleteIntake?: (intake: any) => void;
  onEditCareLog?: (log: any) => void;
  onDeleteCareLog?: (logId: string) => void;
  onUndoCareLog?: (logId: string) => void;
}

export function ChatMessageBubble({
  message,
  isProcessing,
  onConfirmIntake,
  onEditIntake,
  onEditExistingIntake,
  onConfirmDelete,
  onCancelDelete,
  onAddCareLog,
  onDeleteIntake,
  onEditCareLog,
  onDeleteCareLog,
  onUndoCareLog,
}: ChatMessageBubbleProps) {
  const isUser = message.role === "user";
  return (
    <div
      className={`flex flex-col gap-2 ${
        isUser ? "items-end" : "items-start"
      }`}
    >
      {message.content && (
        <div
          className="max-w-[80%] px-4 py-3 rounded-2xl"
          style={{
            backgroundColor: isUser 
              ? "var(--color-bubble-user)" 
              : "var(--color-bubble-assistant)",
            color: isUser 
              ? "var(--color-bubble-user-text)" 
              : "var(--color-bubble-assistant-text)",
            borderBottomRightRadius: isUser ? "6px" : undefined,
            borderBottomLeftRadius: !isUser ? "6px" : undefined,
          }}
        >
          <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        </div>
      )}
      {message.embedded && (
        <div className="w-full max-w-[96%]">
          {renderEmbeddedContent(
            message.embedded,
            isProcessing,
            onConfirmIntake,
            onEditIntake,
            onEditExistingIntake,
            onConfirmDelete,
            onCancelDelete,
            onAddCareLog,
            onDeleteIntake,
            onEditCareLog,
            onDeleteCareLog,
            onUndoCareLog
          )}
        </div>
      )}
      <span 
        className="text-xs px-1"
        style={{ color: "var(--color-text-muted)" }}
      >
        {formatDateTime(message.timestamp)}
      </span>
    </div>
  );
}

function renderEmbeddedContent(
  embedded: ChatMessage["embedded"],
  isProcessing: boolean | undefined,
  onConfirmIntake?: (data: any) => void,
  onEditIntake?: (data: any) => void,
  onEditExistingIntake?: (data: any) => void,
  onConfirmDelete?: (recordType: "intake" | "care_log", id: string, name: string) => void,
  onCancelDelete?: () => void,
  onAddCareLog?: (intakeNumber: string) => void,
  onDeleteIntake?: (intake: any) => void,
  onEditCareLog?: (log: any) => void,
  onDeleteCareLog?: (logId: string) => void,
  onUndoCareLog?: (logId: string) => void
) {
  if (!embedded) return null;
  switch (embedded.type) {
    case "intake_confirmation":
      return (
        <IntakeConfirmationCard
          data={embedded.data}
          onConfirm={() => onConfirmIntake?.(embedded.data)}
          onEdit={() => onEditIntake?.(embedded.data)}
          isProcessing={isProcessing}
        />
      );
    case "animal_record":
    case "animal_record_full":
      return (
        <AnimalRecordCard
          intake={embedded.data}
          showEditButton
          onEdit={() => onEditExistingIntake?.(embedded.data)}
          onAddCareLog={() => onAddCareLog?.(embedded.data.intake_number)}
          onDelete={() => onDeleteIntake?.(embedded.data)}
        />
      );
    case "intake_edit":
      return (
        <AnimalRecordCard
          intake={embedded.data}
          showEditButton
          onEdit={() => onEditExistingIntake?.(embedded.data)}
        />
      );
    case "care_logs":
      return (
        <CareLogsList
          logs={embedded.data.logs}
          totalCount={embedded.data.totalCount}
          onEditLog={(log) => onEditCareLog?.(log)}
          onDeleteLog={(logId) => onDeleteCareLog?.(logId)}
        />
      );
    case "care_log_updated":
      return (
        <CareLogsList
          logs={[embedded.data]}
          totalCount={1}
          onEditLog={(log) => onEditCareLog?.(log)}
          onDeleteLog={(logId) => onDeleteCareLog?.(logId)}
        />
      );
    case "care_log_created":
      return (
        <CareLogConfirmation
          log={embedded.data.log}
          intakeNumber={embedded.data.intakeNumber}
          species={embedded.data.species}
          onUndo={(logId) => onUndoCareLog?.(logId)}
          isProcessing={isProcessing}
        />
      );
    case "animals_list":
      return (
        <AnimalsInCareList
          animals={embedded.data.items}
          totalCount={embedded.data.totalCount}
          mode={embedded.data.mode}
          statusFilter={embedded.data.statusFilter}
        />
      );
    case "quick_status":
      return (
        <QuickStatusCard
          items={embedded.data.items}
          totalUnderCare={embedded.data.totalUnderCare}
        />
      );
    case "deleted_confirmation":
      if (embedded.data.status === "confirm") {
        return (
          <DeleteConfirmation
            recordType={embedded.data.recordType}
            name={embedded.data.name}
            onConfirm={() =>
              embedded.data.id &&
              onConfirmDelete?.(
                embedded.data.recordType,
                embedded.data.id,
                embedded.data.name
              )
            }
            onCancel={() => onCancelDelete?.()}
            isProcessing={isProcessing}
          />
        );
      }
      return (
        <Card variant="bordered">
          <p className="text-sm text-primary-text">
            {embedded.data.name} has been deleted.
          </p>
        </Card>
      );
    case "statistics":
      return <StatisticsCard data={embedded.data} />;
    case "chart":
      return <ChartCard data={embedded.data} />;
    case "processing":
      return <ProcessingIndicator message={embedded.message} />;
    case "error":
      return <ErrorMessage message={embedded.message} />;
    default:
      return null;
  }
}
