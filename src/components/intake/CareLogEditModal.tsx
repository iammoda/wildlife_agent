"use client";

import { useEffect, useState, FormEvent } from "react";
import { DailyCareLog } from "@/lib/types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface CareLogEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: Partial<DailyCareLog> & { intakeNumber?: string };
  onSave: (data: Partial<DailyCareLog>) => void;
  mode: "create" | "edit";
}

export function CareLogEditModal({
  isOpen,
  onClose,
  initialData,
  onSave,
  mode,
}: CareLogEditModalProps) {
  const [formData, setFormData] = useState({
    log_date: initialData.log_date
      ? new Date(initialData.log_date).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16),
    weight: initialData.weight || "",
    food_fed: initialData.food_fed || "",
    amount: initialData.amount || "",
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
      meds_and_comments: initialData.meds_and_comments || "",
    });
  }, [initialData]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSave({
      ...initialData,
      log_date: new Date(formData.log_date).toISOString(),
      weight: formData.weight || null,
      food_fed: formData.food_fed || null,
      amount: formData.amount || null,
      meds_and_comments: formData.meds_and_comments || null,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === "edit" ? "Edit Care Log" : "Add Care Log"}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {initialData.intakeNumber && (
          <div
            className="text-sm px-3 py-2 rounded-lg intake-row-accent"
            style={{
              backgroundColor: "var(--color-brand-light)",
              color: "var(--color-brand-accent)",
            }}
          >
            Intake: {initialData.intakeNumber}
          </div>
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
        <div>
          <label
            className="block text-sm font-medium mb-1.5"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Medications & Comments
          </label>
          <textarea
            value={formData.meds_and_comments}
            onChange={(event) =>
              handleChange("meds_and_comments", event.target.value)
            }
            placeholder="Any medications given or observations..."
            rows={3}
            className="w-full px-4 py-2.5 rounded-xl input-base focus:outline-none resize-none"
          />
        </div>
        <div className="section-divider flex justify-end gap-2 pt-3">
          <Button
            type="button"
            variant="ghost"
            className="btn-edit-subtle"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button type="submit" variant="ghost" className="btn-primary-green">
            {mode === "edit" ? "Save Changes" : "Add Care Log"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
