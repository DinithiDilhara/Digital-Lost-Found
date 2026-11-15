import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "./Modal.jsx";
import { Field } from "./Forms.jsx";
import { Notice } from "./Common.jsx";
import { api } from "../services/api.js";
import { useApp } from "../context/AppContext.jsx";

const quickMessages = [
  "I think this item belongs to me. Can we verify the details?",
  "Could you share more information about this item?",
  "Where can we meet on campus to verify the item?",
  "Is this item still available?",
];

export default function ContactModal({ itemId, onClose }) {
  const [message, setMessage] = useState("");
  const [selectedQuickMessage, setSelectedQuickMessage] = useState(-1);
  const submission = useRef(null);
  const { toast } = useApp();
  const navigate = useNavigate();
  return (
    <Modal
      title="Contact the reporter"
      confirmText="Send Message"
      onClose={onClose}
      onConfirm={async () => {
        const content = message.trim();
        if (!content) throw new Error("Write a message before sending.");
        if (content.length > 1500) throw new Error("Messages can be up to 1,500 characters.");
        if (submission.current?.message !== content) {
          submission.current = { message: content, key: crypto.randomUUID() };
        }
        const result = await api.contactReporter(itemId, content, submission.current.key);
        toast("Your message was sent to the item's reporter.");
        navigate(`/messages.html?conversation=${result.conversationId}`);
      }}
    >
      <p>
        Choose a quick message or write your own. It will be sent privately to
        the student who reported this item.
      </p>
      <div className="contact-quick-messages" aria-label="Quick messages">
        {quickMessages.map((value, index) => (
          <button
            type="button"
            className={`contact-quick-message${selectedQuickMessage === index ? " selected" : ""}`}
            aria-pressed={selectedQuickMessage === index}
            key={value}
            onClick={() => {
              setSelectedQuickMessage(index);
              setMessage(value);
            }}
          >
            {value}
          </button>
        ))}
      </div>
      <Field
        label="Your message"
        name="message"
        as="textarea"
        rows="3"
        maxLength="1500"
        placeholder="Write a private message..."
        value={message}
        onChange={(event) => {
          setMessage(event.target.value);
          if (!quickMessages.includes(event.target.value)) setSelectedQuickMessage(-1);
        }}
      />
      <Notice icon="shield">Personal contact details stay private.</Notice>
    </Modal>
  );
}
