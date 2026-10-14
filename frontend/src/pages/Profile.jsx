import { useState } from "react";
import { Button, Notice } from "../components/Common.jsx";
import { Field, PasswordField } from "../components/Forms.jsx";
import Icon from "../components/Icon.jsx";
import Modal from "../components/Modal.jsx";
import { useApp } from "../context/AppContext.jsx";
import { useLoad } from "../hooks.js";
import { api } from "../services/api.js";
import {
  emailRule,
  focusInvalid,
  initials,
  required,
  validate,
} from "../utils.js";

export default function Profile() {
  const { user, setUser, toast } = useApp();
  const [reports] = useLoad(() => api.getMyReports());
  const [modal, setModal] = useState(null);
  if (!reports || !user) return null;
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">YOUR CAMPUS IDENTITY</span>
          <h2>My Profile</h2>
          <p>A familiar face in a connected community.</p>
        </div>
      </div>
      <div className="profile-layout">
        <aside className="panel profile-summary">
          <div className="profile-cover" />
          <div className="avatar profile-avatar">{initials(user.name)}</div>
          <h3>{user.name}</h3>
          <p>Campus community member</p>
          <span className="profile-pill">
            <Icon name="campus" />
            Student
          </span>
          <div className="profile-stats">
            <div>
              <strong>{reports.length}</strong>
              <span>Reports</span>
            </div>
            <div>
              <strong>
                {reports.filter((item) => item.status !== "Open").length}
              </strong>
              <span>Resolved</span>
            </div>
          </div>
          <div className="profile-thanks">
            <Icon name="heart" />
            Thank you for making campus a little more connected.
          </div>
        </aside>
        <div>
          <section className="panel profile-details">
            <div className="content-heading">
              <h3>Personal Information</h3>
              <Button
                variant="outline"
                className="btn-small"
                id="edit-profile"
                onClick={() => setModal("profile")}
              >
                <Icon name="edit" />
                Edit Profile
              </Button>
            </div>
            <dl className="profile-fields">
              <div>
                <dt>Full Name</dt>
                <dd>{user.name}</dd>
              </div>
              <div>
                <dt>Registration Number</dt>
                <dd>{user.registration}</dd>
              </div>
              <div>
                <dt>University Email</dt>
                <dd>{user.email}</dd>
              </div>
            </dl>
            <Notice icon="shield">
              Your email and registration number are not displayed on public
              reports.
            </Notice>
          </section>
          <section className="panel security-panel">
            <span className="security-icon">
              <Icon name="shield" />
            </span>
            <div>
              <h3>Account Security</h3>
              <p>Manage your password and account access.</p>
            </div>
            <Button
              variant="outline"
              className="btn-small"
              id="change-password"
              onClick={() => setModal("password")}
            >
              Change Password
            </Button>
          </section>
          <p className="prototype-caption">
            Profile changes are saved in this browser for the frontend
            prototype.
          </p>
        </div>
      </div>
      {modal === "profile" && (
        <EditProfile
          user={user}
          onClose={() => setModal(null)}
          onSave={(updated) => {
            setUser(updated);
            toast("Profile updated successfully.");
          }}
        />
      )}
      {modal === "password" && (
        <ChangePassword onClose={() => setModal(null)} />
      )}
    </>
  );
}
function EditProfile({ user, onSave, onClose }) {
  const [values, setValues] = useState({
    name: user.name,
    registration: user.registration,
    email: user.email,
  });
  const [errors, setErrors] = useState({});
  const change = (event) =>
    setValues((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  return (
    <Modal
      title="Edit your profile"
      confirmText="Save Changes"
      onClose={onClose}
      onConfirm={async (form) => {
        const issues = validate(values, {
          name: required("Full name"),
          registration: required("Registration number"),
          email: emailRule,
        });
        setErrors(issues);
        if (Object.values(issues).some(Boolean)) {
          focusInvalid(form, issues);
          return false;
        }
        onSave(
          await api.updateProfile(
            Object.fromEntries(
              Object.entries(values).map(([key, value]) => [key, value.trim()]),
            ),
          ),
        );
      }}
    >
      <Field
        label="Full Name"
        name="name"
        id="profile-name"
        maxLength="80"
        autoComplete="name"
        value={values.name}
        onChange={change}
        error={errors.name}
      />
      <Field
        label="Registration Number"
        name="registration"
        id="profile-registration"
        maxLength="40"
        value={values.registration}
        onChange={change}
        error={errors.registration}
      />
      <Field
        label="University Email"
        name="email"
        id="profile-email"
        type="email"
        maxLength="150"
        autoComplete="email"
        value={values.email}
        onChange={change}
        error={errors.email}
      />
    </Modal>
  );
}
function ChangePassword({ onClose }) {
  const [values, setValues] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const { toast } = useApp();
  const change = (event) =>
    setValues((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  return (
    <Modal
      title="Change password"
      confirmText="Preview password change"
      onClose={onClose}
      onConfirm={async (form) => {
        const issues = validate(values, {
          newPassword: (value) =>
            value.length >= 8 ? "" : "Use at least 8 characters.",
          confirmPassword: (value) =>
            value && value === values.newPassword
              ? ""
              : "Passwords must match.",
        });
        setErrors(issues);
        if (Object.values(issues).some(Boolean)) {
          focusInvalid(form, issues);
          return false;
        }
        await api.changePassword(values.newPassword);
        toast("Password change validated. Demo passwords are not stored.");
      }}
    >
      <p>
        Preview the password change flow. This demo does not store or enforce
        passwords.
      </p>
      <PasswordField
        label="New Password"
        name="newPassword"
        autoComplete="new-password"
        value={values.newPassword}
        onChange={change}
        error={errors.newPassword}
      />
      <PasswordField
        label="Confirm Password"
        name="confirmPassword"
        autoComplete="new-password"
        value={values.confirmPassword}
        onChange={change}
        error={errors.confirmPassword}
      />
    </Modal>
  );
}
