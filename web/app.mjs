import { by, options, row, read } from "./ui.mjs";
import { clock, chooseDate, mins } from "./schedule.mjs";
import { departures, connections } from "./model.mjs";
try {
  const data = await read("schedule"),
    date = by("date");
  date.min = data.start;
  date.max = data.end;
  date.value = chooseDate(data);
  by("edition").textContent =
    "Timetable " +
    data.start +
    " – " +
    data.end +
    " · retrieved " +
    data.retrieved +
    " · Pacific time";
  function routeOptions() {
    const arriving555 = by("orientation").value === "from555",
      hub = by("hub").value;
    for (const [id, role, focus] of [
      ["in", "in", arriving555],
      ["out", "out", !arriving555],
    ]) {
      const choices = data.labels
        .map(([h, line, name, bay, type], index) => ({
          h,
          line,
          name,
          bay,
          type,
          index,
        }))
        .filter(
          (v) => v.h === hub && v.type === role && (v.line === "555") === focus,
        )
        .sort((a, b) =>
          a.name.localeCompare(b.name, undefined, { numeric: true }),
        );
      const current = choices.find((v) => String(v.index) === by(id).value);
      const typical = choices.find(
        (v) =>
          v.name === "Millennium Line To VCC-Clark" ||
          v.name === "501 Langley Centre",
      );
      options(
        by(id),
        choices.map((v) => [String(v.index), v.name + " · " + v.bay]),
        String((current || typical || choices[0])?.index),
      );
    }
  }
  function draw() {
    const day = date.value,
      walk = Number(by("walk").value),
      delay = Number(by("delay").value);
    by("rows").replaceChildren();
    if (!day || day < data.start || day > data.end || !by("time").value) {
      by("finding").textContent =
        "Choose a date within this timetable and an arrival time.";
      return;
    }
    const arr = departures(data, day, by("in").value),
      dep = departures(data, day, by("out").value, true);
    const windows = connections(arr, dep, mins(by("time").value), walk, delay);
    const fmt = (t) => (t == null ? "No later service in snapshot" : clock(t));
    if (!windows.length) {
      by("finding").textContent =
        "No scheduled arrivals for this selection after your chosen time.";
      return;
    }
    const first = windows[0];
    by("finding").textContent =
      first.usable == null
        ? "No onward departure found after the first arrival and selected allowance."
        : "Arrive " +
          clock(first.arrive) +
          ", connect at " +
          clock(first.usable) +
          ". " +
          (first.usable - first.arrive - walk - delay) +
          " minutes remain after the selected walk and delay.";
    by("rows").replaceChildren(
      ...windows.map((r) =>
        row([
          clock(r.arrive),
          fmt(r.first),
          fmt(r.usable),
          r.later == null ? "—" : r.later - r.usable + " min",
        ]),
      ),
    );
  }
  for (const id of ["hub", "orientation"])
    by(id).addEventListener("change", () => {
      routeOptions();
      draw();
    });
  for (const id of ["in", "out", "date", "time", "walk", "delay"])
    by(id).addEventListener("change", draw);
  routeOptions();
  draw();
} catch {
  by("finding").textContent =
    "The timetable could not be loaded. Use the source link below.";
}
