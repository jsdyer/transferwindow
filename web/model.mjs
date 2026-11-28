import { serviceSets } from "./schedule.mjs";
export function departures(data, day, id, searchThroughEnd = false) {
  return [
    ...new Set(
      serviceSets(data, day, searchThroughEnd).flatMap(({ group, offset }) =>
        (group[id] || []).map((t) => t + offset),
      ),
    ),
  ].sort((a, b) => a - b);
}
export function connections(arrivals, outgoing, from, walk, delay, until = 1440) {
  return arrivals
    .filter((t) => t >= from && t < Math.min(until, 1440))
    .map((arrive) => {
      const first = outgoing.find((t) => t >= arrive + walk);
      const usable = outgoing.find((t) => t >= arrive + walk + delay);
      const later = outgoing.find((t) => usable != null && t > usable);
      return { arrive, first, usable, later };
    });
}

export function delayImpact(windows) {
  let kept = 0, missingBaseline = 0, missingLater = 0;
  const shifts = [];
  for (const { arrive, first, usable } of windows) {
    if (first == null) missingBaseline++;
    else if (usable == null) missingLater++;
    else if (usable === first) kept++;
    else shifts.push({ arrive, added: usable - first });
  }
  shifts.sort((a, b) => a.added - b.added || a.arrive - b.arrive);
  const middle = Math.floor(shifts.length / 2);
  let median = null;
  if (shifts.length) {
    median = (shifts[middle].added + shifts[Math.floor((shifts.length - 1) / 2)].added) / 2;
  }
  const worst = shifts.at(-1)?.added ?? null;
  return {
    kept, shifted: shifts.length, missingBaseline, missingLater, median, worst,
    worstArrivals: shifts.filter((s) => s.added === worst).map((s) => s.arrive),
  };
}

export function carvolthEvening(data, today) {
  const incoming = data.labels.findIndex(([hub, route, , , role]) =>
    hub === "Carvolth" && route === "555" && role === "in");
  const onward = data.labels.findIndex(([hub, route, name, , role]) =>
    hub === "Carvolth" && route === "501" && role === "out" && name === "501 Langley Centre");
  if (incoming === -1 || onward === -1) return null;

  for (const day of Object.keys(data.calendar).sort()) {
    const weekday = new Date(day + "T12:00:00Z").getUTCDay();
    if (day < today || weekday === 0 || weekday === 6) continue;
    const arrivals = departures(data, day, incoming).filter(t => t >= 960 && t < 1020);
    if (!arrivals.length) continue;
    const usable = departures(data, day, onward).some(t => t >= arrivals[0] + 5 && t < 1440);
    if (usable) return {day, incoming, onward};
  }
  return null;
}
