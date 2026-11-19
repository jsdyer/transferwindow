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
export function connections(arrivals, outgoing, from, walk, delay) {
  return arrivals
    .filter((t) => t >= from && t < 1440)
    .map((arrive) => {
      const first = outgoing.find((t) => t >= arrive + walk);
      const usable = outgoing.find((t) => t >= arrive + walk + delay);
      const later = outgoing.find((t) => usable != null && t > usable);
      return { arrive, first, usable, later };
    });
}
