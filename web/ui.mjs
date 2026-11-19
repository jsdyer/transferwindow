export const by = (id) => document.getElementById(id);
export function node(tag, value, cls) {
  const item = document.createElement(tag);
  if (value != null) item.textContent = value;
  if (cls) item.className = cls;
  return item;
}
export function options(el, items, preferred) {
  const old = preferred ?? el.value;
  el.replaceChildren(...items.map(([v, t]) => new Option(t, v)));
  if (items.some(([v]) => String(v) === String(old))) el.value = old;
}
export function row(values, head = false) {
  const tr = node("tr");
  values.forEach((x, i) => tr.append(node(head || !i ? "th" : "td", x)));
  return tr;
}
export function comma(n) {
  return n == null
    ? "—"
    : n.toLocaleString("en-CA", { maximumFractionDigits: 1 });
}
export async function read(path) {
  const res = await fetch("./data/" + path + ".json");
  if (!res.ok) throw Error("Source snapshot unavailable");
  return res.json();
}
