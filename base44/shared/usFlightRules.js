/**
 * US Domestic Flight Compensation Rules Engine
 * Principle: maximize user benefit by combining DOT mandatory rules
 * with airline voluntary commitments, then picking the highest-value path.
 *
 * Sources:
 * - DOT 14 CFR Part 259 (tarmac delay rules, 3-hour domestic limit)
 * - DOT refund policy: significant delay/cancellation = full cash refund right
 * - Airline customer service plans (voluntary commitments)
 */

// US domestic airlines and their voluntary disruption policies.
// Values are the airline's best-case published commitment — the engine
// always argues from the strongest available basis.
export const US_AIRLINES = {
  DL: {
    name: "Delta Air Lines",
    policy: "Voluntary: meals for 3+ hr delays, hotel for overnight, rebooking on partners. No cash comp but issues travel credits.",
    can_provide_cash: false,
    typical_credit: 200,
    partner_rebooking: true,
    channel: "app",
  },
  AA: {
    name: "American Airlines",
    policy: "Voluntary: meals/hotel for controllable delays. Rebooking on AA/partners. Credits issued case-by-case.",
    can_provide_cash: false,
    typical_credit: 150,
    partner_rebooking: true,
    channel: "phone",
  },
  UA: {
    name: "United Airlines",
    policy: "Voluntary: Connect program routes to partners automatically. Meals/hotel for controllable delays. Credits case-by-case.",
    can_provide_cash: false,
    typical_credit: 200,
    partner_rebooking: true,
    channel: "app",
  },
  WN: {
    name: "Southwest Airlines",
    policy: "Voluntary: no change fees ever, full credit for cancelled. Accommodations for controllable delays.",
    can_provide_cash: false,
    typical_credit: 100,
    partner_rebooking: false,
    channel: "phone",
  },
  B6: {
    name: "JetBlue",
    policy: "Customer Bill of Rights: delayed 3+ hrs = $100 credit, cancelled = $200 credit. Guaranteed, not discretionary.",
    can_provide_cash: false,
    typical_credit: 200,
    partner_rebooking: false,
    channel: "app",
  },
  AS: {
    name: "Alaska Airlines",
    policy: "Voluntary: rebooking, meals/hotel for controllable delays. Credits case-by-case.",
    can_provide_cash: false,
    typical_credit: 150,
    partner_rebooking: true,
    channel: "phone",
  },
  NK: {
    name: "Spirit Airlines",
    policy: "Minimal voluntary commitments. DOT refund right is the primary lever.",
    can_provide_cash: false,
    typical_credit: 50,
    partner_rebooking: false,
    channel: "phone",
  },
  F9: {
    name: "Frontier Airlines",
    policy: "Minimal voluntary commitments. DOT refund right is the primary lever.",
    can_provide_cash: false,
    typical_credit: 50,
    partner_rebooking: false,
    channel: "phone",
  },
};

/**
 * Determine if a flight qualifies as "significantly delayed" under DOT
 * interpretation — generally 3+ hours for domestic flights.
 */
export function isSignificantDelay(delayMinutes) {
  return delayMinutes >= 180;
}

/**
 * The core engine. Given a disruption scenario, returns the best strategy
 * to MAXIMIZE user benefit — combining mandatory DOT rights with airline
 * voluntary policies and always recommending the highest-value option.
 *
 * @param {object} params
 * @param {string} params.airlineIata - e.g. "DL", "AA"
 * @param {string} params.disruptionType - "delay" | "cancellation"
 * @param {number} params.delayMinutes - delay in minutes (0 for cancellation)
 * @param {string} params.disruptionReason - reason category
 * @param {string} params.ticketPriceUsd - original ticket price
 * @returns {object} strategy
 */
