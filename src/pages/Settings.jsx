import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Bell, User, CreditCard, Shield, LogOut, LogIn, ChevronRight, Plane } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

const CABIN_OPTIONS = [
  { value: "economy", label: "Economy" },
  { value: "premium_economy", label: "Premium Economy" },
  { value: "business", label: "Business" },
  { value: "first", label: "First" },
];

const PREF_KEY = "flightguard_prefs";

const loadPrefs = () => {
  try {
    return JSON.parse(localStorage.getItem(PREF_KEY) || "{}");
  } catch {
    return {};
  }
};

const savePrefs = (patch) => {
  const next = { ...loadPrefs(), ...patch };
  localStorage.setItem(PREF_KEY, JSON.stringify(next));
  return next;
};

export default function Settings() {
  const { user, isAuthenticated, logout, navigateToLogin } = useAuth();
  const { toast } = useToast();
  const initial = loadPrefs();
  const [defaultCabin, setDefaultCabin] = useState(initial.defaultCabin || "economy");
  const [notifyEmail, setNotifyEmail] = useState(initial.notifyEmail ?? true);
  const [notifySms, setNotifySms] = useState(initial.notifySms ?? false);

  const persist = (patch) => {
    savePrefs(patch);
    toast({ title: "Preferences saved" });
  };

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your account, defaults, and how the agent reaches you.
        </p>
      </div>

      {/* Account */}
      <Section icon={User} title="Account">
        {isAuthenticated && user ? (
          <>
            <Row label="Signed in as" value={user.email || user.full_name || "—"} />
            <Row label="User ID" value={<span className="font-mono text-xs">{user.id || "—"}</span>} />
            <div className="pt-3 mt-1 border-t border-white/5">
              <Button
                type="button"
                variant="ghost"
                onClick={() => logout()}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/5 px-3"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Log out
              </Button>
            </div>
          </>
        ) : (
          <div>
            <p className="text-sm text-slate-400 mb-3">
              You're browsing anonymously. Sign in to save cases and claim benefits.
            </p>
            <Button
              type="button"
              onClick={() => navigateToLogin()}
              className="bg-[#2F81F7] hover:bg-[#1F6FE0] text-white"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Sign in
            </Button>
          </div>
        )}
      </Section>

      {/* Flight defaults */}
      <Section icon={Plane} title="Flight defaults">
        <label className="block text-xs font-medium text-slate-400 mb-1.5">Default cabin class</label>
        <select
          value={defaultCabin}
          onChange={(e) => {
            setDefaultCabin(e.target.value);
            persist({ defaultCabin: e.target.value });
          }}
          className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-[#2F81F7]"
        >
          {CABIN_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <p className="text-[11px] text-slate-600 mt-1.5">
          Pre-fills the cabin selector when you start a new case.
        </p>
      </Section>

      {/* Notifications */}
      <Section icon={Bell} title="Notifications">
        <Toggle
          label="Email updates"
          desc="Case status, agent progress, offer decisions"
          checked={notifyEmail}
          onChange={(v) => {
            setNotifyEmail(v);
            persist({ notifyEmail: v });
          }}
        />
        <Toggle
          label="SMS alerts"
          desc="Urgent updates (rebooking windows, expiring offers)"
          checked={notifySms}
          onChange={(v) => {
            setNotifySms(v);
            persist({ notifySms: v });
          }}
        />
      </Section>

      {/* Billing (stub) */}
      <Section icon={CreditCard} title="Billing">
        <Row label="Plan" value="Pay per case ($29)" />
        <Row label="Payment method" value={<span className="text-slate-500">Not set</span>} />
      </Section>

      {/* Legal */}
      <Section icon={Shield} title="Legal & privacy">
        <StubLink label="Privacy policy" />
        <StubLink label="Terms of service" />
        <StubLink label="Delete my data" />
      </Section>

      <div className="text-center text-[11px] text-slate-600 mt-8">
        FlightGuard AI · v0.1 ·{" "}
        <Link to="/" className="text-slate-500 hover:text-slate-300">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, children }) {
  return (
    <div className="rounded-xl border border-white/5 bg-[#161B22] p-5 mb-4">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-4 h-4 text-slate-400" />
        <h2 className="text-sm font-semibold text-white">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between py-2 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-200">{value}</span>
    </div>
  );
}

function Toggle({ label, desc, checked, onChange }) {
  return (
    <label className="flex items-center justify-between py-2.5 cursor-pointer">
      <div className="min-w-0">
        <div className="text-sm text-slate-200">{label}</div>
        <div className="text-[11px] text-slate-500 mt-0.5">{desc}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "shrink-0 relative w-9 h-5 rounded-full transition-colors ml-4",
          checked ? "bg-[#2F81F7]" : "bg-white/10"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
            checked && "translate-x-4"
          )}
        />
      </button>
    </label>
  );
}

function StubLink({ label }) {
  return (
    <button
      type="button"
      className="w-full flex items-center justify-between py-2.5 text-sm text-slate-300 hover:text-white transition-colors"
    >
      {label}
      <ChevronRight className="w-4 h-4 text-slate-600" />
    </button>
  );
}
