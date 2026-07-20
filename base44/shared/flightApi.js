/**
 * Flight status verification via AviationStack API.
 * Free tier: 100 requests/month, real-time data (30-60s delay).
 *
 * The user provides an AviationStack API key stored as a secret.
 * We query real-time flight status to verify the disruption before
 * the agent begins negotiating.
 */

const AVIATIONSTACK_BASE = "https://api.aviationstack.com/v1";

/**
 * Look up the live status of a flight by flight number + date.
 * @param {string} flightIata - e.g. "DL1234"
 * @param {string} dateISO - ISO date string
 * @param {string} apiKey - AviationStack API key
 * @returns {object} normalized flight status
 */
export async function verifyFlightStatus(flightIata, dateISO, apiKey) {
  if (!apiKey) {
    throw new Error("AviationStack API key not configured");
  }

  const date = new Date(dateISO);
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  const flightDate = `${yyyy}-${mm}-${dd}`;

  const params = new URLSearchParams({
    access_key: apiKey,
    flight_iata: flightIata.toUpperCase(),
    flight_date: flightDate,
  });

  const res = await fetch(`${AVIATIONSTACK_BASE}/flights?${params}`);
  const data = await res.json();

  if (!data || data.error) {
    throw new Error(data?.error?.message || "Flight lookup failed");
  }

  const flights = data.data || [];
  if (flights.length === 0) {
    throw new Error(`No flights found for ${flightIata} on ${flightDate}`);
  }

  const flight = flights[0];
  const departure = flight.departure || {};
  const arrival = flight.arrival || {};
  const delays = flight.delays || {};

  // Calculate delay in minutes
  let delayMinutes = 0;
  if (delays.departure_delay_min) {
    delayMinutes = delays.departure_delay_min;
  } else if (departure.scheduled && departure.actual) {
    const scheduled = new Date(departure.scheduled).getTime();
    const actual = new Date(departure.actual).getTime();
    delayMinutes = Math.max(0, Math.round((actual - scheduled) / 60000));
  }

  const status = flight.flight_status; // "scheduled" | "active" | "landed" | "cancelled" | "incident" | "diverted"

  return {
    verified: true,
    flight_iata: flight.flight_iata,
    airline_iata: flight.airline?.iata_code,
    airline_name: flight.airline?.name,
    origin_iata: departure.iata_code,
    destination_iata: arrival.iata_code,
    scheduled_departure: departure.scheduled,
    actual_departure: departure.actual,
    scheduled_arrival: arrival.scheduled,
    actual_arrival: arrival.actual,
    delay_minutes: delayMinutes,
    flight_status: status,
    is_cancelled: status === "cancelled",
    is_diverted: status === "diverted",
    is_delayed: delayMinutes >= 15 && status !== "cancelled",
    gate: departure.gate,
    terminal: departure.terminal,
  };
}

/**
 * Determine if a verified flight status constitutes an actionable
 * disruption worth opening a case for.
 */
export function classifyDisruption(status) {
  if (!status || !status.verified) return null;
  if (status.is_cancelled) return { type: "cancellation", delayMinutes: 0 };
  if (status.is_diverted) return { type: "diversion", delayMinutes: 0 };
  if (status.delay_minutes >= 180) return { type: "delay", delayMinutes: status.delay_minutes };
  if (status.delay_minutes >= 15) return { type: "delay", delayMinutes: status.delay_minutes };
  return null;
}