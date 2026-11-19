export function clock(minutes) {
  const n = ((minutes % 1440) + 1440) % 1440;
  const hh = Math.floor(n / 60),
    mm = String(n % 60).padStart(2, "0");
  const days = Math.floor(minutes / 1440);
  return (
    (hh % 12 || 12) +
    ":" +
    mm +
    " " +
    (hh < 12 ? "am" : "pm") +
    (days > 0 ? ` (+${days} ${days === 1 ? "day" : "days"})` : "")
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
export function serviceSets(data, day, searchThroughEnd = false) {
  const previous = adjacent(day, -1),
    next = adjacent(day, 1);
  const first = Date.parse(day);
  return Object.entries(data.calendar)
    .filter(([date]) => date >= previous && (searchThroughEnd || date <= next))
    .flatMap(([date, services]) =>
      services.map((id) => ({
        group: data.events[id],
        offset: (Date.parse(date) - first) / 60000,
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
