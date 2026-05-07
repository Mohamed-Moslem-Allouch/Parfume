export function formatCurrency(value: number | string) {
  const amount = typeof value === "string" ? Number(value) : value;
  const formatted = Number.isInteger(amount)
    ? amount.toString()
    : amount.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");

  return `${formatted} TND`;
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(date));
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function createOrderNumber() {
  const date = new Date();
  const stamp = date
    .toISOString()
    .slice(2, 10)
    .replace(/-/g, "");
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();

  return `AL-${stamp}-${suffix}`;
}

export function toNumber(value: { toString: () => string } | number) {
  return typeof value === "number" ? value : Number(value.toString());
}
