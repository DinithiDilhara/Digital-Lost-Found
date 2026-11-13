import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Badge, Button, EmptyState, Notice } from "../components/Common.jsx";
import { Field } from "../components/Forms.jsx";
import Icon from "../components/Icon.jsx";
import Modal from "../components/Modal.jsx";
import ContactModal from "../components/ContactModal.jsx";
import FoundClaimModal from "../components/FoundClaimModal.jsx";
import { useApp } from "../context/AppContext.jsx";
import { useLoad } from "../hooks.js";
import { api } from "../services/api.js";
import { date, safeImage } from "../utils.js";
import "./claims.css";

export default function ItemDetails() {
  const [params] = useSearchParams();
  const { session, toast } = useApp();
  const [result, reloadItem] = useLoad(
    async () => ({ item: await api.getItem(params.get("id")) }),
    [params.get("id")],
  );
  const item = result?.item;
  const own = Boolean(session && item && item.ownerId === session.id);
  const [claims, setClaims] = useState(null);
  const [claimsError, setClaimsError] = useState("");
  const [claimsRevision, setClaimsRevision] = useState(0);
  useEffect(() => {
    let active = true;
    if (!own || item?.type !== "lost") {
      setClaims([]);
      setClaimsError("");
      return () => { active = false; };
    }
    setClaims(null);
    setClaimsError("");
    api.getLostClaims(item.id).then(
      (rows) => {
        if (active) setClaims(rows);
      },
      (error) => {
        if (active) {
          setClaims(null);
          setClaimsError(error.message);
        }
      },
    );
    return () => { active = false; };
  }, [item?.id, own, claimsRevision]);
  const reloadClaims = () => setClaimsRevision((revision) => revision + 1);
  const [modal, setModal] = useState(null);
  const [proof, setProof] = useState("");
  const [submittedClaim, setSubmittedClaim] = useState(null);
  const [busyClaim, setBusyClaim] = useState(null);
  const [returning, setReturning] = useState(false);
  const navigate = useNavigate();
  if (!result) return <p className="notice" role="status">Loading…</p>;
  if (!item)
    return (
      <EmptyState
        title="Item not found"
        message="This report may have been deleted or the link is incomplete."
      >
        <Button to="/index.html#recent-items">Browse recent items</Button>
      </EmptyState>
    );
  const open = (kind) => {
    if (!session) navigate("/login.html");
    else {
      setProof("");
      setModal(kind);
    }
  };
  const decideClaim = async (claimId, status) => {
    setBusyClaim(claimId);
    try {
      await api.decideClaim(claimId, status);
      reloadClaims();
      toast(status === "ACCEPTED" ? "Claim accepted." : "Claim rejected.");
    } catch (error) {
      toast(error.message, "error");
    } finally {
      setBusyClaim(null);
    }
  };
  const confirmReturn = async () => {
    setReturning(true);
    try {
      await api.markLostItemReturned(item.id);
      reloadItem();
      reloadClaims();
      toast("Handover confirmed and report marked returned.");
    } catch (error) {
      toast(error.message, "error");
      return false;
    } finally {
      setReturning(false);
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
              : "Item illustration"}
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
                {item.type === "lost" && session && !own && (
                  <Button id="found-item-claim" disabled={submittedClaim?.itemId === Number(item.id.split("-")[1]) && submittedClaim?.finderId === Number(session.id)}
                    onClick={() => setModal("found-claim")}>
                    <Icon name="check" />
                    I Found This Item
                  </Button>
                )}
                {item.type === "found" && !own && (
                  <Button id="claim-item" onClick={() => open("claim")}>
                    <Icon name="check" />
                    Preview Demo Claim
                  </Button>
                )}
                {!own && (
                  <Button
                    variant={item.type === "lost" ? "primary" : "outline"}
                    id="contact-reporter"
                    onClick={() => open("contact")}
                  >
                    <Icon name="mail" />
                    Contact Reporter
                  </Button>
                )}
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
      {own && item.type === "lost" && (
        <section className="panel claim-review" aria-labelledby="claim-review-title">
          <div className="panel-title claim-review-title">
            <span className="claim-review-mark" aria-hidden="true">
              <Icon name="found" />
            </span>
            <div className="claim-review-copy">
              <h3 id="claim-review-title">Found-item claims</h3>
              <p>Review the finder’s details and arrange a safe handover.</p>
            </div>
            {claims !== null && (
              <span className="claim-review-count">
                {claims.length} {claims.length === 1 ? "claim" : "claims"}
              </span>
            )}
          </div>
          {claimsError ? (
            <p className="notice" role="alert">
              Could not load claims: {claimsError}{" "}
              <Button variant="outline" onClick={reloadClaims}>Retry</Button>
            </p>
          ) : claims === null ? (
            <p className="muted" role="status">Loading claims…</p>
          ) : claims.length ? (
            <div className="claim-list">
              {claims.map((claim) => (
                <article className={`claim-entry claim-entry-${claim.status.toLowerCase()}`} key={claim.claimId}>
                  <header className="claim-entry-header">
                    <span className="claim-finder-avatar" aria-hidden="true">
                      <Icon name="user" />
                    </span>
                    <div className="claim-finder-identity">
                      <h4>{claim.finderName}</h4>
                      <span>Student who found this item</span>
                    </div>
                    <span className={`claim-state claim-state-${claim.status.toLowerCase()}`}>
                      {claim.status}
                    </span>
                  </header>
                  {claim.finderRegistration && (
                    <p className="claim-registration">
                      Registration <strong>{claim.finderRegistration}</strong>
                    </p>
                  )}
                  <dl className="claim-facts">
                    <div><dt>Found at</dt><dd>{claim.foundLocation}</dd></div>
                    <div><dt>Submitted</dt><dd>{date(claim.createdAt)}</dd></div>
                  </dl>
                  <div className="claim-message">
                    <span>Finder’s note</span>
                    <p>{claim.message}</p>
                  </div>
                  {claim.decidedAt && (
                    <p className="claim-decision">
                      <Icon name="calendar" />
                      Decision recorded <time dateTime={claim.decidedAt}>{date(claim.decidedAt)}</time>
                    </p>
                  )}
                  {claim.status === "PENDING" && (
                    <div className="claim-entry-actions">
                      <Button disabled={busyClaim !== null} onClick={() => decideClaim(claim.claimId, "ACCEPTED")}>
                        <Icon name="check" />
                        {busyClaim === claim.claimId ? "Saving…" : "Accept claim"}
                      </Button>
                      <Button variant="outline" disabled={busyClaim !== null} onClick={() => decideClaim(claim.claimId, "REJECTED")}>
                        <Icon name="close" />
                        Reject claim
                      </Button>
                    </div>
                  )}
                  {claim.status === "ACCEPTED" && ["Open", "Resolved"].includes(item.status) && (
                    <div className="claim-entry-actions">
                      <Button
                        variant="outline"
                        disabled={returning}
                        onClick={() => setModal("confirm-return")}
                      >
                        <Icon name="check" />
                        Confirm handover and mark returned
                      </Button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <p className="muted">No claims have been submitted for this report.</p>
          )}
        </section>
      )}
      {modal === "contact" && (
        <ContactModal itemId={item.id} onClose={() => setModal(null)} />
      )}
      {modal === "confirm-return" && (
        <Modal
          title="Confirm the item was handed over?"
          confirmText={returning ? "Saving…" : "Confirm handover"}
          onClose={() => { if (!returning) setModal(null); }}
          onConfirm={confirmReturn}
        >
          <p>Only continue after you have physically received the item. This marks the lost report as returned and notifies the finder.</p>
        </Modal>
      )}
      {modal === "found-claim" && session && !own && item.type === "lost" && item.status === "Open" && (
        <FoundClaimModal key={item.id} item={item} onClose={() => setModal(null)} onSubmitted={setSubmittedClaim} />
      )}
      {modal === "claim" && (
        <Modal
          title="Is this your item?"
          confirmText="Submit demo claim"
          onClose={() => setModal(null)}
          onConfirm={async () => {
            await api.claimItem(item.id, proof);
            toast("Demo claim submitted. Track its status in Notifications.");
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
