import React from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { Shield, LayoutDashboard, PlusCircle, History, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "New Case", path: "/new", icon: PlusCircle },
  { label: "History", path: "/history", icon: History },
];

export default function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#0D1117] text-slate-200 flex">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 border-r border-white/5 flex flex-col bg-[#0D1117] sticky top-0 h-screen">
        <div className="px-5 py-5 flex items-center gap-2.5 border-b border-white/5">
          <div className="w-8 h-8 rounded-lg bg-[#2F81F7] flex items-center justify-center shadow-lg shadow-[#2F81F7]/20">
            <Shield className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
          </div>
          <div className="leading-tight">
            <div className="text-white font-semibold text-sm tracking-tight">FlightGuard</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-widest">AI Agent</div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "bg-[#2F81F7]/10 text-[#2F81F7]"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                )}
              >
                <Icon className="w-4 h-4" strokeWidth={2} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-white/5">
          <Link
            to="/settings"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
          >
            <Settings className="w-4 h-4" strokeWidth={2} />
            Settings
          </Link>
          <div className="px-3 pt-4 text-[10px] text-slate-600">
            © 2026 FlightGuard AI
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 bg-[#0D1117]">
        <Outlet />
      </main>
    </div>
  );
}