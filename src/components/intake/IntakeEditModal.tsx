"use client";

import { useState, useEffect, ReactNode } from "react";
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

const TEXTAREA_BASE_CLASS =
  "w-full px-4 py-3 rounded-xl input-base focus:outline-none resize-none overflow-y-auto h-28 leading-relaxed";

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
      size="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-7">
        <FormSection title="Core Intake">
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
            <DateTimeField
              label="Intake Date"
              value={formatDateTimeLocal(formData.intake_date)}
              onChange={(value) => handleChange("intake_date", value)}
              hint="Select date and time"
            />
            <Input
              label="Quantity"
              type="number"
              min="1"
              value={formData.quantity || 1}
              onChange={(e) =>
                handleChange("quantity", Number.parseInt(e.target.value, 10) || 1)
              }
            />
            <SelectField
              label="Sex"
              value={formData.sex || "Unknown"}
              onChange={(value) => handleChange("sex", value)}
              options={SEX_OPTIONS}
            />
            <SelectField
              label="Intake Reason"
              value={formData.intake_reason || "Unknown"}
              onChange={(value) => handleChange("intake_reason", value)}
              options={INTAKE_REASON_OPTIONS}
            />
          </div>

          <TextAreaField
            label="Found Location"
            value={formData.found_location || ""}
            onChange={(value) => handleChange("found_location", value)}
            placeholder="Where was the animal found?"
          />
        </FormSection>

        <FormSection title="Finder Details">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
            <DateTimeField
              label="Found Date"
              value={formatDateTimeLocal(formData.found_date)}
              onChange={(value) => handleChange("found_date", value)}
              hint="Select date and time"
            />
          </div>

          <TextAreaField
            label="Finder Address"
            value={formData.finder_address || ""}
            onChange={(value) => handleChange("finder_address", value)}
            placeholder="Finder mailing or home address"
          />
        </FormSection>

        <FormSection title="Animal Condition">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
          </div>

          <TextAreaField
            label="Food Offered"
            value={formData.food_offered || ""}
            onChange={(value) => handleChange("food_offered", value)}
            placeholder="Food or formula offered"
          />
        </FormSection>

        <FormSection title="Outcome & Clinical">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
            <DateTimeField
              label="Disposition Date"
              value={formatDateTimeLocal(formData.disposition_date)}
              onChange={(value) => handleChange("disposition_date", value)}
              hint="Select date and time"
            />
          </div>
        </FormSection>

        <FormSection title="Notes" withDivider={false}>
          <div className="space-y-4">
            <TextAreaField
              label="Description"
              value={formData.how_description || ""}
              onChange={(value) => handleChange("how_description", value)}
              placeholder="How was the animal found? What happened?"
            />
            <TextAreaField
              label="Notes"
              value={formData.notes || ""}
              onChange={(value) => handleChange("notes", value)}
              placeholder="Additional intake notes"
            />
            <TextAreaField
              label="Exam Notes"
              value={formData.exam_notes || ""}
              onChange={(value) => handleChange("exam_notes", value)}
              placeholder="Exam and treatment notes"
            />
          </div>
        </FormSection>

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

interface FormSectionProps {
  title: string;
  children: ReactNode;
  withDivider?: boolean;
}

function FormSection({ title, children, withDivider = true }: FormSectionProps) {
  return (
    <section
      className={`space-y-4 ${withDivider ? "section-divider pb-6" : ""}`}
    >
      <h3
        className="text-base font-semibold leading-snug"
        style={{ color: "var(--color-text-primary)" }}
      >
        {title}
      </h3>
      {children}
    </section>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
}

function SelectField({ label, value, onChange, options }: SelectFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2.5 rounded-xl input-base focus:outline-none"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

interface TextAreaFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

function TextAreaField({ label, value, onChange, placeholder }: TextAreaFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={TEXTAREA_BASE_CLASS}
      />
    </div>
  );
}

interface DateTimeFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint: string;
}

function DateTimeField({ label, value, onChange, hint }: DateTimeFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>
        {label}
      </label>
      <input
        type="datetime-local"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2.5 rounded-xl input-base focus:outline-none"
      />
      <p className="mt-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
        {hint}
      </p>
    </div>
  );
}
