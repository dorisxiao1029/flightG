import React from "react";
import { Link } from "react-router-dom";
import { Plane, Clock, XCircle, AlertTriangle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import moment from "moment";

const statusConfig = {
  draft: { label: "Draft", color: "text-slate-400 bg-slate-500/10" },
  analyzing: { label: "Analyzing", color: "text-amber-400 bg-amber-500/10" },
  contacting_airline: { label: "Contacting airline", color: "text-sky-400 bg-sky-500/10" },
  negotiating: { label: "Negotiating", color: "text-sky-400 bg-sky-500/10" },
  solution_received: { label: "Solution received", color: "text-violet-400 bg-violet-500/10" },
  awaiting_user_confirmation: { label: "Needs your action", color: "text-amber-400 bg-amber-500/10" },
  completing: { label: "Completing", color: "text-sky-400 bg-sky-500/10" },
  closed_success: { label: "Resolved", color: "text-emerald-400 bg-emerald-500/10" },
  closed_failed: { label: "Unresolved", color: "text-rose-400 bg-rose-500/10" },
  cancelled: { label: "Cancelled", color: "text-slate-400 bg-slate-500/10" },
};

const disruptionIcon = {
  delay: Clock,
  cancellation: XCircle,
  diversion: AlertTriangle,
};

export default function CaseCard({ caseItem }) {
  const config = statusConfig[caseItem.status] || statusConfig.draft;
  const DIcon = disruptionIcon[caseItem.disruption_type] || Clock;
  const needsAction = caseItem.status === "awaiting_user_confirmation";

  return (
    <Link
      to={`/case/${caseItem.id}`}
      className={cn(
        "group block rounded-xl border border-white/5 bg-[#161B22] p-5 transition-all hover:border-[#2F81F7]/40 hover:bg-[#1C2330]",
        needsAction && "ring-1 ring-amber-500/30"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", config.color)}>
            <DIcon className="w-4.5 h-4.5" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold text-sm font-mono">{caseItem.flight_number}</span>
              <span className="text-[10px] text-slate-600 font-mono">{caseItem.case_number}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
              <span className="font-mono">{caseItem.origin}</span>
              <ArrowRight className="w-3 h-3 text-slate-600" />
              <span className="font-mono">{caseItem.destination}</span>
            </div>
          </div>
        </div>
        <span className={cn("shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium", config.color)}>
          {config.label}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs">
        <div className="text-slate-500">
          {caseItem.scheduled_departure
            ? moment(caseItem.scheduled_departure).format("MMM D, HH:mm")
            : "—"}
        </div>
        <div className="flex items-center gap-1.5 text-slate-500 group-hover:text-[#2F81F7] transition-colors">
          View
          <ArrowRight className="w-3 h-3" />
        </div>
      </div>
    </Link>
  );
}