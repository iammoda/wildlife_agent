"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MAX_RECORDING_SECONDS } from "@/lib/constants";

interface VoiceRecordButtonProps {
  onRecordComplete: (audioBlob: Blob) => void;
  disabled?: boolean;
}

export function VoiceRecordButton({
  onRecordComplete,
  disabled = false,
}: VoiceRecordButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: mimeType });
        onRecordComplete(audioBlob);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
      };
      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);
      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } catch (error) {
      console.error("Failed to start recording:", error);
      alert("Could not access microphone. Please check your permissions.");
    }
  }, [onRecordComplete]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isRecording]);

  useEffect(() => {
    if (isRecording && duration >= MAX_RECORDING_SECONDS) {
      stopRecording();
    }
  }, [duration, isRecording, stopRecording]);

  const handleClick = () => {
    if (disabled) return;
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const remainingTime = MAX_RECORDING_SECONDS - duration;
  const showWarning = isRecording && remainingTime <= 15;
  const isUrgent = isRecording && remainingTime <= 5;

  return (
    <div className="relative">
      {isRecording && (
        <div
          className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded-full text-xs font-mono whitespace-nowrap"
          style={{
            backgroundColor: isUrgent
              ? "var(--color-error)"
              : showWarning
              ? "var(--color-error)"
              : "var(--color-bg-elevated)",
            color: showWarning ? "white" : "var(--color-text-secondary)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          {showWarning ? `${remainingTime}s left` : formatDuration(duration)}
        </div>
      )}

      <button
        onClick={handleClick}
        disabled={disabled}
        className="p-2 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          color: isRecording ? "white" : "var(--color-text-secondary)",
          backgroundColor: isRecording ? "var(--color-error)" : "transparent",
          transform: isRecording ? "scale(1.05)" : "scale(1)",
          boxShadow: isRecording ? "0 4px 12px color-mix(in srgb, var(--color-error) 30%, transparent)" : "none",
        }}
        aria-label={isRecording ? "Stop recording" : "Start recording"}
      >
        {isRecording ? (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        ) : (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
            strokeLinecap="round"
          >
            <line x1="4" y1="8" x2="4" y2="16" />
            <line x1="8" y1="6" x2="8" y2="18" />
            <line x1="12" y1="4" x2="12" y2="20" />
            <line x1="16" y1="6" x2="16" y2="18" />
            <line x1="20" y1="8" x2="20" y2="16" />
          </svg>
        )}
      </button>
    </div>
  );
}
