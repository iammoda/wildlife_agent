"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface RegisterFormProps {
  email: string;
  initialName?: string | null;
  onSuccess: () => void;
}

export function RegisterForm({
  email,
  initialName = "",
  onSuccess,
}: RegisterFormProps) {
  const [name, setName] = useState(initialName ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/activate-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, password, confirmPassword }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Account setup failed");
        return;
      }
      onSuccess();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Your Name"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter your name"
        required
      />
      <Input
        label="Email"
        type="email"
        value={email}
        disabled
        readOnly
      />
      <Input
        label="Create Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="At least 8 characters"
        required
      />
      <Input
        label="Confirm Password"
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="Re-enter your password"
        required
      />
      {error && (
        <p className="text-sm" style={{ color: "var(--color-error)" }}>
          {error}
        </p>
      )}
      <Button type="submit" className="w-full" isLoading={isLoading}>
        Create Account
      </Button>
      <p
        className="text-center text-sm"
        style={{ color: "var(--color-text-secondary)" }}
      >
        This activation link is tied to the invited email above.
      </p>
    </form>
  );
}
