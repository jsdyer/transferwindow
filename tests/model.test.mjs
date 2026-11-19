import test from "node:test";
import assert from "node:assert/strict";
import { departures, connections } from "../web/model.mjs";

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
