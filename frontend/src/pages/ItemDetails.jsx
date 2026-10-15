import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Badge, Button, EmptyState, Notice } from "../components/Common.jsx";
import { Field } from "../components/Forms.jsx";
import Icon from "../components/Icon.jsx";
import Modal from "../components/Modal.jsx";
import ContactModal from "../components/ContactModal.jsx";
import { useApp } from "../context/AppContext.jsx";
import { useLoad } from "../hooks.js";
import { api } from "../services/api.js";
import { date, safeImage } from "../utils.js";

export default function ItemDetails() {
  const [params] = useSearchParams();
  const [result] = useLoad(
    async () => ({ item: await api.getItem(params.get("id")) }),
    [params.get("id")],
  );
  const [modal, setModal] = useState(null);
  const [proof, setProof] = useState("");
  const { session, toast, refreshUnread } = useApp();
  const navigate = useNavigate();
  if (!result) return null;
  const { item } = result;
  if (!item)
    return (
      <EmptyState
        title="Item not found"
        message="This report may have been deleted or the link is incomplete."
      >
        <Button to="/index.html#recent-items">Browse recent items</Button>
      </EmptyState>
    );
  const own = session && item.ownerId === session.id;
  const open = (kind) => {
    if (!session) navigate("/login.html");
    else {
      setProof("");
      setModal(kind);
    }
  };
  return (
    <>
      <Link
        className="back-link"
        to={session ? `/${item.type}-items.html` : "/index.html#recent-items"}
      >
        ← Back to {item.type} items
      </Link>
      <div className="detail-layout">
        <div className="detail-image">
          <img src={safeImage(item.image)} alt={item.name} />
          <span className="image-caption">
            {item.image.startsWith("data:")
              ? "Photo provided by the reporter"
              : "Illustration · Sample campus report"}
          </span>
        </div>
        <article className="detail-content">
          <div className="detail-badges">
            <Badge item={item} />
          </div>
          <h2>{item.name}</h2>
          <p className="detail-reference">
            REPORT #{item.id} ·{" "}
            {item.type === "lost"
              ? "Help bring it back home"
              : "Looking for its owner"}
          </p>
          <dl className="detail-facts">
            <div>
              <dt>Category</dt>
              <dd>{item.category}</dd>
            </div>
            <div>
              <dt>Color</dt>
              <dd>{item.color || "Not specified"}</dd>
            </div>
            <div>
              <dt>Location {item.type}</dt>
              <dd>{item.location}</dd>
            </div>
            <div>
              <dt>Date {item.type}</dt>
              <dd>{date(item.date)}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>
                <span className="status-dot" />
                {item.status}
              </dd>
            </div>
          </dl>
          <h3>Description</h3>
          <p className="detail-description">{item.description}</p>
          <div className="reporter">
            <span className="avatar">
              <Icon name="user" />
            </span>
            <div>
              <strong>
                {own ? "Reported by you" : "Campus community member"}
              </strong>
              <small>Personal contact information is kept private.</small>
            </div>
            <Icon name="shield" />
          </div>
          <div className="detail-actions">
            {item.status === "Open" ? (
              <>
                {item.type === "found" && !own && (
                  <Button id="claim-item" onClick={() => open("claim")}>
                    <Icon name="check" />
                    Claim Item
                  </Button>
                )}
                <Button
                  variant={item.type === "lost" ? "primary" : "outline"}
                  id="contact-reporter"
                  onClick={() => open("contact")}
                >
                  <Icon name="mail" />
                  Contact Reporter
                </Button>
                {item.type === "lost" && (
                  <Button variant="outline" to="/possible-matches.html">
                    Possible Match
                  </Button>
                )}
              </>
            ) : (
              <p className="notice">
                This report has been resolved. Thank you for helping your campus
                community.
              </p>
            )}
            {own && (
              <Button
                variant="outline"
                to={`/report-item.html?edit=${item.id}`}
              >
                <Icon name="edit" />
                Edit Report
              </Button>
            )}
          </div>
          <Notice icon="shield">
            Verify identifying details and meet in a public campus location.
          </Notice>
        </article>
      </div>
      {modal === "contact" && (
        <ContactModal itemId={item.id} onClose={() => setModal(null)} />
      )}
      {modal === "claim" && (
        <Modal
          title="Is this your item?"
          confirmText="Submit demo claim"
          onClose={() => setModal(null)}
          onConfirm={async () => {
            await api.claimItem(item.id, proof);
            toast("Demo claim submitted. Track its status in Notifications.");
            await refreshUnread();
          }}
        >
          <p>
            Help the reporter verify that <strong>{item.name}</strong> belongs
            to you. Describe a unique mark, contents, or another identifying
            detail.
          </p>
          <Field
            label="Proof of ownership"
            name="proof"
            as="textarea"
            rows="4"
            maxLength="1500"
            placeholder="Something only the owner would know..."
            hint="At least 15 characters. Do not include passwords or sensitive ID numbers."
            value={proof}
            onChange={(event) => setProof(event.target.value)}
          />
          <Notice>
            This demo claim is saved locally and is not sent to a reporter.
          </Notice>
        </Modal>
      )}
    </>
  );
}
