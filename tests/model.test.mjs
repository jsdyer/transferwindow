import test from "node:test";
import assert from "node:assert/strict";
import { clock } from "../web/schedule.mjs";
import { departures, connections, carvolthEvening } from "../web/model.mjs";

test("walking time, delay and a missed onward service are distinct", () => {
  assert.deepEqual(connections([480, 485, 1470], [490, 505, 520], 485, 5, 0), [
    { arrive: 485, first: 490, usable: 490, later: 505 },
  ]);
  assert.deepEqual(connections([485], [490, 505, 520], 480, 5, 1), [
    { arrive: 485, first: 490, usable: 505, later: 520 },
  ]);
  assert.equal(connections([485], [490], 480, 5, 1)[0].usable, undefined);
});

test("service days may overlap after midnight, duplicate departures count once", () => {
  const data = {
    calendar: {
      "2026-10-01": ["previous"],
      "2026-10-02": ["today"],
      "2026-10-03": ["next"],
    },
    events: {
      previous: { rail: [1450] },
      today: { rail: [10, 300] },
      next: { rail: [4] },
    },
  };
  assert.deepEqual(departures(data, "2026-10-02", "rail"), [10, 300, 1444]);
});

test("a weekday-only onward route can next depart on Monday", () => {
  const data = {
    calendar: { "2026-11-20": ["friday"], "2026-11-23": ["monday"] },
    events: { friday: {}, monday: { bus: [331, 355] } },
  };
  const times = departures(data, "2026-11-20", "bus", true);
  assert.deepEqual(times, [3 * 1440 + 331, 3 * 1440 + 355]);
  assert.equal(clock(times[0]), "5:31 am (+3 days)");
});

import { delayImpact } from "../web/model.mjs";

test("delay impact uses the same half-open arrival window across scenarios", () => {
  const arrivals = [479, 480, 489, 490, 500, 506, 511, 540, 1440];
  const outgoing = [490, 495, 509, 510];
  const subset = connections(arrivals, outgoing, 480, 0, 6, 540);
  assert.deepEqual(subset.map((r) => r.arrive), [480, 489, 490, 500, 506, 511]);
  assert.deepEqual(delayImpact(subset), {
    kept: 2, shifted: 2, missingBaseline: 1, missingLater: 1,
    median: 12, worst: 19, worstArrivals: [490],
  });
  assert.equal(delayImpact(connections(arrivals, outgoing, 480, 0, 0, 540)).median, null);
});

test("midnight truncates arrivals but onward shifts can cross midnight", () => {
  const windows = connections([1430, 1440], [1435, 1460], 1430, 5, 1, 1500);
  assert.equal(windows.length, 1);
  assert.equal(delayImpact(windows).worst, 25);
});

test("Carvolth preset resolves service names and finds a covered weekday", () => {
  const data = {
    labels: [
      ["Carvolth", "501", "501 Surrey Central Station", "Bay 4", "out"],
      ["Carvolth", "501", "501 Langley Centre", "Bay 3", "out"],
      ["Carvolth", "555", "555 Port Mann Exp/To Carvolth Exchange", "Bay 1", "in"],
    ],
    calendar: {"2026-11-28": ["a"], "2026-11-30": ["b"], "2026-12-01": ["a"]},
    events: {a: {1: [990], 2: [980]}, b: {2: [972]}},
  };
  assert.deepEqual(carvolthEvening(data, "2026-11-28"), {day: "2026-12-01", incoming: 2, onward: 1});
  assert.equal(carvolthEvening(data, "2026-12-02"), null);
  data.labels[1][2] = "501 Langley Centre via 202A St";
  assert.equal(carvolthEvening(data, "2026-11-28"), null);
});
