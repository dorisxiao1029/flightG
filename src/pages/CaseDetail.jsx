import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Plane, DollarSign, Scale, Radio } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import ProgressTimeline from "@/components/ProgressTimeline";
import ChatLog from "@/components/ChatLog";
import SolutionCard from "@/components/SolutionCard";
import moment from "moment";

export default function CaseDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const [caseItem, setCaseItem] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  const load = useCallback(() => {
    Promise.all([
      base44.entities.FlightCase.get(id),
      base44.entities.CommunicationLog.filter({ case_id: id }, "created_date", 200),
    ])
      .then(([c, l]) => {
        setCaseItem(c);
        setLogs(l);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
    const unsubscribe = base44.entities.CommunicationLog.subscribe(() => load());
    return unsubscribe;
  }, [load]);

  // Simulated agent progress: advances through steps when in an active state
  useEffect(() => {
    if (!caseItem) return;
    const activeStates = ["analyzing", "contacting_airline", "negotiating", "solution_received"];
    if (!activeStates.includes(caseItem.status)) return;
    if (caseItem.user_decision === "renegotiate") return;

    const timer = setTimeout(async () => {
      await advanceCase(caseItem);
      load();
    }, 4500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseItem?.status, caseItem?.id]);

  const advanceCase = async (c) => {
    const transitions = {
      analyzing: {
        status: "contacting_airline",
        label: "Contacting airline",
        log: {
          direction: "system",
          channel: "system",
          sender: "System",
          content: `Regulation matched: ${c.applicable_regulation}. Max entitlement: $${c.max_compensation_usd || "—"}. Reaching out via ${c.has_airline_api ? "airline API" : "preferred channel"}.`,
        },
      },
      contacting_airline: {
        status: "negotiating",
        label: "Negotiating",
        log: {
          direction: "outbound",
          channel: c.has_airline_api ? "api" : "phone",
          sender: "FlightGuard Agent",
          content: `Hello, regarding flight ${c.flight_number} (${c.origin}→${c.destination}) — the passenger experienced a ${c.disruption_type}. Requesting rebooking options and applicable compensation per ${c.applicable_regulation}.`,
        },
      },
      negotiating: {
        status: "solution_received",
        label: "Solution received",
        log: {
          direction: "inbound",
          channel: c.has_airline_api ? "api" : "phone",
          sender: c.airline_name || "Airline",
          content: `We apologize for the inconvenience. We can offer a rebooking and compensation as detailed in the proposed solution.`,
        },
      },
      solution_received: {
        status: "awaiting_user_confirmation",
        label: "Awaiting your confirmation",
        log: {
          direction: "system",
          channel: "system",
          sender: "System",
          content: "A solution has been proposed. Please review and decide.",
          requires_user_attention: true,
        },
      },
    };

    const next = transitions[c.status];
    if (!next) return;

    // On first transition out of analyzing, set regulation + comp if missing
    const patch = { status: next.status, current_step_label: next.label };
    if (c.status === "analyzing" && (!c.applicable_regulation || c.applicable_regulation === "Analyzing…")) {
      patch.applicable_regulation = "EU261";
      patch.max_compensation_usd = 600;
    }
    if (c.status === "negotiating") {
      patch.solution_summary = `Alternative flight available with ${c.airline_name || "the airline"}. Compensation offered within regulation limits.`;
      patch.proposed_compensation_usd = 520;
      patch.rebook_flight_number = c.flight_number.replace(/\d+$/, (n) => String(parseInt(n) + 1));
      patch.assistance_offered = "Hotel + meal vouchers";
    }

    await base44.entities.FlightCase.update(c.id, patch);
    await base44.entities.CommunicationLog.create({ ...next.log, case_id: c.id });
  };

  const handleDecision = async (decision) => {
    setActing(true);
    try {
      const patch = { user_decision: decision };
      if (decision === "accepted") {
        patch.status = "completing";
        patch.current_step_label = "Finalizing";
      } else if (decision === "rejected") {
        patch.status = "closed_failed";
        patch.current_step_label = "Closed — rejected";
      } else if (decision === "renegotiate") {
        patch.status = "negotiating";
        patch.current_step_label = "Renegotiating";
      }
      await base44.entities.FlightCase.update(caseItem.id, patch);
      await base44.entities.CommunicationLog.create({
        case_id: caseItem.id,
        direction: "system",
        channel: "system",
        sender: "System",
        content:
          decision === "accepted"
            ? "User accepted the solution. Agent is finalizing with the airline."
            : decision === "rejected"
            ? "User rejected the solution. Case closed."
            : "User requested renegotiation. Agent is re-engaging the airline.",
      });
      toast({ title: decision === "accepted" ? "Solution accepted" : "Decision recorded" });
      load();
    } finally {
      setActing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="h-32 rounded-xl bg-[#161B22] animate-pulse" />
      </div>
    );
  }
  if (!caseItem) {
    return (
      <div className="p-8 text-center text-slate-500">
        Case not found. <Link to="/" className="text-[#2F81F7]">Back</Link>
      </div>
    );
  }

  const closed = ["closed_success", "closed_failed", "cancelled"].includes(caseItem.status);

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 mb-5 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Dashboard
      </Link>

      {/* Case header */}
      <div className="rounded-xl border border-white/5 bg-[#161B22] p-5 mb-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-white font-mono">{caseItem.flight_number}</h1>
              <span className="text-xs text-slate-600 font-mono">{caseItem.case_number}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400 mt-1.5">
              <span className="font-mono">{caseItem.origin}</span>
              <Plane className="w-3.5 h-3.5 text-slate-600" />
              <span className="font-mono">{caseItem.destination}</span>
              <span className="text-slate-600">·</span>
              <span>{caseItem.scheduled_departure ? moment(caseItem.scheduled_departure).format("MMM D, HH:mm") : "—"}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#2F81F7]/10 text-[#2F81F7] text-xs font-medium">
              <Radio className="w-3 h-3" />
              {caseItem.current_step_label || caseItem.status}
            </span>
            <span className="text-[10px] text-slate-600 uppercase tracking-wide">
              via {caseItem.channel || (caseItem.has_airline_api ? "API" : "phone")}
            </span>
          </div>
        </div>
      </div>

      {/* Regulation banner */}
      <div className="rounded-xl border border-white/5 bg-[#161B22] p-4 mb-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center shrink-0">
          <Scale className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-slate-500">Applicable regulation</div>
          <div className="text-sm font-semibold text-white">{caseItem.applicable_regulation || "Analyzing…"}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-500">Max entitlement</div>
          <div className="text-sm font-bold text-emerald-400 font-mono">
            {caseItem.max_compensation_usd ? `$${caseItem.max_compensation_usd.toLocaleString()}` : "—"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Progress + solution */}
        <div className="lg:col-span-2 space-y-4">
          <Panel title="Progress">
            <ProgressTimeline status={caseItem.status} />
          </Panel>
          {(caseItem.solution_summary || caseItem.status === "awaiting_user_confirmation") && (
            <SolutionCard caseItem={caseItem} onDecision={handleDecision} />
          )}
          {closed && caseItem.user_decision === "accepted" && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4 text-sm text-emerald-300">
              <DollarSign className="w-4 h-4 inline mr-1.5" />
              Case resolved successfully.
            </div>
          )}
        </div>

        {/* Communication log */}
        <div className="lg:col-span-3">
          <Panel title="Communication log" subtitle="Live record of agent ↔ airline">
            <div className="max-h-[60vh] overflow-y-auto pr-1">
              <ChatLog logs={logs} />
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Panel({ title, subtitle, children }) {
  return (
    <div className="rounded-xl border border-white/5 bg-[#161B22] p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        {subtitle && <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}