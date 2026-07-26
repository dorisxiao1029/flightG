import React, { useState, useRef, useEffect, useMemo } from "react";
import { Plane, Upload, Mail, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { US_AIRLINES } from "@/lib/usFlightRules";
import { US_AIRPORTS, searchAirports } from "@/lib/usAirports";

const AIRLINES_LIST = Object.entries(US_AIRLINES).map(([iata, meta]) => ({
  iata,
  name: meta.name,
}));

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

      {mode === "upload" && <ComingSoonPanel icon={Upload} title="Itinerary parsing" onBack={() => setMode("manual")} />}
      {mode === "email" && <ComingSoonPanel icon={Mail} title="Email inbox scanning" onBack={() => setMode("manual")} />}

      {mode === "manual" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Flight number" full>
            <input
              value={flightNumber}
              onChange={(e) => setFlightNumber(e.target.value)}
              placeholder="e.g. DL1234"
              className="input"
            />
          </Field>
          <Field label="Airline name">
            <AirlineAutocomplete value={airline} onChange={setAirline} />
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
            <AirportAutocomplete value={origin} onChange={setOrigin} placeholder="SFO or San Francisco" />
          </Field>
          <Field label="Destination airport">
            <AirportAutocomplete value={destination} onChange={setDestination} placeholder="JFK or New York" />
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
          disabled={!canSubmit || mode !== "manual"}
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

function AirlineAutocomplete({ value, onChange }) {
  const suggestions = useMemo(() => {
    if (!value) return [];
    const q = value.toLowerCase();
    return AIRLINES_LIST.filter(
      (a) => a.name.toLowerCase().includes(q) || a.iata.toLowerCase().startsWith(q)
    ).slice(0, 6);
  }, [value]);

  return (
    <Suggest
      value={value}
      onChange={onChange}
      placeholder="Delta Air Lines"
      items={suggestions}
      renderItem={(a) => (
        <>
          <span className="font-mono text-xs text-[#2F81F7]">{a.iata}</span>
          <span className="text-slate-200">{a.name}</span>
        </>
      )}
      onPick={(a) => onChange(a.name)}
    />
  );
}

function AirportAutocomplete({ value, onChange, placeholder }) {
  const suggestions = useMemo(() => searchAirports(value, 6), [value]);

  return (
    <Suggest
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      items={suggestions}
      renderItem={(a) => (
        <>
          <span className="font-mono text-xs text-[#2F81F7] w-9">{a.iata}</span>
          <span className="text-slate-200 truncate">{a.city}</span>
          <span className="text-slate-600 text-xs truncate">{a.name}</span>
        </>
      )}
      onPick={(a) => onChange(a.iata)}
    />
  );
}

/** Generic controlled input with dropdown suggestions. */
function Suggest({ value, onChange, placeholder, items, renderItem, onPick }) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    setHighlight(0);
  }, [items.length]);

  const visible = open && items.length > 0;

  const handleKeyDown = (e) => {
    if (!visible) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      if (items[highlight]) {
        e.preventDefault();
        onPick(items[highlight]);
        setOpen(false);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={wrapRef} className="relative">
      <input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="input"
        autoComplete="off"
      />
      {visible && (
        <ul
          role="listbox"
          className="absolute z-20 mt-1 w-full max-h-64 overflow-auto rounded-lg border border-white/10 bg-[#161B22] shadow-xl py-1"
        >
          {items.map((item, i) => (
            <li
              key={i}
              role="option"
              aria-selected={i === highlight}
              onMouseDown={(e) => {
                e.preventDefault();
                onPick(item);
                setOpen(false);
              }}
              onMouseEnter={() => setHighlight(i)}
              className={cn(
                "px-3 py-2 text-sm flex items-center gap-3 cursor-pointer",
                i === highlight ? "bg-[#2F81F7]/15" : ""
              )}
            >
              {renderItem(item)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ComingSoonPanel({ icon: Icon, title, onBack }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6 text-center">
      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-semibold uppercase tracking-wider mb-3">
        <Clock className="w-3 h-3" />
        Coming soon
      </div>
      <Icon className="w-7 h-7 text-slate-600 mx-auto mb-2" />
      <p className="text-sm text-slate-300">{title}</p>
      <p className="text-xs text-slate-500 mt-1 mb-4">
        Not wired up yet. Use <span className="text-slate-300">Manual</span> entry for now.
      </p>
      <Button
        type="button"
        variant="secondary"
        onClick={onBack}
        className="bg-[#2F81F7]/15 text-[#2F81F7] hover:bg-[#2F81F7]/25 border-0"
      >
        Enter flight manually
      </Button>
    </div>
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
