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
  const value = new Date();
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
};
