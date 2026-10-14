import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Icon from "./Icon.jsx";
import { Button } from "./Common.jsx";

// Native dialog retains the original focus trap, backdrop and Escape behavior.
export default function Modal({
  title,
  children,
  confirmText = "Confirm",
  danger = false,
  onConfirm,
  onClose,
}) {
  const ref = useRef(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const previous = document.activeElement;
    const dialog = ref.current;
    dialog.showModal();
    return () => {
      dialog.close();
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      if ((await onConfirm(event.currentTarget)) !== false) onClose();
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  };
  return createPortal(
    <dialog
      className="modal"
      ref={ref}
      aria-labelledby="modal-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target !== ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        if (
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom
        )
          onClose();
      }}
    >
      <div className="modal-heading">
        <h2 id="modal-title">{title}</h2>
        <button
          type="button"
          className="icon-button"
          data-close
          aria-label="Close dialog"
          onClick={onClose}
        >
          <Icon name="close" />
        </button>
      </div>
      <form noValidate onSubmit={submit}>
        <div className="modal-content">{children}</div>
        <p className="form-error" role="alert" data-modal-error>
          {error}
        </p>
        <div className="modal-actions">
          <Button variant="plain" type="button" data-close onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={danger ? "danger" : "primary"}
            type="submit"
            disabled={busy}
          >
            {confirmText}
          </Button>
        </div>
      </form>
    </dialog>,
    document.body,
  );
}
