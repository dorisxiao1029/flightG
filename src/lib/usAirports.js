export const US_AIRPORTS = [
  { iata: "ATL", city: "Atlanta", name: "Hartsfield-Jackson Atlanta Intl" },
  { iata: "LAX", city: "Los Angeles", name: "Los Angeles Intl" },
  { iata: "ORD", city: "Chicago", name: "O'Hare Intl" },
  { iata: "DFW", city: "Dallas / Fort Worth", name: "Dallas Fort Worth Intl" },
  { iata: "DEN", city: "Denver", name: "Denver Intl" },
  { iata: "JFK", city: "New York", name: "John F. Kennedy Intl" },
  { iata: "SFO", city: "San Francisco", name: "San Francisco Intl" },
  { iata: "SEA", city: "Seattle", name: "Seattle-Tacoma Intl" },
  { iata: "LAS", city: "Las Vegas", name: "Harry Reid Intl" },
  { iata: "MCO", city: "Orlando", name: "Orlando Intl" },
  { iata: "MIA", city: "Miami", name: "Miami Intl" },
  { iata: "CLT", city: "Charlotte", name: "Charlotte Douglas Intl" },
  { iata: "PHX", city: "Phoenix", name: "Phoenix Sky Harbor Intl" },
  { iata: "EWR", city: "Newark", name: "Newark Liberty Intl" },
  { iata: "IAH", city: "Houston", name: "George Bush Intercontinental" },
  { iata: "BOS", city: "Boston", name: "Logan Intl" },
  { iata: "MSP", city: "Minneapolis / St. Paul", name: "Minneapolis-St Paul Intl" },
  { iata: "DTW", city: "Detroit", name: "Detroit Metropolitan Wayne County" },
  { iata: "FLL", city: "Fort Lauderdale", name: "Fort Lauderdale-Hollywood Intl" },
  { iata: "PHL", city: "Philadelphia", name: "Philadelphia Intl" },
  { iata: "LGA", city: "New York", name: "LaGuardia" },
  { iata: "BWI", city: "Baltimore", name: "Baltimore/Washington Intl" },
  { iata: "SLC", city: "Salt Lake City", name: "Salt Lake City Intl" },
  { iata: "SAN", city: "San Diego", name: "San Diego Intl" },
  { iata: "IAD", city: "Washington DC", name: "Washington Dulles Intl" },
  { iata: "DCA", city: "Washington DC", name: "Ronald Reagan National" },
  { iata: "MDW", city: "Chicago", name: "Chicago Midway Intl" },
  { iata: "TPA", city: "Tampa", name: "Tampa Intl" },
  { iata: "HNL", city: "Honolulu", name: "Daniel K. Inouye Intl" },
  { iata: "PDX", city: "Portland", name: "Portland Intl" },
  { iata: "STL", city: "St. Louis", name: "St. Louis Lambert Intl" },
  { iata: "AUS", city: "Austin", name: "Austin-Bergstrom Intl" },
  { iata: "MSY", city: "New Orleans", name: "Louis Armstrong New Orleans Intl" },
  { iata: "RDU", city: "Raleigh / Durham", name: "Raleigh-Durham Intl" },
  { iata: "SJC", city: "San Jose", name: "Norman Y. Mineta San Jose Intl" },
  { iata: "SMF", city: "Sacramento", name: "Sacramento Intl" },
  { iata: "OAK", city: "Oakland", name: "Oakland Intl" },
  { iata: "BNA", city: "Nashville", name: "Nashville Intl" },
  { iata: "MCI", city: "Kansas City", name: "Kansas City Intl" },
  { iata: "PIT", city: "Pittsburgh", name: "Pittsburgh Intl" },
  { iata: "CLE", city: "Cleveland", name: "Cleveland Hopkins Intl" },
  { iata: "IND", city: "Indianapolis", name: "Indianapolis Intl" },
  { iata: "CMH", city: "Columbus", name: "John Glenn Columbus Intl" },
  { iata: "CVG", city: "Cincinnati", name: "Cincinnati/Northern Kentucky Intl" },
  { iata: "MKE", city: "Milwaukee", name: "General Mitchell Intl" },
  { iata: "JAX", city: "Jacksonville", name: "Jacksonville Intl" },
  { iata: "RSW", city: "Fort Myers", name: "Southwest Florida Intl" },
  { iata: "PBI", city: "West Palm Beach", name: "Palm Beach Intl" },
  { iata: "ONT", city: "Ontario", name: "Ontario Intl" },
  { iata: "BUR", city: "Burbank", name: "Hollywood Burbank" },
  { iata: "SNA", city: "Santa Ana", name: "John Wayne" },
  { iata: "ANC", city: "Anchorage", name: "Ted Stevens Anchorage Intl" },
];

/**
 * Case-insensitive fuzzy search on IATA, city, or name.
 * Returns up to `limit` matches, IATA-prefix matches ranked first.
 */
export function searchAirports(query, limit = 6) {
  if (!query) return [];
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const iataStart = [];
  const other = [];
  for (const a of US_AIRPORTS) {
    const iata = a.iata.toLowerCase();
    if (iata.startsWith(q)) {
      iataStart.push(a);
    } else if (
      iata.includes(q) ||
      a.city.toLowerCase().includes(q) ||
      a.name.toLowerCase().includes(q)
    ) {
      other.push(a);
    }
  }
  return [...iataStart, ...other].slice(0, limit);
}
