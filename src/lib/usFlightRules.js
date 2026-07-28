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

export function isSignificantDelay(delayMinutes) {
  return delayMinutes >= 180;
}

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

  // Classification: any explicit controllable cause (mechanical / crew / staffing
  // / maintenance / IT / scheduling) wins even when weather or ATC is also mentioned.
  // Airlines routinely blame weather to escape voluntary duty, so if the passenger
  // reports a mixed reason we assume the controllable component makes them liable.
  const reason = (disruptionReason || "").toLowerCase();
  const controllableCause = /(mechanical|crew|staffing|maintenance|equipment|technical|it issue|scheduling)/i.test(reason);
  const uncontrollableCause = /(weather|air traffic control|atc|security)/i.test(reason);
  const controllable = controllableCause || !uncontrollableCause;
  const significant = isSignificantDelay(delayMinutes) || disruptionType === "cancellation";

  // ── DOT Part 260: refund and rebook are ALTERNATIVES, not additive ──
  // If the passenger accepts the airline's rebooking, they forfeit the
  // refund right (and vice versa). We model this as two mutually-exclusive
  // paths and let the user pick after seeing what the airline offers back.

  const refundValue = ticketPriceUsd || 0;
  const refundPath = {
    key: "refund",
    label: "Take the cash refund",
    summary: "You walk away with cash. You arrange onward travel yourself (or don't need to anymore).",
    primary_claim: significant || disruptionType === "cancellation" ? {
      right: "Full cash refund",
      basis: disruptionType === "cancellation"
        ? "DOT 14 CFR Part 260: cancelled flight → cash refund of unused segments."
        : "DOT 14 CFR Part 260: 3+ hr domestic delay → cash refund if passenger declines rebooking.",
      value: refundValue,
    } : null,
    value: refundValue,
  };

  const rebookPath = {
    key: "rebook",
    label: "Rebook on the earliest flight",
    summary: `You still get to ${airline.name === "Unknown Airline" ? "your destination" : "your destination"}. Agent pushes for partner/interline routing if own metal isn't available soon enough.`,
    primary_claim: {
      right: "Rebooking on earliest available flight",
      basis: airline.partner_rebooking
        ? `${airline.name} interline: agent forces partner rebooking (e.g. Delta/UA/AS) if AA's own next flight is too late.`
        : `${airline.name} does not interline widely — agent must push for the next own-metal flight or refund fallback.`,
      value: refundValue, // you preserve ticket value by still flying
    },
    value: refundValue,
  };

  // Goodwill credit is offered on top of REBOOK (airlines don't hand out
  // credit AND cash refund on the same ticket in practice).
  if (airline.typical_credit > 0 && (significant || controllable)) {
    rebookPath.value += airline.typical_credit;
    rebookPath.bonus = {
      right: `${airline.name} travel credit`,
      basis: `${airline.policy} — ask as goodwill when accepting a rebooking.`,
      value: airline.typical_credit,
    };
  }

  // ── Add-ons: apply to EITHER path ──
  // These are separate airline duties triggered by the disruption itself,
  // not by the passenger's refund/rebook choice.
  const addOns = [];
  if (controllable) {
    if (delayMinutes >= 180 || disruptionType === "cancellation") {
      addOns.push({
        right: "Meal voucher",
        basis: `${airline.name} voluntary policy: meals for controllable delays 3+ hrs.`,
        value: 15,
      });
    }
    if (delayMinutes >= 360 || disruptionType === "cancellation") {
      addOns.push({
        right: "Hotel accommodation (if overnight)",
        basis: `${airline.name} voluntary policy: overnight lodging for controllable disruptions.`,
        value: 120,
      });
    }
  }
  const addOnsValue = addOns.reduce((s, a) => s + a.value, 0);

  refundPath.total_value = refundPath.value + addOnsValue;
  rebookPath.total_value = rebookPath.value + addOnsValue;

  // "Max benefit" is the better of the two paths (in cash-equivalent terms).
  const maxBenefit = Math.max(refundPath.total_value, rebookPath.total_value);

  // ── Dynamic channel plan ──
  // Try chat first (fastest, free, transcript comes with the widget).
  // Escalate to phone if chat queues > 10 min or hands off to a human that
  // isn't picking up. Email is the async paper trail we file in parallel
  // when a supervisor is needed.
  const channelPlan = [
    { step: 1, channel: "chat", note: `Start on ${airline.name}'s live chat widget. Measure queue depth + estimated wait.` },
    { step: 2, channel: "phone", note: `Escalate to ${airline.name} phone line (${airline.channel === "phone" ? "known best channel for this carrier" : "if chat wait exceeds 10 min or bot cannot process refund"}).` },
    { step: 3, channel: "email", note: `File a formal complaint email in parallel — creates an audit trail even if live channels succeed.` },
  ];

  const negotiationScript = buildScript(airline, disruptionType, delayMinutes, controllable, refundValue, addOns);

  return {
    airline,
    controllable,
    significant,
    applicable_regulation: disruptionType === "cancellation"
      ? "DOT Part 260 (Refunds)"
      : "DOT Part 259 (Tarmac) + Part 260 (Refunds)",
    paths: [refundPath, rebookPath],
    add_ons: addOns,
    add_ons_value: addOnsValue,
    max_benefit_usd: maxBenefit,
    dot_cash_value: refundPath.value,
    airline_benefit_value: rebookPath.bonus?.value || 0,
    negotiation_script: negotiationScript,
    channel_plan: channelPlan,
    preferred_channel: "chat",
    has_api: false,
    // Legacy shape kept for downstream consumers that read recommended_claims / dot_rights / airline_offers.
    recommended_claims: [
      refundPath.primary_claim,
      rebookPath.primary_claim,
      rebookPath.bonus,
      ...addOns,
    ].filter(Boolean),
    dot_rights: refundPath.primary_claim ? [refundPath.primary_claim] : [],
    airline_offers: [rebookPath.primary_claim, rebookPath.bonus, ...addOns].filter(Boolean),
  };
}

function buildScript(airline, disruptionType, delay, controllable, refundValue, addOns) {
  const parts = [];

  parts.push(`Open ${airline.name} live chat. Cite flight number + confirmation, note the ${disruptionType}${delay ? ` (${delay} min delay)` : ""}. Ask for estimated wait to a human agent.`);

  parts.push(
    `Frame the choice for the passenger: (A) accept rebooking on next available seat — including ${airline.partner_rebooking ? "partner/interline carriers" : "next own-metal flight"} — or (B) invoke DOT Part 260 for a full cash refund of $${refundValue}. These are mutually exclusive.`
  );

  parts.push(
    `Whichever the passenger picks, DO NOT let the airline substitute travel credit for a cash refund if refund was chosen. Insist on cash per DOT 14 CFR Part 260.`
  );

  if (addOns.length > 0) {
    parts.push(
      `Regardless of path: request ${addOns.map(a => a.right.toLowerCase()).join(" and ")} — these are separate airline duties triggered by the disruption itself, not the refund/rebook choice.`
    );
  }

  if (airline.typical_credit > 0) {
    parts.push(
      `If rebooking path is chosen: also request ${airline.name}'s ~$${airline.typical_credit} goodwill travel credit. Airlines routinely add this to soften a rebook.`
    );
  }

  parts.push(
    `Fallback: if the agent refuses cash refund, escalate to a supervisor and cite DOT enforcement. Document the agent's name and reference number.`
  );

  return parts;
}