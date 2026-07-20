import React from "react";
import { Plane, DollarSign, Utensils, Hotel, Check, X, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import moment from "moment";

export default function SolutionCard({ caseItem, onDecision }) {
  const pending = caseItem.user_decision === "pending";

  return (
    <div className="rounded-xl border border-[#2F81F7]/30 bg-gradient-to-b from-[#2F81F7]/[0.08] to-transparent p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1.5 h-1.5 rounded-full bg-[#2F81F7] animate-pulse" />
        <h3 className="text-sm font-semibold text-white">Proposed Solution</h3>
        {pending && (
          <span className="ml-auto text-[11px] text-amber-400 font-medium">
            Awaiting your decision
          </span>
        )}
      </div>

      <p className="text-sm text-slate-300 leading-relaxed mb-4">
        {caseItem.solution_summary || "No solution summary yet."}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {caseItem.rebook_flight_number && (
          <Detail icon={Plane} label="Rebooked flight" value={caseItem.rebook_flight_number} />
        )}
        {caseItem.rebook_departure && (
          <Detail
            icon={Plane}
            label="New departure"
            value={moment(caseItem.rebook_departure).format("MMM D, HH:mm")}
          />
        )}
        {caseItem.proposed_compensation_usd != null && (
          <Detail
            icon={DollarSign}
            label="Compensation"
            value={`$${caseItem.proposed_compensation_usd.toLocaleString()}`}
            highlight
          />
        )}
        {caseItem.assistance_offered && (
          <Detail icon={caseItem.assistance_offered.toLowerCase().includes("hotel") ? Hotel : Utensils} label="Assistance" value={caseItem.assistance_offered} />
        )}
      </div>

      {pending && (
        <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-white/5">
          <button
            onClick={() => onDecision("accepted")}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium transition-colors"
          >
            <Check className="w-4 h-4" strokeWidth={2.5} />
            Accept
          </button>
          <button
            onClick={() => onDecision("renegotiate")}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 text-sm font-medium transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Renegotiate
          </button>
          <button
            onClick={() => onDecision("rejected")}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-rose-400 text-sm font-medium transition-colors"
          >
            <X className="w-4 h-4" />
            Reject
          </button>
        </div>
      )}
      {caseItem.user_decision === "accepted" && (
        <div className="mt-4 pt-4 border-t border-white/5 text-xs text-emerald-400 font-medium">
          ✓ You accepted this solution. The agent is finalizing.
        </div>
      )}
      {caseItem.user_decision === "rejected" && (
        <div className="mt-4 pt-4 border-t border-white/5 text-xs text-rose-400 font-medium">
          You rejected this solution.
        </div>
      )}
      {caseItem.user_decision === "renegotiate" && (
        <div className="mt-4 pt-4 border-t border-white/5 text-xs text-sky-400 font-medium">
          The agent is renegotiating for a better outcome…
        </div>
      )}
    </div>
  );
}

function Detail({ icon: Icon, label, value, highlight }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg bg-white/[0.03] border border-white/5 px-3 py-2.5">
      <Icon className={cn("w-4 h-4 shrink-0", highlight ? "text-emerald-400" : "text-slate-500")} />
      <div className="min-w-0">
        <div className="text-[10px] text-slate-500 uppercase tracking-wide">{label}</div>
        <div className={cn("text-sm font-medium truncate", highlight ? "text-emerald-400 font-mono" : "text-slate-200")}>
          {value}
        </div>
      </div>
    </div>
  );
}