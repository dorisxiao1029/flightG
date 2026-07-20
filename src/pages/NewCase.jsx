import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Target, DollarSign, Plane, Bed, Shield } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import FlightInfoForm from "@/components/FlightInfoForm";
import { cn } from "@/lib/utils";

const intents = [
  { key: "rebook", label: "Rebook first", desc: "Prioritize finding the best alternative flight", icon: Plane },
  { key: "compensation", label: "Compensation first", desc: "Focus on claiming the maximum financial payout", icon: DollarSign },
  { key: "both", label: "Both", desc: "Pursue rebooking and compensation together", icon: Shield },
  { key: "assistance", label: "Meals & lodging", desc: "Arrange immediate food and accommodation", icon: Bed },
];

const FEE = 29;

export default function NewCase() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [flight, setFlight] = useState(null);
  const [disruptionType, setDisruptionType] = useState("delay");
  const [intent, setIntent] = useState("both");
  const [creating, setCreating] = useState(false);

  const handleParsed = (data) => {
    setFlight(data);
    setStep(2);
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      const caseNumber = `FG-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const created = await base44.entities.FlightCase.create({
        ...flight,
        case_number: caseNumber,
        disruption_type: disruptionType,
        user_intent: intent,
        status: "analyzing",
        current_step_label: "Analyzing disruption",
        fee_usd: FEE,
        fee_paid: true,
        applicable_regulation: "Analyzing…",
      });

      // Seed an initial system log
      await base44.entities.CommunicationLog.create({
        case_id: created.id,
        direction: "system",
        channel: "system",
        sender: "System",
        content: `Case opened for flight ${flight.flight_number}. Agent is analyzing the disruption.`,
      });

      toast({ title: "Case created", description: "The agent is now on it." });
      navigate(`/case/${created.id}`);
    } catch (e) {
      toast({ title: "Failed to create case", variant: "destructive" });
      setCreating(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto">
      <button
        onClick={() => (step === 1 ? navigate("/") : setStep(step - 1))}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-8">
        <StepDot n={1} active={step >= 1} label="Flight" />
        <Line active={step >= 2} />
        <StepDot n={2} active={step >= 2} label="Disruption" />
        <Line active={step >= 3} />
        <StepDot n={3} active={step >= 3} label="Intent" />
      </div>

      {step === 1 && (
        <Card title="Flight details" subtitle="Enter your flight or import it automatically.">
          <FlightInfoForm onParsed={handleParsed} onCancel={() => navigate("/")} />
        </Card>
      )}

      {step === 2 && flight && (
        <Card title="What happened?" subtitle="Tell the agent what disruption you're facing.">
          <div className="space-y-2">
            {[
              { key: "delay", label: "Delay", desc: "Flight departed/arrived late" },
              { key: "cancellation", label: "Cancellation", desc: "Flight was cancelled" },
              { key: "diversion", label: "Diversion", desc: "Flight rerouted to another airport" },
            ].map((opt) => (
              <button
                key={opt.key}
                onClick={() => setDisruptionType(opt.key)}
                className={cn(
                  "w-full text-left rounded-lg border p-3.5 transition-all",
                  disruptionType === opt.key
                    ? "border-[#2F81F7] bg-[#2F81F7]/10"
                    : "border-white/5 bg-white/[0.02] hover:border-white/10"
                )}
              >
                <div className="text-sm font-medium text-slate-200">{opt.label}</div>
                <div className="text-xs text-slate-500 mt-0.5">{opt.desc}</div>
              </button>
            ))}
          </div>
          <div className="flex justify-end gap-2 mt-5">
            <button onClick={() => setStep(1)} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200">
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="px-4 py-2 rounded-lg bg-[#2F81F7] hover:bg-[#1F6FE0] text-white text-sm font-medium"
            >
              Continue
            </button>
          </div>
        </Card>
      )}

      {step === 3 && flight && (
        <Card title="Your priority" subtitle="What should the agent focus on?">
          <div className="space-y-2">
            {intents.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.key}
                  onClick={() => setIntent(opt.key)}
                  className={cn(
                    "w-full text-left rounded-lg border p-3.5 transition-all flex items-start gap-3",
                    intent === opt.key
                      ? "border-[#2F81F7] bg-[#2F81F7]/10"
                      : "border-white/5 bg-white/[0.02] hover:border-white/10"
                  )}
                >
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", intent === opt.key ? "bg-[#2F81F7]/20 text-[#2F81F7]" : "bg-white/5 text-slate-500")}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-200">{opt.label}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{opt.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Fee summary */}
          <div className="mt-5 rounded-lg border border-white/5 bg-white/[0.02] p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500">Service fee (per case)</div>
              <div className="text-lg font-bold text-white font-mono">${FEE}</div>
            </div>
            <div className="text-right text-xs text-slate-500">
              Charged only when the agent<br />begins processing
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-5">
            <button onClick={() => setStep(2)} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200">
              Back
            </button>
            <button
              onClick={handleCreate}
              disabled={creating}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2F81F7] hover:bg-[#1F6FE0] text-white text-sm font-medium disabled:opacity-50"
            >
              <Target className="w-4 h-4" />
              {creating ? "Launching agent…" : "Launch agent"}
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}

function StepDot({ n, active, label }) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors", active ? "bg-[#2F81F7] text-white" : "bg-white/5 text-slate-600")}>
        {n}
      </div>
      <span className={cn("text-xs font-medium hidden sm:inline", active ? "text-slate-200" : "text-slate-600")}>{label}</span>
    </div>
  );
}

function Line({ active }) {
  return <div className={cn("h-px flex-1 mx-1", active ? "bg-[#2F81F7]/50" : "bg-white/5")} />;
}

function Card({ title, subtitle, children }) {
  return (
    <div className="rounded-xl border border-white/5 bg-[#161B22] p-6">
      <h2 className="text-base font-semibold text-white">{title}</h2>
      <p className="text-xs text-slate-500 mt-0.5 mb-5">{subtitle}</p>
      {children}
    </div>
  );
}