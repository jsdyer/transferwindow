export function clock(minutes) {
  const n = ((minutes % 1440) + 1440) % 1440;
  const hh = Math.floor(n / 60),
    mm = String(n % 60).padStart(2, "0");
  return (
    (hh % 12 || 12) +
    ":" +
    mm +
    " " +
    (hh < 12 ? "am" : "pm") +
    (minutes >= 1440 ? " (+1 day)" : "")
  );
}
export function adjacent(day, offset) {
  const date = new Date(day + "T12:00:00Z");
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}
export function localToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Vancouver",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
export function serviceSets(data, day) {
  return [-1, 0, 1].flatMap((offset) =>
    (data.calendar[adjacent(day, offset)] || []).map((id) => ({
      group: data.events[id],
      offset: offset * 1440,
    })),
  );
}
export function chooseDate(data) {
  const today = localToday();
  return today < data.start ? data.start : today > data.end ? data.end : today;
}
export function mins(time) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}
