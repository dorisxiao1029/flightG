import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Target, DollarSign, Plane, Bed, Shield, Check, TrendingUp, Scale } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import FlightInfoForm from "@/components/FlightInfoForm";
import { buildStrategy } from "@/lib/usFlightRules";
import { logWithEvidence } from "@/lib/evidenceStore";
import { cn } from "@/lib/utils";

const intents = [
  { key: "rebook", label: "Rebook first", desc: "Prioritize finding the best alternative flight", icon: Plane },
  { key: "compensation", label: "Refund first", desc: "Focus on DOT cash refund and credits", icon: DollarSign },
  { key: "both", label: "Both", desc: "Pursue rebooking and refund together", icon: Shield },
  { key: "assistance", label: "Meals & lodging", desc: "Arrange immediate food and accommodation", icon: Bed },
];

const FEE = 29;

const VALID_DISRUPTIONS = new Set(["delay", "cancellation", "diversion"]);

export default function NewCase() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { isAuthenticated, navigateToLogin } = useAuth();
  const initialDisruption = (() => {
    const q = searchParams.get("disruption");
    return q && VALID_DISRUPTIONS.has(q) ? q : "delay";
  })();
  const [step, setStep] = useState(1);
  const [flight, setFlight] = useState(null);
  const [disruptionType, setDisruptionType] = useState(initialDisruption);
  const [delayMinutes, setDelayMinutes] = useState(180);
  const [disruptionReason, setDisruptionReason] = useState("");
  const [ticketPrice, setTicketPrice] = useState(350);
  const [intent, setIntent] = useState("both");
  const [strategy, setStrategy] = useState(null);
  const [creating, setCreating] = useState(false);

  const airlineIata = flight?.flight_number?.slice(0, 2).toUpperCase() || "";

  const computeStrategy = () => {
    const s = buildStrategy({
      airlineIata,
      disruptionType,
      delayMinutes: disruptionType === "cancellation" ? 0 : delayMinutes,
      disruptionReason,
      ticketPriceUsd: ticketPrice,
    });
    setStrategy(s);
    setStep(4);
  };

  const handleParsed = (data) => {
    setFlight(data);
    setStep(2);
  };

  const handleCreate = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Sign in to claim your benefits",
        description: "We only ask for login when the agent is about to act on your behalf.",
      });
      navigateToLogin();
      return;
    }
    setCreating(true);
    try {
      const caseNumber = `EV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const created = await base44.entities.FlightCase.create({
        ...flight,
        case_number: caseNumber,
        airline_iata: airlineIata,
        airline_name: strategy.airline.name,
        ticket_price_usd: ticketPrice,
        disruption_type: disruptionType,
        delay_minutes: disruptionType === "cancellation" ? 0 : delayMinutes,
        disruption_reason: disruptionReason,
        controllable: strategy.controllable,
        flight_verified: false,
        applicable_regulation: strategy.applicable_regulation,
        max_benefit_usd: strategy.max_benefit_usd,
        dot_cash_value: strategy.dot_cash_value,
        airline_benefit_value: strategy.airline_benefit_value,
        negotiation_strategy: strategy.negotiation_script,
        channel: "chat", // agent always starts on chat, escalates from there
        has_airline_api: false,
        user_intent: intent,
        status: "analyzing",
        current_step_label: "Queued for agent dispatch",
        is_simulation: true, // client-side simulation until backend dispatcher is wired
        fee_usd: FEE,
        fee_paid: true,
      });

      await logWithEvidence({
        caseItem: created,
        log: {
          case_id: created.id,
          direction: "system",
          channel: "system",
          sender: "System",
          content: `Case opened for ${flight.flight_number} (${strategy.airline.name}). Disruption: ${disruptionType}. Strategy computed: max benefit $${strategy.max_benefit_usd}.`,
          metadata: {
            event: "case_opened",
            strategy: {
              regulation: strategy.applicable_regulation,
              max_benefit_usd: strategy.max_benefit_usd,
              controllable: strategy.controllable,
            },
          },
        },
      });

      toast({ title: "Agent launched", description: `Pursuing $${strategy.max_benefit_usd} in total benefits.` });
      navigate(`/case/${created.id}`);
    } catch (e) {
      toast({ title: "Failed to create case", variant: "destructive" });
      setCreating(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto">
      <button
        onClick={() => (step === 1 ? navigate("/dashboard") : setStep(step - 1))}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="flex items-center gap-2 mb-8">
        <StepDot n={1} active={step >= 1} label="Flight" />
        <Line active={step >= 2} />
        <StepDot n={2} active={step >= 2} label="Disruption" />
        <Line active={step >= 3} />
        <StepDot n={3} active={step >= 3} label="Intent" />
        <Line active={step >= 4} />
        <StepDot n={4} active={step >= 4} label="Strategy" />
      </div>

      {step === 1 && (
        <Card title="Flight details" subtitle="Enter your US domestic flight.">
          <FlightInfoForm onParsed={handleParsed} onCancel={() => navigate("/dashboard")} />
        </Card>
      )}

      {step === 2 && flight && (
        <Card title="What happened?" subtitle="Tell the agent what disruption you're facing.">
          <div className="space-y-2 mb-5">
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
                  disruptionType === opt.key ? "border-[#2F81F7] bg-[#2F81F7]/10" : "border-white/5 bg-white/[0.02] hover:border-white/10"
                )}
              >
                <div className="text-sm font-medium text-slate-200">{opt.label}</div>
                <div className="text-xs text-slate-500 mt-0.5">{opt.desc}</div>
              </button>
            ))}
          </div>

          {disruptionType === "delay" && (
            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Delay duration (minutes)</label>
              <input
                type="number"
                value={delayMinutes}
                onChange={(e) => setDelayMinutes(parseInt(e.target.value) || 0)}
                min={15}
                step={15}
                className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-[#2F81F7]"
              />
              <p className="text-[11px] text-slate-600 mt-1">3+ hours = "significant delay" under DOT rules (triggers full refund right)</p>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Disruption reason (if known)</label>
            <input
              value={disruptionReason}
              onChange={(e) => setDisruptionReason(e.target.value)}
              placeholder="e.g. mechanical issue, crew shortage, weather"
              className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-[#2F81F7] placeholder:text-slate-700"
            />
            <p className="text-[11px] text-slate-600 mt-1">"Controllable" reasons (mechanical, crew) unlock more benefits</p>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Original ticket price (USD)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
              <input
                type="number"
                value={ticketPrice}
                onChange={(e) => setTicketPrice(parseInt(e.target.value) || 0)}
                className="w-full bg-white/[0.03] border border-white/10 rounded-lg pl-7 pr-3 py-2 text-sm text-slate-200 outline-none focus:border-[#2F81F7]"
              />
            </div>
            <p className="text-[11px] text-slate-600 mt-1">This is your DOT cash refund ceiling</p>
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={() => setStep(1)} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200">Back</button>
            <button onClick={() => setStep(3)} className="px-4 py-2 rounded-lg bg-[#2F81F7] hover:bg-[#1F6FE0] text-white text-sm font-medium">Continue</button>
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
                    intent === opt.key ? "border-[#2F81F7] bg-[#2F81F7]/10" : "border-white/5 bg-white/[0.02] hover:border-white/10"
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
            <button onClick={() => setStep(2)} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200">Back</button>
            <button
              onClick={computeStrategy}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2F81F7] hover:bg-[#1F6FE0] text-white text-sm font-medium"
            >
              <Scale className="w-4 h-4" />
              Compute strategy
            </button>
          </div>
        </Card>
      )}

      {step === 4 && strategy && (
        <div>
          <Card title="Strategy preview" subtitle="The agent will pursue this plan to maximize your benefit.">
            {/* Max benefit */}
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06] p-4 mb-4 flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500">Best outcome the agent will pursue</div>
                <div className="text-2xl font-bold text-emerald-400 font-mono">up to ${strategy.max_benefit_usd}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Depends on which path you accept below.</div>
              </div>
              <TrendingUp className="w-6 h-6 text-emerald-400/50" />
            </div>

            {/* Regulation */}
            <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3.5 mb-4 flex items-center gap-3">
              <Scale className="w-4 h-4 text-violet-400 shrink-0" />
              <div>
                <div className="text-xs text-slate-500">Applicable regulation</div>
                <div className="text-sm font-medium text-white">{strategy.applicable_regulation}</div>
              </div>
              <span className={cn("ml-auto text-[10px] px-2 py-0.5 rounded-full font-medium", strategy.controllable ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-500/10 text-slate-400")}>
                {strategy.controllable ? "Controllable" : "Uncontrollable"}
              </span>
            </div>

            {/* Two mutually-exclusive paths */}
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Choose one path (mutually exclusive)</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
              {(strategy.paths || []).map((p) => (
                <div key={p.key} className="rounded-lg border border-white/10 bg-white/[0.02] p-3.5">
                  <div className="flex items-baseline justify-between mb-1.5">
                    <div className="text-sm font-semibold text-white">{p.label}</div>
                    <div className="text-sm font-mono font-semibold text-emerald-400">${p.total_value}</div>
                  </div>
                  <div className="text-[11px] text-slate-500 leading-relaxed mb-2">{p.summary}</div>
                  {p.primary_claim && (
                    <div className="text-[11px] text-slate-400">
                      <span className="text-slate-500">Basis:</span> {p.primary_claim.basis}
                    </div>
                  )}
                  {p.bonus && (
                    <div className="text-[11px] text-emerald-400 mt-1.5">
                      + {p.bonus.right} (${p.bonus.value})
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Add-ons */}
            {strategy.add_ons?.length > 0 && (
              <>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Add-ons — apply to either path
                </div>
                <div className="space-y-1.5 mb-4">
                  {strategy.add_ons.map((a, i) => (
                    <div key={i} className="flex items-start gap-2.5 rounded-lg bg-white/[0.02] border border-white/5 p-3">
                      <Check className="w-3.5 h-3.5 text-[#2F81F7] shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-slate-200 font-medium">{a.right}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{a.basis}</div>
                      </div>
                      {a.value > 0 && (
                        <span className="text-sm font-mono font-semibold text-emerald-400 shrink-0">${a.value}</span>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Negotiation plan */}
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Agent negotiation plan</div>
            <div className="space-y-1.5 mb-5">
              {strategy.negotiation_script.map((step, i) => (
                <div key={i} className="flex gap-2.5 text-xs text-slate-400">
                  <span className="text-slate-600 font-mono shrink-0">{i + 1}.</span>
                  <span className="leading-relaxed">{step}</span>
                </div>
              ))}
            </div>

            {/* Channel plan */}
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Channel plan</div>
            <div className="space-y-1.5 mb-4">
              {(strategy.channel_plan || []).map((c) => (
                <div key={c.step} className="flex gap-2.5 items-start rounded-lg bg-white/[0.02] border border-white/5 p-2.5">
                  <span className="text-[10px] font-mono text-[#2F81F7] shrink-0 mt-0.5">{c.step}.</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-slate-200 font-medium capitalize">{c.channel}</div>
                    <div className="text-[11px] text-slate-500 leading-relaxed">{c.note}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-xs text-slate-600 mb-4">
              Airline: {strategy.airline.name}
            </div>
          </Card>

          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setStep(3)} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200">Back</button>
            <button
              onClick={handleCreate}
              disabled={creating}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2F81F7] hover:bg-[#1F6FE0] text-white text-sm font-medium disabled:opacity-50"
            >
              <Target className="w-4 h-4" />
              {creating
                ? "Launching agent…"
                : isAuthenticated
                ? "Launch agent"
                : "Sign in to launch"}
            </button>
          </div>
        </div>
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