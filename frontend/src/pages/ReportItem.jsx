import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button, EmptyState, Notice } from "../components/Common.jsx";
import { Field, FieldError } from "../components/Forms.jsx";
import Icon from "../components/Icon.jsx";
import { useApp } from "../context/AppContext.jsx";
import { useLoad } from "../hooks.js";
import { api } from "../services/api.js";
import { data } from "../services/data.js";
import {
  focusInvalid,
  required,
  safeImage,
  today,
  validate,
} from "../utils.js";

export default function ReportItem() {
  const [params] = useSearchParams();
  const id = params.get("edit");
  const [result] = useLoad(
    async () => ({ existing: id ? await api.getItem(id) : null }),
    [id],
  );
  const [type, setType] = useState(
    ["lost", "found"].includes(params.get("type")) ? params.get("type") : "",
  );
  const { session } = useApp();
  if (!result) return null;
  const { existing } = result;
  if (id && (!existing || existing.ownerId !== session.id))
    return (
      <EmptyState
        title="Report unavailable"
        message="Only your own reports can be edited."
      >
        <Button to="/my-reports.html">My Reports</Button>
      </EmptyState>
    );
  const selectedType = existing?.type || type;
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">EVERY REPORT MAKES A DIFFERENCE</span>
          <h2>
            {existing ? "Edit Your Report" : "What would you like to report?"}
          </h2>
          <p>
            {existing
              ? "Keep your report up to date so your campus can help."
              : "Lost something or found something? You’re in the right place."}
          </p>
        </div>
      </div>
      {!existing && (
        <div className="report-choices">
          {[
            [
              "lost",
              "Report Lost Item",
              "Let your campus help you find it.",
              "search",
            ],
            [
              "found",
              "Report Found Item",
              "Help someone get their belongings back.",
              "found",
            ],
          ].map(([value, title, description, glyph]) => (
            <button
              key={value}
              className={`report-choice ${value}${value === selectedType ? " selected" : ""}`}
              data-type={value}
              aria-pressed={value === selectedType}
              onClick={() => setType(value)}
            >
              <span className="choice-icon">
                <Icon name={glyph} />
              </span>
              <span>
                <strong>{title}</strong>
                <small>{description}</small>
              </span>
              <span className="choice-check">
                <Icon name="check" />
              </span>
            </button>
          ))}
        </div>
      )}
      <div id="report-form-slot">
        {selectedType && (
          <ReportForm
            key={`${selectedType}-${id || "new"}`}
            type={selectedType}
            existing={existing}
          />
        )}
      </div>
    </>
  );
}

