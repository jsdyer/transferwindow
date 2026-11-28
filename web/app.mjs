import { by, options, row, read, node } from "./ui.mjs";
import { clock, chooseDate, localToday, mins } from "./schedule.mjs";
import { departures, connections, delayImpact, carvolthEvening } from "./model.mjs";
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
    by("impacts").replaceChildren();
    by("worst").textContent = "";
    by("window-summary").textContent = "";
    if (!day || day < data.start || day > data.end || !by("time").value) {
      by("finding").textContent =
        "Choose a date within this timetable and an arrival time.";
      return;
    }
    const arr = departures(data, day, by("in").value),
      dep = departures(data, day, by("out").value, true);
    const from = mins(by("time").value);
    const until = Math.min(1440, from + Number(by("duration").value));
    const forDelay = (minutes) => connections(arr, dep, from, walk, minutes, until);
    const windows = forDelay(delay);
    const fmt = (t) => (t == null ? "No later service in snapshot" : clock(t));
    if (!windows.length) {
      by("finding").textContent =
        "No scheduled arrivals for this service in the selected window.";
      by("window-summary").textContent = "There are no arrival times to compare.";
      return;
    }
    const selected = delayImpact(windows);
    const minutes = (value) => value == null ? "—" : value + " min";
    by("window-summary").textContent = windows.length + " scheduled arrival times from " +
      clock(from) + " to before " + clock(until) + ". " +
      (windows.length - selected.missingBaseline) + " have an onward departure after the " +
      walk + "-minute walk. " + selected.missingBaseline +
      " have no baseline departure in this timetable.";
    for (const choice of by("delay").options) {
      const simulated = Number(choice.value);
      if (simulated === 0) continue;
      const impact = simulated === delay ? selected : delayImpact(forDelay(simulated));
      const tr = row([choice.text, impact.kept, impact.shifted, impact.missingLater,
        minutes(impact.median), minutes(impact.worst)]);
      const button = node("button", choice.text, "tablelink");
      button.type = "button";
      button.setAttribute("aria-label", "Apply a " + simulated + "-minute arrival delay");
      button.setAttribute("aria-pressed", String(simulated === delay));
      button.addEventListener("click", () => {
        by("delay").value = choice.value;
        draw();
        by("impacts").querySelector('[aria-pressed="true"]').focus();
      });
      tr.firstChild.replaceChildren(button);
      by("impacts").append(tr);
    }
    if (selected.worst != null) {
      const times = selected.worstArrivals;
      by("worst").textContent = "The largest shift with a " + delay + "-minute delay is " +
        minutes(selected.worst) + ". It affects " + times.length +
        (times.length === 1 ? " arrival" : " arrivals") + ", " +
        (times.length === 1 ? "at " : "starting at ") + clock(times[0]) + ".";
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
  for (const id of ["in", "out", "date", "time", "duration", "walk", "delay"])
    by(id).addEventListener("change", draw);
  const requested = new URLSearchParams(location.search).get("connection");
  const example = requested === "carvolth-555-to-501" && carvolthEvening(data, localToday());
  if (example) {
    by("hub").value = "Carvolth";
    by("orientation").value = "from555";
    date.value = example.day;
    by("time").value = "16:00";
    by("duration").value = "60";
    by("walk").value = "5";
    by("delay").value = "5";
  } else if (requested === "carvolth-555-to-501") {
    by("preset-note").textContent = "This timetable has no matching upcoming weekday 555-to-501 connection at Carvolth from 4 to 5 p.m. Select another trip below.";
    by("preset-note").hidden = false;
  }
  routeOptions();
  if (example) {
    by("in").value = String(example.incoming);
    by("out").value = String(example.onward);
  }
  draw();
} catch {
  by("finding").textContent =
    "The timetable could not be loaded. Use the source link below.";
}
