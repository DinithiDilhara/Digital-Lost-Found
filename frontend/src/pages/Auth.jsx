import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Brand, Button } from "../components/Common.jsx";
import { Field, PasswordField } from "../components/Forms.jsx";
import Icon from "../components/Icon.jsx";
import Modal from "../components/Modal.jsx";
import { api } from "../services/api.js";
import { useApp } from "../context/AppContext.jsx";
import { emailRule, focusInvalid, required, validate } from "../utils.js";

export default function Auth({ register = false }) {
  const [values, setValues] = useState({
    name: "",
    registration: "",
    email: "",
    password: "",
    confirmPassword: "",
    remember: false,
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [reset, setReset] = useState(null);
  const { login, toast } = useApp();
  const navigate = useNavigate();
  const change = (event) =>
    setValues((current) => ({
      ...current,
      [event.target.name]:
        event.target.type === "checkbox"
          ? event.target.checked
          : event.target.value,
    }));
  const submit = async (event) => {
    event.preventDefault();
    const rules = {
      email: emailRule,
      password: register
        ? (value) => (value.length >= 8 ? "" : "Use at least 8 characters.")
        : required("Password"),
    };
    if (register)
      Object.assign(rules, {
        name: required("Full name"),
        registration: required("Registration number"),
        confirmPassword: (value) =>
          value && value === values.password ? "" : "Passwords must match.",
      });
    const issues = validate(values, rules);
    setErrors(issues);
    if (Object.values(issues).some(Boolean)) {
      focusInvalid(event.currentTarget, issues);
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (register) {
        await api.registerUser({
          ...values,
          email: values.email.trim(),
          name: values.name.trim(),
        });
        toast("Account created. Log in to get started.");
        navigate("/login.html");
      } else {
        await login({ ...values, email: values.email.trim() });
        navigate("/dashboard.html");
      }
    } catch (error) {
      setError(error.message);
      setBusy(false);
    }
  };
  return (
    <main className="auth-layout" id="main">
      <aside className="auth-story">
        <Brand />
        <div className="auth-story-content">
          <span className="eyebrow">LOST THINGS. FOUND CONNECTIONS.</span>
          <h1>
            A small act.
            <br />A big relief.
          </h1>
          <p>
            That thing you’re looking for?
            <br />
            Someone on campus might have found it.
          </p>
          <div className="auth-illustration">
            <img src="assets/images/backpack.svg" alt="Backpack illustration" />
            <span className="auth-found">
              <Icon name="check" />
              Back where it belongs.
            </span>
          </div>
          <blockquote>
            “A connected campus makes all the difference.”
          </blockquote>
          <span className="auth-story-footer">
            Built for your campus community.
          </span>
        </div>
      </aside>
      <section className="auth-panel">
        <Link className="back-link" to="/index.html">
          ← Back to home
        </Link>
        <div className="auth-form-container">
          <span className="auth-mobile-brand">
            <Brand />
          </span>
          <div className="auth-heading">
            <div className="auth-symbol">
              <Icon name={register ? "user" : "heart"} />
            </div>
            <h2>{register ? "Create Your Account" : "Welcome Back"}</h2>
            <p>
              {register
                ? "Join a campus that looks out for each other."
                : "Login to continue to DigitalLostFound"}
            </p>
          </div>
          <form id="auth-form" noValidate onSubmit={submit}>
            {register && (
              <>
                <Field
                  label="Full Name"
                  name="name"
                  autoComplete="name"
                  placeholder="Nipuni Liyanage"
                  maxLength="80"
                  required
                  value={values.name}
                  onChange={change}
                  error={errors.name}
                />
                <Field
                  label="Registration Number"
                  name="registration"
                  placeholder="EG/2023/XXXX"
                  maxLength="40"
                  required
                  value={values.registration}
                  onChange={change}
                  error={errors.registration}
                />
              </>
            )}
            <Field
              label="University Email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="student@eng.ruh.ac.lk"
              maxLength="150"
              required
              value={values.email}
              onChange={change}
              error={errors.email}
            />
            <PasswordField
              label="Password"
              name="password"
              autoComplete={register ? "new-password" : "current-password"}
              value={values.password}
              onChange={change}
              error={errors.password}
            />
            {register ? (
              <>
                <p className="field-hint password-hint">
                  Use at least 8 characters.
                </p>
                <PasswordField
                  label="Confirm Password"
                  name="confirmPassword"
                  autoComplete="new-password"
                  value={values.confirmPassword}
                  onChange={change}
                  error={errors.confirmPassword}
                />
              </>
            ) : (
              <div className="auth-options">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="remember"
                    checked={values.remember}
                    onChange={change}
                  />
                  Remember Me
                </label>
                <button
                  className="text-button"
                  type="button"
                  id="forgot-password"
                  onClick={() => setReset(values.email)}
                >
                  Forgot Password?
                </button>
              </div>
            )}
            <p className="form-error" id="auth-error" role="alert">
              {error}
            </p>
            <Button className="full-width" type="submit" disabled={busy}>
              {register ? "Create Account" : "Login"}
              <Icon name="arrow" />
            </Button>
          </form>
          <p className="auth-switch">
            {register ? (
              <>
                Already have an account? <Link to="/login.html">Login</Link>
              </>
            ) : (
              <>
                Don’t have an account?{" "}
                <Link to="/register.html">Create Account</Link>
              </>
            )}
          </p>
          <div className="demo-notice">
            <Icon name="info" />
            <p>
              <strong>Frontend demo</strong>
              {register
                ? "Account details are saved in this browser. Passwords are never stored."
                : "Use any valid email and any nonempty password. Authentication is simulated."}
            </p>
          </div>
        </div>
        <p className="auth-copyright">
          © 2026 DigitalLostFound · Made for campus life
        </p>
      </section>
      {reset !== null && (
        <Modal
          title="Reset your password"
          confirmText="Preview reset request"
          onClose={() => setReset(null)}
          onConfirm={() => {
            const message = emailRule(reset);
            if (message) throw new Error(message);
            toast("Reset request previewed. No email was sent.");
          }}
        >
          <p>
            This prototype does not send email or store passwords. You can log
            in with any nonempty password.
          </p>
          <Field
            label="University Email"
            name="reset-email"
            type="email"
            autoComplete="email"
            value={reset}
            onChange={(event) => setReset(event.target.value)}
          />
        </Modal>
      )}
    </main>
  );
}
