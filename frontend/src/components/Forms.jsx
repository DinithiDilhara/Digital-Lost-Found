import { useState } from "react";
import Icon from "./Icon.jsx";

export function FieldError({ name, error }) {
  return (
    <span className="field-error" id={`error-${name}`} data-error={name}>
      {error}
    </span>
  );
}
export function Field({
  label,
  name,
  id = name,
  error,
  as = "input",
  className = "",
  hint,
  children,
  ...props
}) {
  const Control = as;
  return (
    <div className={`field${className ? ` ${className}` : ""}`}>
      <label htmlFor={id}>{label}</label>
      <Control
        id={id}
        name={name}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `error-${name}` : undefined}
        {...props}
      >
        {children}
      </Control>
      <FieldError name={name} error={error} />
      {hint && <span className="field-hint">{hint}</span>}
    </div>
  );
}
export function PasswordField({
  label,
  name,
  autoComplete = "current-password",
  error,
  value,
  onChange,
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <div className="password-wrap">
        <input
          type={show ? "text" : "password"}
          id={name}
          name={name}
          autoComplete={autoComplete}
          required
          value={value}
          onChange={onChange}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? `error-${name}` : undefined}
        />
        <button
          type="button"
          className="icon-button"
          data-password={name}
          aria-label={`${show ? "Hide" : "Show"} ${label.toLowerCase()}`}
          aria-pressed={show}
          onClick={() => setShow((value) => !value)}
        >
          <Icon name="eye" />
        </button>
      </div>
      <FieldError name={name} error={error} />
    </div>
  );
}
