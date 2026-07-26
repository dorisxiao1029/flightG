import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import CaseCard from "@/components/CaseCard";
import { History as HistoryIcon } from "lucide-react";

const filters = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "resolved", label: "Resolved" },
  { key: "failed", label: "Unresolved" },
];

export default function CaseHistory() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const load = useCallback(() => {
    return base44.entities.FlightCase.list("-created_date", 100)
      .then(setCases)
      .catch(() => setCases([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    const unsubscribe = base44.entities.FlightCase.subscribe(() => load());
    return unsubscribe;
  }, [load]);

  const filtered = cases.filter((c) => {
    if (filter === "all") return true;
    if (filter === "active") return !["closed_success", "closed_failed", "cancelled"].includes(c.status);
    if (filter === "resolved") return c.status === "closed_success";
    if (filter === "failed") return ["closed_failed", "cancelled"].includes(c.status);
    return true;
  });

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-2.5 mb-1">
        <HistoryIcon className="w-5 h-5 text-slate-500" />
        <h1 className="text-2xl font-bold text-white tracking-tight">Case History</h1>
      </div>
      <p className="text-sm text-slate-500 mb-6">All your cases, filterable by status.</p>

      <div className="flex gap-1 p-1 rounded-lg bg-white/5 w-fit mb-5">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              filter === f.key ? "bg-[#2F81F7]/15 text-[#2F81F7]" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-[#161B22] animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-[#161B22]/50 p-10 text-center text-sm text-slate-500">
          No cases in this view.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((c) => (
            <CaseCard key={c.id} caseItem={c} />
          ))}
        </div>
      )}
    </div>
  );
}