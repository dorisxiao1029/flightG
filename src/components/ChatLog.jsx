import React, { useEffect, useRef } from "react";
import { Bot, Building2, Cog, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import moment from "moment";

function EvidenceLink({ metadata }) {
  const url = metadata?.artifact_url;
  if (!url) return null;
  const hash = metadata?.artifact_hash;
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      title={hash ? `Evidence artifact — sha256-${hash}` : "Evidence artifact"}
      className="inline-flex items-center gap-1 text-[10px] text-slate-500 hover:text-emerald-400 transition-colors"
    >
      <ShieldCheck className="w-2.5 h-2.5" />
      Evidence{hash ? ` · ${hash.slice(0, 6)}` : ""}
    </a>
  );
}

export default function ChatLog({ logs }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [logs]);

  return (
    <div className="space-y-3">
      {logs.length === 0 && (
        <div className="text-center py-10 text-slate-600 text-sm">
          No communication yet. The agent will start reaching out shortly.
        </div>
      )}
      {logs.map((log) => {
        const isOutbound = log.direction === "outbound";
        const isInbound = log.direction === "inbound";
        const isSystem = log.direction === "system";

        if (isSystem) {
          return (
            <div key={log.id} className="flex flex-col items-center gap-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 text-[11px] text-slate-500">
                <Cog className="w-3 h-3" />
                {log.content}
              </div>
              <EvidenceLink metadata={log.metadata} />
            </div>
          );
        }

        const Icon = isOutbound ? Bot : Building2;
        return (
          <div key={log.id} className={cn("flex gap-2.5", isOutbound ? "flex-row-reverse" : "flex-row")}>
            <div
              className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                isOutbound ? "bg-[#2F81F7]/15 text-[#2F81F7]" : "bg-white/5 text-slate-400"
              )}
            >
              <Icon className="w-3.5 h-3.5" strokeWidth={2} />
            </div>
            <div className={cn("max-w-[75%]", isOutbound ? "items-end" : "items-start")}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-medium text-slate-400">{log.sender}</span>
                <span className="text-[10px] text-slate-600 uppercase tracking-wide">
                  {log.channel}
                </span>
              </div>
              <div
                className={cn(
                  "rounded-xl px-3.5 py-2.5 text-sm leading-relaxed",
                  isOutbound
                    ? "bg-[#2F81F7] text-white rounded-tr-sm"
                    : "bg-[#1C2330] text-slate-200 border border-white/5 rounded-tl-sm"
                )}
              >
                {log.content}
              </div>
              <div className={cn("flex items-center gap-2 text-[10px] text-slate-600 mt-1", isOutbound ? "justify-end" : "justify-start")}>
                <span>{log.created_date ? moment(log.created_date).format("MMM D, HH:mm:ss") : ""}</span>
                <EvidenceLink metadata={log.metadata} />
              </div>
            </div>
          </div>
        );
      })}
      <div ref={endRef} />
    </div>
  );
}