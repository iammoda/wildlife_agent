"use client";

import { ChatMessage } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { IntakeConfirmationCard } from "@/components/intake/IntakeConfirmationCard";
import { AnimalRecordCard } from "@/components/intake/AnimalRecordCard";
import { CareLogsList } from "@/components/intake/CareLogsList";
import { StatisticsCard } from "@/components/analytics/StatisticsCard";
import { ChartCard } from "@/components/analytics/ChartCard";
import { ProcessingIndicator } from "@/components/ui/ProcessingIndicator";
import { ErrorMessage } from "@/components/ui/ErrorMessage";

interface ChatMessageBubbleProps {
  message: ChatMessage;
  onConfirmIntake?: (data: any) => void;
  onEditIntake?: (data: any) => void;
}

export function ChatMessageBubble({
  message,
  onConfirmIntake,
  onEditIntake,
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
        <div className="max-w-[90%]">
          {renderEmbeddedContent(message.embedded, onConfirmIntake, onEditIntake)}
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
  onConfirmIntake?: (data: any) => void,
  onEditIntake?: (data: any) => void
) {
  if (!embedded) return null;
  switch (embedded.type) {
    case "intake_confirmation":
      return (
        <IntakeConfirmationCard
          data={embedded.data}
          onConfirm={() => onConfirmIntake?.(embedded.data)}
          onEdit={() => onEditIntake?.(embedded.data)}
        />
      );
    case "animal_record":
    case "animal_record_full":
      return <AnimalRecordCard intake={embedded.data} />;
    case "care_logs":
      return <CareLogsList logs={embedded.data} />;
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
