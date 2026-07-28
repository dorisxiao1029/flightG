import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Plane, DollarSign, Scale, Radio } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import ProgressTimeline from "@/components/ProgressTimeline";
import ChatLog from "@/components/ChatLog";
import SolutionCard from "@/components/SolutionCard";
import { logWithEvidence } from "@/lib/evidenceStore";
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
    const unsubLogs = base44.entities.CommunicationLog.subscribe(() => load());
    const unsubCase = base44.entities.FlightCase.subscribe((e) => {
      if (e.id === id) load();
    });
    return () => {
      unsubLogs();
      unsubCase();
    };
  }, [load, id]);

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

  // Client-side simulation of the agent pipeline. Each tick advances one step.
  // Reflects the real channel plan: chat first → escalate to phone if chat
  // queue is long or bot can't process a refund → email as parallel paper trail.
  // At solution time, the airline surfaces BOTH mutually-exclusive DOT paths
  // (refund vs rebook) — the user picks in SolutionCard.
  const advanceCase = async (c) => {
    const airline = c.airline_name || "Airline";
    const refundValue = c.dot_cash_value || c.ticket_price_usd || 0;

    const transitions = {
      analyzing: {
        status: "contacting_airline",
        label: "Opening live chat",
        patch: { channel: "chat" },
        log: {
          direction: "system",
          channel: "chat",
          sender: "System",
          content: `Agent opened ${airline}'s live chat widget. Case reference cited, human-handoff requested. Queue estimate: ~3 min.`,
          metadata: { event: "channel_opened", channel: "chat" },
        },
      },
      contacting_airline: {
        status: "negotiating",
        label: "Chat bot — negotiating",
        patch: { channel: "chat" },
        log: {
          direction: "outbound",
          channel: "chat",
          sender: "Envoy",
          content: `Hello — I'm representing the passenger on ${c.flight_number} (${c.origin}→${c.destination}, ${new Date(c.scheduled_departure || Date.now()).toDateString()}). The flight was ${c.disruption_type === "cancellation" ? "cancelled" : `delayed ${c.delay_minutes} minutes`}${c.disruption_reason ? ` due to ${c.disruption_reason}` : ""}. Under DOT 14 CFR Part 260, the passenger is entitled to EITHER (A) rebooking on the earliest available flight (including interline partners) OR (B) a full cash refund of $${refundValue}. Please confirm which options you can process on this channel.`,
          metadata: { event: "opening_ask", channel: "chat" },
        },
      },
      negotiating: {
        status: "solution_received",
        label: "Options received",
        patch: {
          solution_summary: `${airline} confirmed both DOT Part 260 paths. You must choose one — they are mutually exclusive.`,
          proposed_compensation_usd: refundValue,
          rebook_flight_number: c.flight_number?.replace(/\d+$/, (n) => String(parseInt(n) + 1)),
          rebook_departure: new Date(Date.now() + 5 * 3600 * 1000).toISOString(),
          assistance_offered: c.controllable
            ? "Meal voucher included with either path. Hotel if overnight."
            : "Rebooking or refund only (uncontrollable — no meal/hotel duty).",
        },
        log: {
          direction: "inbound",
          channel: "chat",
          sender: airline,
          content: `Confirmed. For this disruption we can offer: (A) Rebook on the next available flight — earliest option departs in ~5 hours, or via partner if you prefer. Voluntary $${c.airline_benefit_value || 0} travel credit included as goodwill. (B) Full cash refund of $${refundValue} per DOT Part 260 — you decline rebooking. ${c.controllable ? "Meal voucher applies to either. Hotel available if overnight." : "No meal/hotel duty — uncontrollable cause."} Please advise which option the passenger prefers.`,
          metadata: { event: "airline_offer", refund_value: refundValue, rebook_available: true },
        },
      },
      solution_received: {
        status: "awaiting_user_confirmation",
        label: "Awaiting your choice",
        patch: {},
        log: {
          direction: "system",
          channel: "system",
          sender: "System",
          content: "Airline surfaced both DOT Part 260 paths. Refund and rebook are mutually exclusive — please pick one.",
          metadata: { event: "user_decision_required" },
          requires_user_attention: true,
        },
      },
    };

    const next = transitions[c.status];
    if (!next) return;

    const patch = { status: next.status, current_step_label: next.label, ...(next.patch || {}) };
    const updated = await base44.entities.FlightCase.update(c.id, patch);
    await logWithEvidence({
      caseItem: updated || { ...c, ...patch },
      log: { ...next.log, case_id: c.id },
    });
  };

  // decision = { type: 'accept', path: 'refund' | 'rebook' } | { type: 'reject' } | { type: 'renegotiate' }
  const handleDecision = async (decision) => {
    setActing(true);
    try {
      const airline = caseItem.airline_name || "Airline";
      const refundValue = caseItem.dot_cash_value || caseItem.ticket_price_usd || 0;
      const rebookFlight = caseItem.rebook_flight_number || "next available";
      const rebookCredit = caseItem.airline_benefit_value || 0;

      const patch = { user_decision: decision.type === "accept" ? "accepted" : decision.type === "reject" ? "rejected" : "renegotiate" };
      let logContent = "";

      if (decision.type === "accept") {
        patch.status = "completing";
        patch.chosen_path = decision.path;
        if (decision.path === "refund") {
          patch.current_step_label = `Finalizing $${refundValue} cash refund`;
          patch.proposed_compensation_usd = refundValue;
          patch.assistance_offered = "Cash refund — no rebooking, per DOT Part 260.";
          logContent = `User picked the REFUND path. Agent instructing ${airline} to process $${refundValue} cash refund to the original payment method (7–10 business days). Rebooking declined per DOT Part 260 mutual-exclusivity.`;
        } else {
          patch.current_step_label = `Finalizing rebooking on ${rebookFlight}`;
          patch.proposed_compensation_usd = rebookCredit;
          patch.assistance_offered = `Rebooked on ${rebookFlight}${rebookCredit ? ` + $${rebookCredit} goodwill credit` : ""}.`;
          logContent = `User picked the REBOOK path. Agent instructing ${airline} to confirm seat on ${rebookFlight}${rebookCredit ? ` and issue $${rebookCredit} travel credit` : ""}. Cash refund declined per DOT Part 260 mutual-exclusivity.`;
        }
      } else if (decision.type === "reject") {
        patch.status = "closed_failed";
        patch.current_step_label = "Closed — both paths rejected";
        logContent = "User rejected both DOT Part 260 paths. Agent will escalate to a formal DOT complaint (14 CFR Part 259) using the stored evidence chain.";
      } else {
        patch.status = "negotiating";
        patch.current_step_label = "Renegotiating";
        logContent = "User requested renegotiation. Agent re-engaging the airline for improved terms (goodwill credit, upgrade, hotel).";
      }

      const updated = await base44.entities.FlightCase.update(caseItem.id, patch);
      await logWithEvidence({
        caseItem: updated || { ...caseItem, ...patch },
        log: {
          case_id: caseItem.id,
          direction: "system",
          channel: "system",
          sender: "System",
          content: logContent,
          metadata: { event: "user_decision", decision: decision.type, path: decision.path },
        },
      });
      toast({
        title: decision.type === "accept"
          ? decision.path === "refund" ? "Refund path locked" : "Rebook path locked"
          : "Decision recorded",
      });
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
        Case not found. <Link to="/dashboard" className="text-[#2F81F7]">Back</Link>
      </div>
    );
  }

  const closed = ["closed_success", "closed_failed", "cancelled"].includes(caseItem.status);

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 mb-5 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Dashboard
      </Link>

      {/* Simulation banner — honest label until a real backend dispatcher is wired */}
      {caseItem.is_simulation && (
        <div className="rounded-lg border border-amber-500/25 bg-amber-500/[0.05] px-4 py-2.5 mb-4 flex items-start gap-2.5 text-xs">
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 font-semibold uppercase tracking-wider text-[10px] shrink-0">
            Simulation
          </span>
          <span className="text-slate-400 leading-relaxed">
            Real airline dispatch (chat / phone / email) is not wired yet. This
            case walks through the exact pipeline the agent will follow, using
            the strategy we computed. Every log line and evidence artifact
            below is real (written to storage) — only the airline replies are
            simulated.
          </span>
        </div>
      )}

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
          <div className="text-xs text-slate-500">Max benefit target</div>
          <div className="text-sm font-bold text-emerald-400 font-mono">
            {caseItem.max_benefit_usd ? `$${caseItem.max_benefit_usd.toLocaleString()}` : "—"}
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