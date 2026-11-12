import { useRef, useState } from "react";
import Modal from "./Modal.jsx";
import { Field } from "./Forms.jsx";
import { Notice } from "./Common.jsx";
import { api } from "../services/api.js";

export default function FoundClaimModal({ item, onClose, onSubmitted }) {
  const [foundLocation, setFoundLocation] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  return (
    <Modal
      title="I Found This Item"
      confirmText={busy ? "Submitting…" : "Submit Claim"}
      onClose={() => { if (!submitting.current) onClose(); }}
      onConfirm={async () => {
        if (submitting.current) return false;
        const location = foundLocation.trim();
        const explanation = message.trim();
        if (!location) throw new Error("Enter the location where you found the item.");
        if (location.length > 150) throw new Error("Found location must be 150 characters or fewer.");
        if (!explanation) throw new Error("Explain where and how you found the item.");
        if (explanation.length > 1500) throw new Error("Your message must be 1,500 characters or fewer.");
        submitting.current = true;
        setBusy(true);
        try {
          const claim = await api.submitFoundClaim(item.id, { foundLocation: location, message: explanation });
          onSubmitted(claim);
        } finally {
          submitting.current = false;
          setBusy(false);
        }
      }}
    >
      <dl className="detail-facts">
        <div><dt>Item name</dt><dd>{item.name}</dd></div>
        <div><dt>Item category</dt><dd>{item.category}</dd></div>
        <div><dt>Reported lost location</dt><dd>{item.location}</dd></div>
      </dl>
      <Field label="Location where you found the item" name="foundLocation" required
        maxLength="150" value={foundLocation} disabled={busy}
        onChange={event => setFoundLocation(event.target.value)} />
      <Field label="Where and how did you find it?" name="claimMessage" as="textarea"
        rows="4" required maxLength="1500" value={message} disabled={busy}
        onChange={event => setMessage(event.target.value)} />
      <Notice>Your claim will be saved for the item owner to review. Submitting it does not mark the item as returned.</Notice>
      {busy && <p role="status">Submitting your claim…</p>}
    </Modal>
  );
}
