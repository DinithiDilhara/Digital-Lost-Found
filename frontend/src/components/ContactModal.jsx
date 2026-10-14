import { useState } from "react";
import Modal from "./Modal.jsx";
import { Field } from "./Forms.jsx";
import { Notice } from "./Common.jsx";
import { api } from "../services/api.js";
import { useApp } from "../context/AppContext.jsx";

export default function ContactModal({ itemId, onClose }) {
  const [message, setMessage] = useState("");
  const { toast } = useApp();
  return (
    <Modal
      title="Contact the reporter"
      confirmText="Save demo message"
      onClose={onClose}
      onConfirm={async () => {
        await api.contactReporter(itemId, message);
        toast("Demo message saved locally. No message was sent.");
      }}
    >
      <p>
        Introduce yourself and describe the item. Your message will be saved
        only in this browser for the prototype.
      </p>
      <Field
        label="Your message"
        name="message"
        as="textarea"
        rows="4"
        maxLength="1500"
        placeholder="Hi, I think this might be my item..."
        value={message}
        onChange={(event) => setMessage(event.target.value)}
      />
      <Notice icon="shield">Personal contact details stay private.</Notice>
    </Modal>
  );
}
