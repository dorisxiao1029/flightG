import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { PlusCircle, Shield, Zap, FileCheck, TrendingUp } from "lucide-react";
import { base44 } from "@/api/base44Client";
import CaseCard from "@/components/CaseCard";

export default function Home() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.FlightCase.list("-created_date", 50)
      .then(setCases)
      .catch(() => setCases([]))
      .finally(() => setLoading(false));
  }, []);

  const active = cases.filter((c) => !["closed_success", "closed_failed", "cancelled"].includes(c.status));
  const needsAction = cases.filter((c) => c.status === "awaiting_user_confirmation");
  const resolved = cases.filter((c) => c.status === "closed_success");
  const totalComp = resolved.reduce((s, c) => s + (c.proposed_compensation_usd || 0), 0);

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Command Center</h1>
          <p className="text-sm text-slate-500 mt-1">
            Your autonomous agent is monitoring flight disruptions.
          </p>
        </div>
        <Link
          to="/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#2F81F7] hover:bg-[#1F6FE0] text-white text-sm font-medium transition-colors shadow-lg shadow-[#2F81F7]/20"
        >
          <PlusCircle className="w-4 h-4" strokeWidth={2.5} />
          New Case
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <Stat icon={Zap} label="Active cases" value={active.length} color="text-sky-400" />
        <Stat icon={FileCheck} label="Needs action" value={needsAction.length} color="text-amber-400" />
        <Stat icon={Shield} label="Resolved" value={resolved.length} color="text-emerald-400" />
        <Stat icon={TrendingUp} label="Compensation secured" value={`$${totalComp.toLocaleString()}`} color="text-emerald-400" mono />
      </div>

      {/* Active cases */}
      <section className="mb-8">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Active</h2>
        {loading ? (
          <LoadingGrid />
        ) : active.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {active.map((c) => (
              <CaseCard key={c.id} caseItem={c} />
            ))}
          </div>
        )}
      </section>

      {/* Recently resolved */}
      {resolved.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Recently resolved</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {resolved.slice(0, 4).map((c) => (
              <CaseCard key={c.id} caseItem={c} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value, color, mono }) {
  return (
    <div className="rounded-xl border border-white/5 bg-[#161B22] p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-3.5 h-3.5 ${color}`} />
        <span className="text-[11px] text-slate-500 font-medium">{label}</span>
      </div>
      <div className={`text-xl font-bold text-white ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}

function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-24 rounded-xl bg-[#161B22] animate-pulse" />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-white/10 bg-[#161B22]/50 p-10 text-center">
      <Shield className="w-8 h-8 text-slate-700 mx-auto mb-3" />
      <p className="text-sm text-slate-400">No active cases.</p>
      <Link to="/new" className="text-xs text-[#2F81F7] hover:underline mt-1 inline-block">
        Start a new case →
      </Link>
    </div>
  );
}