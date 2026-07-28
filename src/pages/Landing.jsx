import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Shield,
  ArrowRight,
  Zap,
  Scale,
  Radio,
  MessageSquare,
  Lock,
  Phone,
  FileText,
  Hourglass,
  Plane,
  XCircle,
  HelpCircle,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { US_AIRLINES } from "@/lib/usFlightRules";
import { cn } from "@/lib/utils";

const AIRLINES = Object.entries(US_AIRLINES).map(([iata, meta]) => ({
  iata,
  name: meta.name,
}));

const DISRUPTIONS = [
  {
    icon: Plane,
    title: "Cancellations",
    desc: "Full DOT cash refund + rebooking rights, no matter the reason.",
    reg: "DOT Part 260 · § 259.5",
  },
  {
    icon: Zap,
    title: "Significant delays (3+ hrs)",
    desc: "Same refund right as a cancellation, plus meals & hotel on controllable delays.",
    reg: "DOT 14 CFR Part 259",
  },
  {
    icon: Radio,
    title: "Diversions",
    desc: "Rebooking obligation kicks in; agent negotiates hotel & ground transport.",
    reg: "Airline customer service plans",
  },
];

const HOW_IT_WORKS = [
  {
    n: "01",
    title: "Tell us your flight",
    desc: "30-second form: flight number, disruption type, ticket price. That's it.",
  },
  {
    n: "02",
    title: "We work every channel the airline exposes",
    desc: "Read your case, cite the exact federal regulation, then pick the channel that converts — live chat, phone, or email — and negotiate through every reply on your behalf.",
  },
  {
    n: "03",
    title: "Get your money — with an audit trail",
    desc: "Every step is stored as tamper-evident evidence. If the airline refuses, the same file goes to a DOT complaint automatically.",
  },
];

const PILLARS = [
  {
    icon: Zap,
    title: "Truly autonomous",
    desc: "Not a template letter you send yourself. The agent works the airline while you sleep.",
  },
  {
    icon: Scale,
    title: "DOT-cited strategy",
    desc: "Every claim is grounded in a specific 14 CFR regulation, not vague pressure.",
  },
  {
    icon: Lock,
    title: "Legal chain of custody",
    desc: "Each communication is written to immutable storage with a SHA-256 integrity hash.",
  },
  {
    icon: Radio,
    title: "Live status",
    desc: "Real-time updates on every agent step — from first call to final settlement.",
  },
];

