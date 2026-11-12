export const date = (value) =>
  new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
export const initials = (name) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
export const safeImage = (source) =>
  /^(assets\/images\/[a-z-]+\.svg|data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+)$/.test(
    source || "",
  )
    ? source
    : "assets/images/other.svg";
export const required = (label) => (value) =>
  value.trim() ? "" : `${label} is required.`;
export const emailRule = (value) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    ? ""
    : "Enter a valid university email address.";
export function validate(values, rules) {
  return Object.fromEntries(
    Object.entries(rules).map(([name, check]) => [
      name,
      check(values[name] || ""),
    ]),
  );
}
export function focusInvalid(form, errors) {
  const first = Array.from(form.elements).find((field) => errors[field.name]);
  first?.focus();
}
export const today = () => {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
};
export function reportDateError(value, currentDate = today()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) {
    return value ? "Enter a valid calendar date." : "Date is required.";
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== value) {
    return "Enter a valid calendar date.";
  }
  if (value > currentDate) {
    return "The date cannot be in the future (Sri Lanka time).";
  }
  return "";
}
export function filterDateError(value, currentDate = today()) {
  return value ? reportDateError(value, currentDate) : "";
}