export function buildStrategy({
  airlineIata,
  disruptionType,
  delayMinutes,
  disruptionReason,
  ticketPriceUsd,
}) {
  const airline = US_AIRLINES[airlineIata] || {
    name: airlineIata || "Unknown Airline",
    policy: "No voluntary policy on file. DOT mandatory rights apply.",
    can_provide_cash: false,
    typical_credit: 0,
    partner_rebooking: false,
    channel: "phone",
  };

  const controllable = !/(weather|air traffic control|atc|security)/i.test(
    disruptionReason || ""
  );
  const significant = isSignificantDelay(delayMinutes) || disruptionType === "cancellation";

  // --- Layer 1: DOT mandatory rights (always available) ---
  const dotRights = [];
  let dotCashValue = 0;

  if (disruptionType === "cancellation") {
    dotRights.push({
      right: "Full cash refund",
      basis: "DOT 14 CFR Part 260: cancelled or significantly changed flight → passenger entitled to full cash refund of unused segments.",
      value: ticketPriceUsd || 0,
      type: "cash",
    });
    dotCashValue = ticketPriceUsd || 0;
  } else if (significant) {
    dotRights.push({
      right: "Full cash refund (significant delay)",
      basis: "DOT policy: 3+ hour domestic delay = significant change → full cash refund right if passenger declines rebooking.",
      value: ticketPriceUsd || 0,
      type: "cash",
    });
    dotCashValue = ticketPriceUsd || 0;
  }

  if (delayMinutes >= 180 && controllable) {
    dotRights.push({
      right: "Tarmac delay rule violation (if applicable)",
      basis: "DOT 14 CFR 259: tarmac delays over 3 hours (domestic) trigger penalties payable to passengers.",
      value: 0,
      type: "investigation",
    });
  }

  // --- Layer 2: Airline voluntary policy ---
  const airlineOffer = [];
  let airlineValue = 0;

  if (airline.typical_credit > 0 && (significant || controllable)) {
    airlineOffer.push({
      right: `${airline.name} travel credit`,
      basis: airline.policy,
      value: airline.typical_credit,
      type: "credit",
    });
    airlineValue = airline.typical_credit;
  }

  if (controllable) {
    if (delayMinutes >= 180 || disruptionType === "cancellation") {
      airlineOffer.push({
        right: "Meal voucher",
        basis: `${airline.name} voluntary policy: meals for controllable delays 3+ hrs.`,
        value: 15,
        type: "voucher",
      });
    }
    if (delayMinutes >= 360 || disruptionType === "cancellation") {
      airlineOffer.push({
        right: "Hotel accommodation",
        basis: `${airline.name} voluntary policy: overnight accommodation for controllable disruptions.`,
        value: 120,
        type: "accommodation",
      });
    }
  }

  if (airline.partner_rebooking) {
    airlineOffer.push({
      right: "Rebook on partner airline",
      basis: `${airline.name} interline agreement — agent should push for partner rebooking if own flights unavailable.`,
      value: 0,
      type: "rebooking",
    });
  }

  // --- Layer 3: Maximize user benefit ---
  // Strategy: pursue BOTH the DOT cash refund right AND airline voluntary
  // benefits — they are not mutually exclusive. The user can take a refund
  // for the cancelled flight AND still claim meals/hotel/credits.
  const allClaims = [...dotRights, ...airlineOffer];
  const totalValue = allClaims.reduce((sum, c) => sum + (c.value || 0), 0);

  // The recommended ask: full refund (if applicable) + best voluntary package
  const recommendedClaims = [];
  const refundClaim = dotRights.find((c) => c.type === "cash");
  if (refundClaim) recommendedClaims.push(refundClaim);
  recommendedClaims.push(...airlineOffer);

  // Negotiation script the agent should use
  const negotiationScript = buildScript(airline, disruptionType, delayMinutes, controllable, refundClaim, ticketPriceUsd);

  return {
    airline,
    controllable,
    significant,
    applicable_regulation: disruptionType === "cancellation"
      ? "DOT Part 260 (Refunds)"
      : "DOT Part 259 (Tarmac) + Part 260 (Refunds)",
    dot_rights: dotRights,
    airline_offers: airlineOffer,
    recommended_claims: recommendedClaims,
    max_benefit_usd: totalValue,
    dot_cash_value: dotCashValue,
    airline_benefit_value: airlineValue,
    negotiation_script: negotiationScript,
    preferred_channel: airline.channel,
    has_api: false, // US airlines don't expose public rebooking APIs
  };
}

function buildScript(airline, disruptionType, delay, controllable, refundClaim, ticketPrice) {
  const parts = [];

  parts.push(`Calling ${airline.name} regarding flight disruption (${disruptionType}${delay ? `, ${delay} min delay` : ""}).`);

  if (refundClaim) {
    parts.push(
      `Primary ask: invoke DOT Part 260 right to a full cash refund of $${ticketPrice} for the ${disruptionType === "cancellation" ? "cancelled" : "significantly delayed"} flight. ` +
      `If the agent offers only travel credit, politely insist on cash per DOT regulations.`
    );
  }

  if (airline.partner_rebooking) {
    parts.push(
      `Secondary ask: rebook on the earliest available flight, including partner/interline carriers — not just ${airline.name} metal.`
    );
  }

  if (controllable && (delay >= 180 || disruptionType === "cancellation")) {
    parts.push(
      `Also request meal vouchers (controllable delay) and hotel accommodation if overnight. ` +
      `These are separate from the refund and should not be waived.`
    );
  }

  if (airline.typical_credit > 0) {
    parts.push(
      `Additional ask: request ${airline.name}'s voluntary travel credit (~$${airline.typical_credit}) as goodwill compensation on top of the refund.`
    );
  }

  parts.push(
    `Fallback: if the agent refuses cash refund, escalate to a supervisor and cite DOT enforcement. Document the agent's name and reference number.`
  );

  return parts;
}