const FAQ = [
  {
    q: "How much does it cost?",
    a: "A flat $29 per case, charged only when the agent begins processing. No commission on your refund. If the airline pays out $500, you keep $500.",
  },
  {
    q: "Which flights do you cover?",
    a: "U.S. domestic flights on the 8 largest airlines: Delta, American, United, Southwest, JetBlue, Alaska, Spirit, and Frontier. International + non-US carriers on the roadmap.",
  },
  {
    q: "Do I have to talk to the airline?",
    a: "No. That's the entire point. The agent handles the phone tree, the negotiation, the escalation. You get an email when a solution is on the table.",
  },
  {
    q: "What if the airline refuses?",
    a: "The agent automatically files a DOT complaint under 14 CFR Part 259 using the stored evidence chain. Airlines respond to DOT complaints in days, not weeks.",
  },
  {
    q: "Is my data safe?",
    a: "You browse anonymously until you're ready to claim. Login is required only at the moment the agent starts acting on your behalf — that's when trust matters.",
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) navigate("/dashboard", { replace: true });
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-[#0D1117] text-slate-200">
      {/* Nav */}
      <header className="border-b border-white/5 sticky top-0 z-30 backdrop-blur bg-[#0D1117]/80">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#2F81F7] flex items-center justify-center shadow-lg shadow-[#2F81F7]/20">
              <Shield className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <div className="leading-tight">
              <div className="text-white font-semibold text-sm tracking-tight">Envoy</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest">Passenger Advocate</div>
            </div>
          </Link>
          <nav className="flex items-center gap-1">
            <a href="#how" className="hidden sm:inline-block px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors">
              How it works
            </a>
            <a href="#coverage" className="hidden sm:inline-block px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors">
              Coverage
            </a>
            <a href="#faq" className="hidden sm:inline-block px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors">
              FAQ
            </a>
            <Link
              to="/login"
              className="ml-2 px-3 py-1.5 text-sm text-slate-300 hover:text-white transition-colors"
            >
              Sign in
            </Link>
            <Link
              to="/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#2F81F7] hover:bg-[#1F6FE0] text-white text-sm font-medium transition-colors shadow-lg shadow-[#2F81F7]/20"
            >
              Start free
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <GlowBackdrop />
        <div className="relative max-w-6xl mx-auto px-5 pt-16 pb-16 lg:pt-24 lg:pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Left: copy */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/[0.03] text-[11px] text-slate-400 mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                U.S. flights · Chat, phone, and email — around the clock
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-[1.05]">
                We handle the airline.{" "}
                <span className="text-[#2F81F7]">You just decide.</span>
              </h1>
              <p className="mt-6 text-base sm:text-lg text-slate-400 leading-relaxed max-w-xl">
                Thirty seconds to hand us the case — flight, what happened, what you
                want. From that moment on, every hour we spend on the airline is an hour
                you get back. Take the meeting. Catch your connection. Put the kids to
                bed. We're the ones on the calls, the chats, the emails, and the
                47-minute holds — and we only interrupt you when there's a decision
                only you can make.
              </p>
              <div className="mt-6 text-xs text-slate-600">
                $29 flat per case · Charged only when we start working · No commission on your refund
              </div>
            </div>

            {/* Right: action card + airlines marquee */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-[#161B22] p-6 sm:p-7 shadow-2xl shadow-black/40">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                  What happened to your flight?
                </div>
                <div className="space-y-2.5">
                  <DisruptionChoice
                    icon={Zap}
                    label="My flight was delayed"
                    desc="3+ hours late is where refunds unlock."
                    onClick={() => navigate("/new?disruption=delay")}
                  />
                  <DisruptionChoice
                    icon={XCircle}
                    label="My flight was canceled"
                    desc="You're owed a full cash refund, always."
                    onClick={() => navigate("/new?disruption=cancellation")}
                  />
                  <DisruptionChoice
                    icon={HelpCircle}
                    label="Something else"
                    desc="Diverted, denied boarding, tarmac stuck…"
                    onClick={() => navigate("/new?disruption=diversion")}
                  />
                </div>
                <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Free to check what you're owed</span>
                  <span className="text-emerald-400">✓ No signup required</span>
                </div>
              </div>

              <AirlineMarquee />
            </div>
          </div>
        </div>

        {/* Trust stats — what YOU don't have to do */}
        <div className="relative max-w-5xl mx-auto px-5 pb-16 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <TrustStat icon={Phone} value="0 calls" label="You never dial the airline" />
          <TrustStat icon={MessageSquare} value="Every message logged" label="Chat, phone, email transcripts stored & searchable" />
          <TrustStat icon={Radio} value="Live progress" label="Watch each airline reply land in real time" />
        </div>
      </section>

      {/* Problem framing — 3 pain points + solution callout */}
      <section className="border-t border-white/5">
        <div className="max-w-5xl mx-auto px-5 py-16 lg:py-24">
          <SectionHead
            eyebrow="The math"
            title="What claiming a refund costs you today."
            sub="Every minute is unpaid work you do while the airline hopes you give up."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10">
            <BigPainTile
              icon={Phone}
              value="47 min"
              label="Airline phone hold"
              detail="Average wait for a customer-service agent on a disruption day."
            />
            <BigPainTile
              icon={FileText}
              value="30 min"
              label="Drafting complaints"
              detail="Emails, receipts, DOT form, cover letter — before anyone reads it."
            />
            <BigPainTile
              icon={Hourglass}
              value="21 days"
              label="Follow-up back-and-forth"
              detail="Typical time to close a claim if the airline pushes back."
            />
          </div>

          <div className="mt-6 rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.06] p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-5">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
              <Zap className="w-6 h-6" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">With Envoy</div>
              <div className="text-2xl sm:text-3xl font-bold text-white mt-1">
                30 seconds of your time. Ever.
              </div>
              <div className="text-sm text-slate-400 mt-1">
                Tell us what happened. We do the rest — and only ping you when there's a decision to make.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-t border-white/5">
        <div className="max-w-6xl mx-auto px-5 py-16 lg:py-24">
          <SectionHead
            eyebrow="How it works"
            title="Three steps. Zero phone calls."
            sub="From disruption to settlement without lifting a finger."
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10">
            {HOW_IT_WORKS.map((s) => (
              <div key={s.n} className="rounded-xl border border-white/5 bg-[#161B22] p-6">
                <div className="text-[10px] font-mono text-[#2F81F7] tracking-widest">STEP {s.n}</div>
                <h3 className="text-lg font-semibold text-white mt-2">{s.title}</h3>
                <p className="text-sm text-slate-400 mt-2 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Coverage */}
      <section id="coverage" className="border-t border-white/5">
        <div className="max-w-6xl mx-auto px-5 py-16 lg:py-24">
          <SectionHead
            eyebrow="Coverage"
            title="What we handle"
            sub="Every disruption is mapped to the exact DOT regulation that unlocks compensation."
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10">
            {DISRUPTIONS.map((d) => {
              const Icon = d.icon;
              return (
                <div key={d.title} className="rounded-xl border border-white/5 bg-[#161B22] p-6">
                  <div className="w-9 h-9 rounded-lg bg-[#2F81F7]/10 text-[#2F81F7] flex items-center justify-center mb-3">
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <h3 className="text-base font-semibold text-white">{d.title}</h3>
                  <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">{d.desc}</p>
                  <div className="mt-4 pt-3 border-t border-white/5 text-[11px] font-mono text-violet-400">
                    {d.reg}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* Pillars */}
      <section className="border-t border-white/5">
        <div className="max-w-6xl mx-auto px-5 py-16 lg:py-24">
          <SectionHead
            eyebrow="Why Envoy"
            title="What makes it different from a template."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
            {PILLARS.map((p) => {
              const Icon = p.icon;
              return (
                <div
                  key={p.title}
                  className="rounded-xl border border-white/5 bg-[#161B22] p-5 hover:border-white/10 transition-colors"
                >
                  <Icon className="w-5 h-5 text-[#2F81F7] mb-3" />
                  <h3 className="text-sm font-semibold text-white">{p.title}</h3>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{p.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-white/5">
        <div className="max-w-3xl mx-auto px-5 py-16 lg:py-24">
          <SectionHead eyebrow="FAQ" title="Answers before you ask." />
          <div className="mt-10 space-y-2">
            {FAQ.map((f, i) => (
              <FaqItem key={i} q={f.q} a={f.a} />
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-white/5">
        <div className="max-w-4xl mx-auto px-5 py-20 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Your flight is delayed. Your money isn't.
          </h2>
          <p className="mt-4 text-base text-slate-400 max-w-xl mx-auto">
            Start a case in under a minute. If we can't compute a strategy, you owe nothing.
          </p>
          <div className="mt-8">
            <Link
              to="/new"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-[#2F81F7] hover:bg-[#1F6FE0] text-white text-sm font-semibold transition-colors shadow-lg shadow-[#2F81F7]/25"
            >
              Start a case
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5">
        <div className="max-w-6xl mx-auto px-5 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5" />
            © 2026 Envoy · U.S. domestic flights only
          </div>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-slate-400 transition-colors">Privacy</a>
            <a href="#" className="hover:text-slate-400 transition-colors">Terms</a>
            <Link to="/login" className="hover:text-slate-400 transition-colors">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function GlowBackdrop() {
  return (
    <div className="absolute inset-0 -z-0 overflow-hidden pointer-events-none">
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full bg-[#2F81F7]/10 blur-3xl" />
      <div className="absolute top-[10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-violet-500/8 blur-3xl" />
    </div>
  );
}

function DisruptionChoice({ icon: Icon, label, desc, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full flex items-center gap-3 text-left rounded-xl border border-white/5 bg-white/[0.02] hover:border-[#2F81F7]/50 hover:bg-[#2F81F7]/[0.06] px-4 py-3 transition-all"
    >
      <div className="w-9 h-9 rounded-lg bg-[#2F81F7]/10 text-[#2F81F7] flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-white">{label}</div>
        <div className="text-[11px] text-slate-500 mt-0.5">{desc}</div>
      </div>
      <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-[#2F81F7] group-hover:translate-x-0.5 transition-all" />
    </button>
  );
}

function TrustStat({ icon: Icon, value, label }) {
  return (
    <div className="rounded-xl border border-white/5 bg-[#161B22]/60 backdrop-blur p-4">
      <Icon className="w-4 h-4 text-[#2F81F7] mb-2" />
      <div className="text-lg font-bold text-white font-mono">{value}</div>
      <div className="text-[11px] text-slate-500 mt-0.5">{label}</div>
    </div>
  );
}

function BigPainTile({ icon: Icon, value, label, detail }) {
  return (
    <div className="rounded-2xl border border-red-500/15 bg-[#161B22] p-6 relative overflow-hidden">
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-red-500/[0.04] blur-2xl" />
      <div className="relative">
        <div className="w-10 h-10 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center mb-4">
          <Icon className="w-5 h-5" />
        </div>
        <div className="text-3xl sm:text-4xl font-bold text-white font-mono">{value}</div>
        <div className="text-sm font-semibold text-slate-300 mt-1">{label}</div>
        <div className="text-xs text-slate-500 mt-2 leading-relaxed">{detail}</div>
      </div>
    </div>
  );
}

function AirlineMarquee() {
  const doubled = [...AIRLINES, ...AIRLINES];
  return (
    <div className="rounded-2xl border border-white/5 bg-[#0F141B] px-4 py-3.5 overflow-hidden">
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest shrink-0">
          Airlines we handle
        </span>
        <div className="relative flex-1 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
          <div className="flex gap-2 w-max fg-marquee">
            {doubled.map((a, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/5 text-[11px] shrink-0"
              >
                <span className="font-mono text-[#2F81F7] font-semibold">{a.iata}</span>
                <span className="text-slate-300">{a.name}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes fg-marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .fg-marquee {
          animation: fg-marquee 28s linear infinite;
        }
        .fg-marquee:hover { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) {
          .fg-marquee { animation: none; }
        }
      `}</style>
    </div>
  );
}

function SectionHead({ eyebrow, title, sub }) {
  return (
    <div className="max-w-2xl mx-auto text-center">
      <div className="text-[10px] font-semibold text-[#2F81F7] uppercase tracking-widest mb-3">
        {eyebrow}
      </div>
      <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">{title}</h2>
      {sub && <p className="mt-3 text-sm text-slate-400 leading-relaxed">{sub}</p>}
    </div>
  );
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-white/5 bg-[#161B22] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-white/[0.02] transition-colors"
      >
        <span className="text-sm font-medium text-white">{q}</span>
        <ChevronDown className={cn("w-4 h-4 text-slate-500 shrink-0 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-slate-400 leading-relaxed">
          {a}
        </div>
      )}
    </div>
  );
}
