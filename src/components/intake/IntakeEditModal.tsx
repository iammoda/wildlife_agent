"use client";

import { useState, useEffect } from "react";
import { ParsedIntake } from "@/lib/types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SEX_OPTIONS, INTAKE_REASON_OPTIONS } from "@/lib/constants";

interface IntakeEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: ParsedIntake;
  onSave: (data: ParsedIntake) => void;
  mode?: "create" | "edit";
}

export function IntakeEditModal({
  isOpen,
  onClose,
  initialData,
  onSave,
  mode = "create",
}: IntakeEditModalProps) {
  const [formData, setFormData] = useState<ParsedIntake>(initialData);

  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  const handleChange = (field: keyof ParsedIntake, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const formatDateTimeLocal = (value?: string | null): string => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 16);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === "edit" ? "Edit Intake" : "New Intake"}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label="Intake Number"
            value={formData.intake_number || ""}
            onChange={(e) => handleChange("intake_number", e.target.value)}
            placeholder="e.g., 2026-001"
            required
          />
          <Input
            label="Species"
            value={formData.species || ""}
            onChange={(e) => handleChange("species", e.target.value)}
            placeholder="e.g., Eastern Gray Squirrel"
            required
          />
          <Input
            label="Intake Date"
            type="datetime-local"
            value={formatDateTimeLocal(formData.intake_date)}
            onChange={(e) => handleChange("intake_date", e.target.value)}
          />
          <Input
            label="Quantity"
            type="number"
            min="1"
            value={formData.quantity || 1}
            onChange={(e) => handleChange("quantity", parseInt(e.target.value))}
          />
          <div>
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Sex
            </label>
            <select
              value={formData.sex || "Unknown"}
              onChange={(e) => handleChange("sex", e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl input-base focus:outline-none"
            >
              {SEX_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Intake Reason
            </label>
            <select
              value={formData.intake_reason || "Unknown"}
              onChange={(e) => handleChange("intake_reason", e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl input-base focus:outline-none"
            >
              {INTAKE_REASON_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Finder Name"
            value={formData.finder_name || ""}
            onChange={(e) => handleChange("finder_name", e.target.value)}
            placeholder="Who found the animal?"
          />
          <Input
            label="Finder Phone"
            value={formData.finder_phone || ""}
            onChange={(e) => handleChange("finder_phone", e.target.value)}
            placeholder="Phone number"
          />
          <Input
            label="Finder Email"
            type="email"
            value={formData.finder_email || ""}
            onChange={(e) => handleChange("finder_email", e.target.value)}
            placeholder="name@example.com"
          />
          <Input
            label="Found Date"
            type="datetime-local"
            value={formatDateTimeLocal(formData.found_date)}
            onChange={(e) => handleChange("found_date", e.target.value)}
          />
          <Input
            label="Weight"
            value={formData.weight || ""}
            onChange={(e) => handleChange("weight", e.target.value)}
            placeholder="e.g., 45g"
          />
          <Input
            label="Age"
            value={formData.age || ""}
            onChange={(e) => handleChange("age", e.target.value)}
            placeholder="e.g., 3 weeks, Adult"
          />
          <Input
            label="Distress Code"
            value={formData.distress_code || ""}
            onChange={(e) => handleChange("distress_code", e.target.value)}
            placeholder="e.g., A, B, C"
          />
          <Input
            label="Distress Subcode"
            value={formData.distress_subcode || ""}
            onChange={(e) => handleChange("distress_subcode", e.target.value)}
            placeholder="e.g., 1, 2, 3"
          />
          <Input
            label="Donation Amount"
            value={formData.donation_amount || ""}
            onChange={(e) => handleChange("donation_amount", e.target.value)}
            placeholder="e.g., 25.00"
          />
          <Input
            label="Disposition Code"
            value={formData.disposition || ""}
            onChange={(e) => handleChange("disposition", e.target.value)}
            placeholder="e.g., UC, R, E"
          />
          <Input
            label="Disposition Date"
            type="datetime-local"
            value={formatDateTimeLocal(formData.disposition_date)}
            onChange={(e) => handleChange("disposition_date", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Found Location
            </label>
            <textarea
              value={formData.found_location || ""}
              onChange={(e) => handleChange("found_location", e.target.value)}
              placeholder="Where was the animal found?"
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl input-base focus:outline-none resize-y"
            />
          </div>
          <div>
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Finder Address
            </label>
            <textarea
              value={formData.finder_address || ""}
              onChange={(e) => handleChange("finder_address", e.target.value)}
              placeholder="Finder mailing or home address"
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl input-base focus:outline-none resize-y"
            />
          </div>
          <div>
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Food Offered
            </label>
            <textarea
              value={formData.food_offered || ""}
              onChange={(e) => handleChange("food_offered", e.target.value)}
              placeholder="Food or formula offered"
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl input-base focus:outline-none resize-y"
            />
          </div>
          <div>
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Notes
            </label>
            <textarea
              value={formData.notes || ""}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Additional intake notes"
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl input-base focus:outline-none resize-y"
            />
          </div>
          <div>
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Exam Notes
            </label>
            <textarea
              value={formData.exam_notes || ""}
              onChange={(e) => handleChange("exam_notes", e.target.value)}
              placeholder="Exam and treatment notes"
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl input-base focus:outline-none resize-y"
            />
          </div>
          <div>
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Description
            </label>
            <textarea
              value={formData.how_description || ""}
              onChange={(e) => handleChange("how_description", e.target.value)}
              placeholder="How was the animal found? What happened?"
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl input-base focus:outline-none resize-y"
            />
          </div>
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
            {mode === "edit" ? "Save Changes" : "Save Intake"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
