"use client";

import { useState } from "react";
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
}

export function IntakeEditModal({
  isOpen,
  onClose,
  initialData,
  onSave,
}: IntakeEditModalProps) {
  const [formData, setFormData] = useState<ParsedIntake>(initialData);

  const handleChange = (field: keyof ParsedIntake, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Intake" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
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
            label="Quantity"
            type="number"
            min="1"
            value={formData.quantity || 1}
            onChange={(e) => handleChange("quantity", parseInt(e.target.value))}
          />
          <div>
            <label className="block text-sm font-medium text-primary-text mb-1.5">
              Sex
            </label>
            <select
              value={formData.sex || "Unknown"}
              onChange={(e) => handleChange("sex", e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-soft-mist rounded-xl text-primary-text focus:outline-none focus:ring-2 focus:ring-wildlife-green"
            >
              {SEX_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-text mb-1.5">
              Intake Reason
            </label>
            <select
              value={formData.intake_reason || "Unknown"}
              onChange={(e) => handleChange("intake_reason", e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-soft-mist rounded-xl text-primary-text focus:outline-none focus:ring-2 focus:ring-wildlife-green"
            >
              {INTAKE_REASON_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Found Location"
            value={formData.found_location || ""}
            onChange={(e) => handleChange("found_location", e.target.value)}
            placeholder="Where was the animal found?"
          />
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
        <div>
          <label className="block text-sm font-medium text-primary-text mb-1.5">
            Description
          </label>
          <textarea
            value={formData.how_description || ""}
            onChange={(e) => handleChange("how_description", e.target.value)}
            placeholder="How was the animal found? What happened?"
            rows={3}
            className="w-full px-4 py-2.5 bg-white border border-soft-mist rounded-xl text-primary-text placeholder-secondary-text focus:outline-none focus:ring-2 focus:ring-wildlife-green resize-none"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Save Intake</Button>
        </div>
      </form>
    </Modal>
  );
}
