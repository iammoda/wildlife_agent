"use client";

import { useEffect, useState, FormEvent } from "react";
import { DailyCareLog, MedicationEntry, StoolStatus } from "@/lib/types";
import { SlideOverPanel } from "@/components/ui/SlideOverPanel";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface CareLogEditPanelProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: Partial<DailyCareLog> & { intakeNumber?: string };
  onSave: (data: Partial<DailyCareLog>) => void;
  mode: "create" | "edit";
}

const STOOL_OPTIONS: { value: StoolStatus; label: string }[] = [
  { value: "normal", label: "Normal" },
  { value: "diarrhea", label: "Diarrhea" },
  { value: "none", label: "None" },
];

export function CareLogEditPanel({
  isOpen,
  onClose,
  initialData,
  onSave,
  mode,
}: CareLogEditPanelProps) {
  const [formData, setFormData] = useState({
    log_date: initialData.log_date
      ? new Date(initialData.log_date).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16),
    weight: initialData.weight || "",
    food_fed: initialData.food_fed || "",
    amount: initialData.amount || "",
    stool: (initialData.stool as StoolStatus) || null,
    aspiration: initialData.aspiration || false,
    aspiration_notes: initialData.aspiration_notes || "",
    medications: (initialData.medications as MedicationEntry[]) || [],
    meds_and_comments: initialData.meds_and_comments || "",
  });

  useEffect(() => {
    setFormData({
      log_date: initialData.log_date
        ? new Date(initialData.log_date).toISOString().slice(0, 16)
        : new Date().toISOString().slice(0, 16),
      weight: initialData.weight || "",
      food_fed: initialData.food_fed || "",
      amount: initialData.amount || "",
      stool: (initialData.stool as StoolStatus) || null,
      aspiration: initialData.aspiration || false,
      aspiration_notes: initialData.aspiration_notes || "",
      medications: (initialData.medications as MedicationEntry[]) || [],
      meds_and_comments: initialData.meds_and_comments || "",
    });
  }, [initialData]);

  const handleChange = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddMedication = () => {
    setFormData((prev) => ({
      ...prev,
      medications: [...prev.medications, { name: "", amount: "" }],
    }));
  };

  const handleUpdateMedication = (
    index: number,
    field: keyof MedicationEntry,
    value: string
  ) => {
    setFormData((prev) => {
      const updated = [...prev.medications];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, medications: updated };
    });
  };

  const handleRemoveMedication = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    // Filter out empty medication entries
    const cleanMeds = formData.medications.filter(
      (m) => m.name.trim() !== "" || m.amount.trim() !== ""
    );

    onSave({
      ...initialData,
      log_date: new Date(formData.log_date).toISOString(),
      weight: formData.weight || null,
      food_fed: formData.food_fed || null,
      amount: formData.amount || null,
      stool: formData.stool,
      aspiration: formData.aspiration,
      aspiration_notes: formData.aspiration ? formData.aspiration_notes || null : null,
      medications: cleanMeds.length > 0 ? cleanMeds : null,
      meds_and_comments: formData.meds_and_comments || null,
    });
    onClose();
  };

  const footer = (
    <div className="flex justify-end gap-2">
      <Button
        type="button"
        variant="ghost"
        className="btn-edit-subtle"
        onClick={onClose}
      >
        Cancel
      </Button>
      <Button
        type="submit"
        form="care-log-edit-form"
        variant="ghost"
        className="btn-primary-green"
      >
        {mode === "edit" ? "Save Changes" : "Add Care Log"}
      </Button>
    </div>
  );

  return (
    <SlideOverPanel
      isOpen={isOpen}
      onClose={onClose}
      title={mode === "edit" ? "Edit Care Log" : "Add Care Log"}
      size="sm"
      footer={footer}
    >
      <form id="care-log-edit-form" onSubmit={handleSubmit} className="space-y-5">
        {initialData.intakeNumber && (
          <p
            className="text-sm"
            style={{ color: "var(--color-text-muted)" }}
          >
            Intake: {initialData.intakeNumber}
          </p>
        )}

        <Input
          label="Date & Time"
          type="datetime-local"
          value={formData.log_date}
          onChange={(event) => handleChange("log_date", event.target.value)}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Weight"
            value={formData.weight}
            onChange={(event) => handleChange("weight", event.target.value)}
            placeholder="e.g., 45g, 1.5oz"
          />
          <Input
            label="Amount Fed"
            value={formData.amount}
            onChange={(event) => handleChange("amount", event.target.value)}
            placeholder="e.g., 5ml"
          />
        </div>

        <Input
          label="Food/Formula"
          value={formData.food_fed}
          onChange={(event) => handleChange("food_fed", event.target.value)}
          placeholder="e.g., Fox Valley 20/50"
        />

        {/* Stool Status */}
        <div>
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Stool
          </label>
          <div className="flex gap-2">
            {STOOL_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  handleChange(
                    "stool",
                    formData.stool === option.value ? null : option.value
                  )
                }
                className="px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-200"
                style={
                  formData.stool === option.value
                    ? {
                        backgroundColor: "var(--color-brand-light)",
                        color: "var(--color-brand-accent)",
                        border: "1px solid var(--color-brand-primary)",
                      }
                    : {
                        backgroundColor: "transparent",
                        color: "var(--color-text-secondary)",
                        border: "1px solid var(--color-border)",
                      }
                }
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Aspiration */}
        <div>
          <div className="flex items-center justify-between">
            <label
              className="text-sm font-medium"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Aspiration
            </label>
            <button
              type="button"
              role="switch"
              aria-checked={formData.aspiration}
              onClick={() => handleChange("aspiration", !formData.aspiration)}
              className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none"
              style={{
                backgroundColor: formData.aspiration
                  ? "var(--color-error)"
                  : "var(--color-border)",
              }}
            >
              <span
                className="inline-block h-4 w-4 rounded-full transition-transform duration-200"
                style={{
                  backgroundColor: "white",
                  transform: formData.aspiration
                    ? "translateX(22px)"
                    : "translateX(4px)",
                }}
              />
            </button>
          </div>
          {formData.aspiration && (
            <div className="mt-2">
              <Input
                value={formData.aspiration_notes}
                onChange={(event) =>
                  handleChange("aspiration_notes", event.target.value)
                }
                placeholder="Details (e.g., minor, cleared quickly)"
              />
            </div>
          )}
        </div>

        {/* Medications */}
        <div>
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Medications
          </label>
          <div className="space-y-2">
            {formData.medications.map((med, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={med.name}
                  onChange={(e) =>
                    handleUpdateMedication(index, "name", e.target.value)
                  }
                  placeholder="Medication"
                  className="flex-1 px-3 py-2 rounded-xl text-sm input-base focus:outline-none"
                />
                <input
                  type="text"
                  value={med.amount}
                  onChange={(e) =>
                    handleUpdateMedication(index, "amount", e.target.value)
                  }
                  placeholder="Amount"
                  className="w-24 px-3 py-2 rounded-xl text-sm input-base focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveMedication(index)}
                  className="p-1.5 rounded-lg transition-colors hover:opacity-80 flex-shrink-0"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddMedication}
              className="text-xs font-medium transition-colors"
              style={{ color: "var(--color-brand-accent)" }}
            >
              + Add medication
            </button>
          </div>
        </div>

        {/* Comments */}
        <div>
          <label
            className="block text-sm font-medium mb-1.5"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Comments
          </label>
          <textarea
            value={formData.meds_and_comments}
            onChange={(event) =>
              handleChange("meds_and_comments", event.target.value)
            }
            placeholder="Observations, behavior notes..."
            rows={3}
            className="w-full px-4 py-2.5 rounded-xl input-base focus:outline-none resize-none"
          />
        </div>
      </form>
    </SlideOverPanel>
  );
}
