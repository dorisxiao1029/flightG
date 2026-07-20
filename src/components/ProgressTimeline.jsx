import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  { key: "analyzing", label: "Analyzing disruption" },
  { key: "contacting_airline", label: "Contacting airline" },
  { key: "negotiating", label: "Negotiating" },
  { key: "solution_received", label: "Solution received" },
  { key: "awaiting_user_confirmation", label: "Awaiting your confirmation" },
  { key: "completing", label: "Finalizing" },
  { key: "closed_success", label: "Resolved" },
];

const order = steps.map((s) => s.key);

export default function ProgressTimeline({ status }) {
  const currentIdx = order.indexOf(status);
  const failed = status === "closed_failed";

  return (
    <div className="space-y-0">
      {steps.map((step, idx) => {
        const done = currentIdx > idx || status === "closed_success";
        const active = currentIdx === idx;
        const skipped = failed;
        return (
          <div key={step.key} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors",
                  done && "bg-[#2F81F7] text-white",
                  active && !skipped && "bg-[#2F81F7]/15 text-[#2F81F7] ring-2 ring-[#2F81F7]/40",
                  (!done && !active) && "bg-white/5 text-slate-600",
                  active && failed && "bg-rose-500/15 text-rose-400 ring-2 ring-rose-500/30"
                )}
              >
                {done ? (
                  <Check className="w-3.5 h-3.5" strokeWidth={3} />
                ) : active ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                ) : (
                  <span className="w-1 h-1 rounded-full bg-current" />
                )}
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={cn(
                    "w-px flex-1 my-1",
                    done ? "bg-[#2F81F7]/40" : "bg-white/5"
                  )}
                />
              )}
            </div>
            <div className="pb-5">
              <div
                className={cn(
                  "text-sm font-medium transition-colors",
                  done && "text-slate-300",
                  active && !skipped && "text-white",
                  (!done && !active) && "text-slate-600",
                  active && failed && "text-rose-300"
                )}
              >
                {step.label}
              </div>
              {active && (
                <div className="text-xs text-slate-500 mt-0.5">
                  {failed ? "Unable to reach a resolution" : "Agent is working on this step…"}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}