function ReportForm({ type, existing }) {
  const [values, setValues] = useState({
    name: "",
    category: "",
    color: "",
    date: "",
    location: "",
    description: "",
    contact: "",
    ...existing,
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [image, setImage] = useState(existing?.image || "");
  const [imageError, setImageError] = useState("");
  const [imageLoading, setImageLoading] = useState(false);
  const [imageChanged, setImageChanged] = useState(false);
  const fileRef = useRef(null);
  const imageVersion = useRef(0);
  const { toast } = useApp();
  const navigate = useNavigate();
  const change = (event) =>
    setValues((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  useEffect(
    () => () => {
      imageVersion.current++;
    },
    [],
  );
  const upload = async (event) => {
    const input = event.target;
    const version = ++imageVersion.current;
    const file = input.files[0];
    setImageError("");
    if (!file) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 2 * 1024 * 1024
    ) {
      setImageError("Choose a JPG, PNG, or WebP image smaller than 2 MB.");
      input.value = "";
      setImageLoading(false);
      return;
    }
    setImageLoading(true);
    try {
      const result = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Could not read that image."));
        reader.readAsDataURL(file);
      });
      const preview = new Image();
      await new Promise((resolve, reject) => {
        preview.onload = resolve;
        preview.onerror = () =>
          reject(new Error("This file is not a valid image."));
        preview.src = result;
      });
      if (version !== imageVersion.current) return;
      setImage(result);
      setImageChanged(true);
    } catch (error) {
      if (version === imageVersion.current) setImageError(error.message);
    } finally {
      if (version === imageVersion.current) setImageLoading(false);
    }
  };
  const removeImage = () => {
    imageVersion.current++;
    setImageLoading(false);
    setImage("");
    fileRef.current.value = "";
  };
  const submit = async (event) => {
    event.preventDefault();
    const issues = validate(values, {
      name: required("Item name"),
      category: required("Category"),
      date: (value) =>
        !value
          ? "Date is required."
          : value > today()
            ? "The date cannot be in the future."
            : "",
      location: required("Location"),
      description: required("Description"),
    });
    setErrors(issues);
    if (Object.values(issues).some(Boolean)) {
      focusInvalid(event.currentTarget, issues);
      return;
    }
    if (imageLoading) {
      toast("Wait for the image preview to finish.", "warning");
      return;
    }
    const payload = Object.fromEntries(
      [
        "name",
        "category",
        "color",
        "date",
        "location",
        "description",
        ...(type === "lost" ? ["contact"] : []),
      ].map((key) => [key, values[key].trim()]),
    );
    payload.image = image;
    setBusy(true);
    setFormError("");
    try {
      if (existing) await api.updateReport(existing.id, payload);
      else if (type === "lost") await api.reportLostItem(payload);
      else await api.reportFoundItem(payload);
      toast(
        existing
          ? "Report updated successfully."
          : `${type === "lost" ? "Lost" : "Found"} item reported successfully.`,
      );
      navigate("/my-reports.html");
    } catch (error) {
      setFormError(error.message);
      setBusy(false);
    }
  };
  const requiredLabel = (text) => (
    <>
      {text} <span className="required">*</span>
    </>
  );
  const label = type === "lost" ? "Lost" : "Found";
  return (
    <div className="report-layout">
      <section className="panel report-panel">
        <div className="panel-title">
          <h3>{existing ? "Report details" : `${label} item details`}</h3>
          <p>
            Fields marked with <span className="required">*</span> are required.
          </p>
        </div>
        <form id="report-form" noValidate onSubmit={submit}>
          <div className="form-grid">
            <Field
              className="span-two"
              label={requiredLabel("Item Name")}
              name="name"
              placeholder="e.g. Black Casio Calculator"
              maxLength="100"
              required
              value={values.name}
              onChange={change}
              error={errors.name}
            />
            <Field
              label={requiredLabel("Category")}
              name="category"
              as="select"
              required
              value={values.category}
              onChange={change}
              error={errors.category}
            >
              <option value="">Select a category</option>
              {data.categories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </Field>
            <Field
              label="Color"
              name="color"
              placeholder="e.g. Black"
              maxLength="40"
              value={values.color}
              onChange={change}
            />
            <Field
              label={requiredLabel(`Date ${label}`)}
              name="date"
              type="date"
              max={today()}
              required
              value={values.date}
              onChange={change}
              error={errors.date}
            />
            <div className="field">
              <label htmlFor="location">
                {requiredLabel(`Location ${label}`)}
              </label>
              <input
                id="location"
                name="location"
                list="campus-locations"
                placeholder="Select or type a campus location"
                maxLength="100"
                required
                value={values.location}
                onChange={change}
                aria-invalid={errors.location ? "true" : undefined}
                aria-describedby={
                  errors.location ? "error-location" : undefined
                }
              />
              <datalist id="campus-locations">
                {data.locations.map((location) => (
                  <option key={location} value={location} />
                ))}
              </datalist>
              <FieldError name="location" error={errors.location} />
            </div>
            <Field
              className="span-two"
              label={requiredLabel("Description")}
              name="description"
              as="textarea"
              rows="4"
              placeholder="Describe the item and where it was last seen. A few details can make a big difference."
              maxLength="2000"
              required
              value={values.description}
              onChange={change}
              error={errors.description}
            />
            {type === "lost" && (
              <Field
                className="span-two"
                label={
                  <>
                    Contact Information{" "}
                    <span className="optional">(optional)</span>
                  </>
                }
                name="contact"
                placeholder="Preferred email or contact details"
                maxLength="150"
                hint="Stored in your report locally; not shown in public item details."
                value={values.contact}
                onChange={change}
              />
            )}
            <div className="field span-two">
              <label htmlFor="image">
                Upload Image <span className="optional">(optional)</span>
              </label>
              <div className="upload-zone">
                <span className="upload-icon">
                  <Icon name="upload" />
                </span>
                <strong>Add a photo of the item</strong>
                <span>JPG, PNG or WebP · Up to 2 MB</span>
                <input
                  ref={fileRef}
                  type="file"
                  id="image"
                  name="imageFile"
                  accept="image/jpeg,image/png,image/webp"
                  aria-describedby="error-image"
                  aria-invalid={imageError ? "true" : undefined}
                  onChange={upload}
                />
                <div id="image-preview">
                  {image && (
                    <img
                      src={safeImage(image)}
                      alt={
                        imageChanged
                          ? "Selected item image preview"
                          : "Current item image"
                      }
                    />
                  )}
                </div>
                <button
                  type="button"
                  className="text-button"
                  id="remove-image"
                  hidden={!image}
                  onClick={removeImage}
                >
                  Remove image
                </button>
              </div>
              <FieldError name="image" error={imageError} />
            </div>
          </div>
          <p className="form-error" id="report-error" role="alert">
            {formError}
          </p>
          <div className="form-actions">
            <Button variant="plain" to="/my-reports.html">
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              <Icon name="plus" />
              {existing ? "Save Changes" : `Submit ${label} Report`}
            </Button>
          </div>
        </form>
      </section>
      <aside className="report-tips">
        <span className="tips-icon">
          <Icon name="match" />
        </span>
        <h3>A good report goes a long way.</h3>
        <div>
          <strong>Be specific</strong>
          <p>Add the brand, color, and a useful description.</p>
        </div>
        <div>
          <strong>Pinpoint the location</strong>
          <p>A building, floor, or nearby landmark helps narrow the search.</p>
        </div>
        <div>
          <strong>Keep a detail to yourself</strong>
          <p>Save one unique detail to help verify ownership.</p>
        </div>
        <Notice icon="shield">
          Avoid sharing sensitive personal information in your description.
        </Notice>
      </aside>
    </div>
  );
}
