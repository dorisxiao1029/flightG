import React from "react";
import { Plane, DollarSign, X, RefreshCw, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import moment from "moment";

export default function SolutionCard({ caseItem, onDecision }) {
  const pending = caseItem.user_decision === "pending";
  const refundValue = caseItem.dot_cash_value || caseItem.ticket_price_usd || 0;
  const rebookFlight = caseItem.rebook_flight_number;
  const rebookDeparture = caseItem.rebook_departure;
  const rebookCredit = caseItem.airline_benefit_value || 0;

  const chosenPath = caseItem.chosen_path;

  return (
    <div className="rounded-xl border border-[#2F81F7]/30 bg-gradient-to-b from-[#2F81F7]/[0.08] to-transparent p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1.5 h-1.5 rounded-full bg-[#2F81F7] animate-pulse" />
        <h3 className="text-sm font-semibold text-white">Airline offered — pick one path</h3>
        {pending && (
          <span className="ml-auto text-[11px] text-amber-400 font-medium">
            Awaiting your decision
          </span>
        )}
      </div>

      <p className="text-sm text-slate-300 leading-relaxed mb-4">
        {caseItem.solution_summary || "Airline surfaced both DOT Part 260 options — refund and rebook are mutually exclusive."}
      </p>

      {pending ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Rebook path */}
          <PathCard
            title="Take the rebooking"
            summary={rebookFlight
              ? `Confirmed seat on ${rebookFlight}${rebookDeparture ? ` (${moment(rebookDeparture).format("MMM D, HH:mm")})` : ""}.`
              : "Next available flight, including partner/interline carriers."}
            bonus={rebookCredit > 0 ? `+ $${rebookCredit} goodwill credit` : null}
            footnote="You still get to your destination. Cash refund forfeited."
            onClick={() => onDecision({ type: "accept", path: "rebook" })}
            icon={Plane}
          />
          {/* Refund path */}
          <PathCard
            title="Take the cash refund"
            summary={`$${refundValue.toLocaleString()} back to your original payment method (7–10 business days).`}
            bonus="Guaranteed by DOT Part 260"
            footnote="You arrange onward travel yourself (or no longer need to)."
            onClick={() => onDecision({ type: "accept", path: "refund" })}
            icon={DollarSign}
          />
        </div>
      ) : (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06] p-3.5 flex items-center gap-3">
          {chosenPath === "refund" ? (
            <DollarSign className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <Plane className="w-5 h-5 text-emerald-400 shrink-0" />
          )}
          <div className="flex-1 min-w-0 text-sm">
            <div className="font-semibold text-white">
              {caseItem.user_decision === "accepted"
                ? chosenPath === "refund"
                  ? `Refund path locked — $${refundValue.toLocaleString()} in flight`
                  : `Rebook path locked${rebookFlight ? ` — ${rebookFlight}` : ""}`
                : caseItem.user_decision === "rejected"
                ? "Both paths rejected"
                : "Renegotiating"}
            </div>
            {caseItem.assistance_offered && (
              <div className="text-[11px] text-slate-500 mt-0.5">{caseItem.assistance_offered}</div>
            )}
          </div>
        </div>
      )}

      {pending && (
        <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-white/5">
          <button
            onClick={() => onDecision({ type: "renegotiate" })}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Neither — renegotiate for better terms
          </button>
          <button
            onClick={() => onDecision({ type: "reject" })}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/5 hover:bg-white/10 text-rose-400 text-xs font-medium transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Reject both — escalate to DOT
          </button>
        </div>
      )}
    </div>
  );
}

function PathCard({ title, summary, bonus, footnote, onClick, icon: Icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group text-left rounded-xl border border-white/10 bg-white/[0.02] hover:border-emerald-400/50 hover:bg-emerald-500/[0.04] p-4 transition-all"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg bg-[#2F81F7]/10 text-[#2F81F7] flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4" />
        </div>
        <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all mt-2" />
      </div>
      <div className="text-sm font-semibold text-white">{title}</div>
      <div className="text-[12px] text-slate-400 mt-1 leading-relaxed">{summary}</div>
      {bonus && (
        <div className="text-[11px] text-emerald-400 mt-2 font-medium">{bonus}</div>
      )}
      <div className="text-[10px] text-slate-600 mt-2 italic">{footnote}</div>
    </button>
  );
}
