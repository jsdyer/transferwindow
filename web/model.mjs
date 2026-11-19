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
