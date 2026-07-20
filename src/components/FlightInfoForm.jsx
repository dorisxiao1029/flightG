import React, { useState } from "react";
import { Plane, Upload, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function FlightInfoForm({ onParsed, onCancel }) {
  const [mode, setMode] = useState("manual"); // manual | upload | email
  const [flightNumber, setFlightNumber] = useState("");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [departure, setDeparture] = useState("");
  const [airline, setAirline] = useState("");
  const [cabin, setCabin] = useState("economy");

  const canSubmit = flightNumber && origin && destination && departure;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    onParsed({
      flight_number: flightNumber.toUpperCase(),
      origin: origin.toUpperCase(),
      destination: destination.toUpperCase(),
      scheduled_departure: new Date(departure).toISOString(),
      airline_name: airline,
      cabin_class: cabin,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Input mode tabs */}
      <div className="flex gap-1 p-1 rounded-lg bg-white/5 w-fit">
        <TabBtn active={mode === "manual"} onClick={() => setMode("manual")} icon={Plane} label="Manual" />
        <TabBtn active={mode === "upload"} onClick={() => setMode("upload")} icon={Upload} label="Upload itinerary" />
        <TabBtn active={mode === "email"} onClick={() => setMode("email")} icon={Mail} label="Connect email" />
      </div>

      {mode === "upload" && (
        <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
          <Upload className="w-7 h-7 text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-slate-400">Drop your itinerary PDF or booking confirmation</p>
          <p className="text-xs text-slate-600 mt-1">We'll auto-extract flight details</p>
        </div>
      )}

      {mode === "email" && (
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6 text-center">
          <Mail className="w-7 h-7 text-[#2F81F7] mx-auto mb-2" />
          <p className="text-sm text-slate-300">Authorize your inbox</p>
          <p className="text-xs text-slate-500 mt-1 mb-3">We scan booking confirmations and import flights automatically.</p>
          <Button type="button" variant="secondary" className="bg-[#2F81F7]/15 text-[#2F81F7] hover:bg-[#2F81F7]/25 border-0">
            Connect Gmail / Outlook
          </Button>
        </div>
      )}

      {mode === "manual" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Flight number" full>
            <input
              value={flightNumber}
              onChange={(e) => setFlightNumber(e.target.value)}
              placeholder="e.g. CA1234"
              className="input"
            />
          </Field>
          <Field label="Airline name">
            <input value={airline} onChange={(e) => setAirline(e.target.value)} placeholder="Air China" className="input" />
          </Field>
          <Field label="Cabin class">
            <select value={cabin} onChange={(e) => setCabin(e.target.value)} className="input">
              <option value="economy">Economy</option>
              <option value="premium_economy">Premium Economy</option>
              <option value="business">Business</option>
              <option value="first">First</option>
            </select>
          </Field>
          <Field label="Origin airport">
            <input value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="PEK" maxLength={3} className="input uppercase" />
          </Field>
          <Field label="Destination airport">
            <input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="LHR" maxLength={3} className="input uppercase" />
          </Field>
          <Field label="Scheduled departure" full>
            <input
              type="datetime-local"
              value={departure}
              onChange={(e) => setDeparture(e.target.value)}
              className="input"
            />
          </Field>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} className="text-slate-400 hover:text-slate-200">
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!canSubmit}
          className="bg-[#2F81F7] hover:bg-[#1F6FE0] text-white disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Continue
        </Button>
      </div>

      <style>{`
        .input {
          width: 100%;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 0.5rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          color: #E2E8F0;
          outline: none;
          transition: border-color 0.15s;
        }
        .input:focus { border-color: #2F81F7; }
        .input::placeholder { color: #475569; }
      `}</style>
    </form>
  );
}

function TabBtn({ active, onClick, icon: Icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
        active ? "bg-[#2F81F7]/15 text-[#2F81F7]" : "text-slate-500 hover:text-slate-300"
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}

function Field({ label, children, full }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <label className="block text-xs font-medium text-slate-400 mb-1.5">{label}</label>
      {children}
    </div>
  );
}