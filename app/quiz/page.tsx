"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { quizQuestions } from "@/lib/quiz-data";
import { createClient } from "@/lib/supabase";

export default function QuizPage() {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [direction, setDirection] = useState<"in" | "out" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const question = quizQuestions[current];
  const totalSteps = quizQuestions.length;
  const progress = ((current + 1) / totalSteps) * 100;

  const currentAnswer = answers[question.field];
  const isAnswered = question.type === "multi"
    ? Array.isArray(currentAnswer) && currentAnswer.length > 0
    : !!currentAnswer;

  // Handle single-select
  const handleSingle = useCallback((value: string) => {
    setAnswers((prev) => ({ ...prev, [question.field]: value }));
    // Auto-advance after short delay
    setTimeout(() => {
      if (current < totalSteps - 1) {
        setDirection("out");
        setTimeout(() => {
          setCurrent((c) => c + 1);
          setDirection("in");
          setTimeout(() => setDirection(null), 300);
        }, 200);
      }
    }, 300);
  }, [current, question.field, totalSteps]);

  // Handle multi-select
  const handleMulti = useCallback((value: string) => {
    setAnswers((prev) => {
      const current = (prev[question.field] as string[]) || [];
      const maxSelect = question.max_select || 4;
      if (current.includes(value)) {
        return { ...prev, [question.field]: current.filter((v) => v !== value) };
      }
      if (current.length >= maxSelect) return prev;
      return { ...prev, [question.field]: [...current, value] };
    });
  }, [question.field, question.max_select]);

  // Navigate back
  const goBack = () => {
    if (current === 0) {
      router.back();
      return;
    }
    setDirection("out");
    setTimeout(() => {
      setCurrent((c) => c - 1);
      setDirection("in");
      setTimeout(() => setDirection(null), 300);
    }, 200);
  };

  // Submit quiz
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Save preferences to user metadata
        await supabase.auth.updateUser({
          data: {
            quiz_completed: true,
            preferences: answers,
          },
        });
      }
      // Navigate to profile creation
      router.push("/profile/create");
    } catch {
      // Even if save fails, proceed — data can be synced later
      router.push("/profile/create");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Advance on multi-select (manual)
  const advanceMulti = () => {
    if (current < totalSteps - 1) {
      setDirection("out");
      setTimeout(() => {
        setCurrent((c) => c + 1);
        setDirection("in");
        setTimeout(() => setDirection(null), 300);
      }, 200);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-white safe-top safe-bottom">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4">
        <button
          onClick={goBack}
          className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-surface"
          aria-label="Go back"
        >
          <svg className="h-5 w-5 text-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-sm font-medium text-muted">
          {current + 1} / {totalSteps}
        </span>
        <div className="w-11" /> {/* spacer */}
      </div>

      {/* Story-like progress bar */}
      <div className="flex gap-1 px-4 pt-3">
        {quizQuestions.map((_, i) => (
          <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
              style={{
                width: i < current ? "100%" : i === current ? `${progress % (100 / totalSteps) * totalSteps}%` : "0%",
              }}
            />
          </div>
        ))}
      </div>

      {/* Question content */}
      <div
        className={`flex flex-1 flex-col px-6 pt-8 transition-all duration-200 ease-out ${
          direction === "out"
            ? "translate-x-[-20px] opacity-0"
            : direction === "in"
            ? "translate-x-0 opacity-100"
            : ""
        }`}
      >
        {/* Question */}
        <h1 className="mb-8 text-center text-[26px] font-bold leading-tight text-dark">
          {question.question}
        </h1>

        {/* Options */}
        {question.type === "single" ? (
          <div className="flex flex-col gap-3">
            {question.options.map((option) => {
              const isSelected = currentAnswer === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => handleSingle(option.value)}
                  className={`flex items-center gap-4 rounded-[var(--radius-lg)] border-2 px-5 py-4 text-left transition-all duration-200 active:scale-[0.98] ${
                    isSelected
                      ? "border-primary bg-primary-bg shadow-[var(--shadow-button)]"
                      : "border-border bg-white hover:border-muted"
                  }`}
                >
                  <span className="text-2xl">{option.icon}</span>
                  <div className="flex-1">
                    <p className={`text-base font-semibold ${isSelected ? "text-primary" : "text-dark"}`}>
                      {option.label}
                    </p>
                    {option.sublabel && (
                      <p className="mt-0.5 text-sm text-dark-secondary">
                        {option.sublabel}
                      </p>
                    )}
                  </div>
                  {isSelected && (
                    <svg className="h-5 w-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          /* Multi-select (hobbies) */
          <div>
            <p className="mb-4 text-center text-sm text-muted">
              Pick up to {question.max_select || 4} (selected: {(currentAnswer as string[] || []).length})
            </p>
            <div className="grid grid-cols-3 gap-3">
              {question.options.map((option) => {
                const selected = Array.isArray(currentAnswer) && currentAnswer.includes(option.value);
                return (
                  <button
                    key={option.value}
                    onClick={() => handleMulti(option.value)}
                    className={`flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border-2 px-3 py-4 transition-all duration-200 active:scale-[0.95] ${
                      selected
                        ? "border-primary bg-primary-bg shadow-sm"
                        : "border-border bg-white hover:border-muted"
                    }`}
                  >
                    <span className="text-2xl">{option.icon}</span>
                    <span className={`text-xs font-medium ${selected ? "text-primary" : "text-dark-secondary"}`}>
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="px-6 pb-6 pt-4">
        {/* Multi-select: show Next button */}
        {question.type === "multi" && (
          <button
            onClick={current === totalSteps - 1 ? handleSubmit : advanceMulti}
            disabled={!isAnswered || isSubmitting}
            className="flex h-14 w-full items-center justify-center rounded-[var(--radius-lg)] bg-primary text-base font-semibold text-white shadow-[var(--shadow-button)] transition-all duration-200 hover:bg-primary-dark active:scale-[0.98] disabled:opacity-40 disabled:shadow-none"
          >
            {isSubmitting ? (
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="50 14" />
              </svg>
            ) : current === totalSteps - 1 ? (
              "Find My Matches ✨"
            ) : (
              "Continue →"
            )}
          </button>
        )}

        {/* Last single-select question: show Submit */}
        {question.type === "single" && current === totalSteps - 1 && isAnswered && (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex h-14 w-full items-center justify-center rounded-[var(--radius-lg)] bg-primary text-base font-semibold text-white shadow-[var(--shadow-button)] transition-all duration-200 hover:bg-primary-dark active:scale-[0.98] disabled:opacity-40 animate-fade-in-up"
          >
            {isSubmitting ? (
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="50 14" />
              </svg>
            ) : (
              "Find My Matches ✨"
            )}
          </button>
        )}
      </div>
    </div>
  );
}
