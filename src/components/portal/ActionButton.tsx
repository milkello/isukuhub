"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type ActionButtonProps = {
  label: string;
  pendingLabel?: string;
  className?: string;
  action: (payload?: unknown) => Promise<unknown>;
  payload?: unknown;
};

export default function ActionButton({
  label,
  pendingLabel = "Working...",
  className,
  action,
  payload,
}: ActionButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleClick = () => {
    setFeedback(null);
    startTransition(async () => {
      try {
        await action(payload);
        router.refresh();
      } catch (error) {
        setFeedback(error instanceof Error ? error.message : "Action failed.");
      }
    });
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className={
          className ??
          "rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        }
      >
        {isPending ? pendingLabel : label}
      </button>
      {feedback ? (
        <p className="text-xs text-red-600">{feedback}</p>
      ) : null}
    </div>
  );
}
