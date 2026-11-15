import { Link } from "react-router-dom";
import { Button, EmptyState } from "../components/Common.jsx";
import Icon from "../components/Icon.jsx";
import { useLoad } from "../hooks.js";
import { api } from "../services/api.js";
import { date } from "../utils.js";
import "./claims.css";

export default function MyClaims() {
  const [claims] = useLoad(() => api.getMyClaims(), [], true);
  if (!claims) return <p className="notice" role="status">Loading your claims…</p>;
  const completedClaims = claims.filter(
    (claim) => claim.status === "ACCEPTED" && claim.itemStatus === "RETURNED",
  ).length;
  const activeClaims = claims.filter(
    (claim) => claim.status === "ACCEPTED" && claim.itemStatus !== "RETURNED",
  ).length;
  const pendingClaims = claims.filter((claim) => claim.status === "PENDING").length;
  const declinedClaims = claims.filter((claim) => claim.status === "REJECTED").length;
  const summaries = [
    { label: "Awaiting review", value: pendingClaims, tone: "pending" },
    { label: "In progress", value: activeClaims, tone: "active" },
    { label: "Completed", value: completedClaims, tone: "completed" },
    { label: "Declined", value: declinedClaims, tone: "declined" },
  ];

  return (
    <div className="claims-page">
      <section className="claims-overview panel">
        <div className="claims-overview-copy">
          <span className="eyebrow">YOUR FOUND-ITEM CLAIMS</span>
          <h2>My Claims</h2>
          <p>Follow each claim from submission through the final handover.</p>
        </div>
        <div className="claims-overview-mark" aria-hidden="true">
          <Icon name="found" />
        </div>
      </section>

      <section className="claim-summary-grid" aria-label="Claim status summary">
        {summaries.map((summary) => (
          <div className={`claim-summary-card claim-summary-${summary.tone}`} key={summary.label}>
            <span>{summary.label}</span>
            <strong>{summary.value}</strong>
          </div>
        ))}
      </section>

      {claims.length ? (
        <div className="claim-card-list">
          {claims.map((claim) => {
            const completed = claim.status === "ACCEPTED" && claim.itemStatus === "RETURNED";
            const statusClass = completed ? "returned" : claim.status.toLowerCase();
            const decisionState = claim.status === "PENDING"
              ? "current"
              : claim.status === "REJECTED"
                ? "declined"
                : "complete";
            const handoverState = completed
              ? "complete"
              : claim.status === "ACCEPTED"
                ? "current"
                : claim.status === "REJECTED"
                  ? "skipped"
                  : "upcoming";
            const progress = [
              {
                title: "Claim submitted",
                detail: `Sent ${date(claim.createdAt)}`,
                state: "complete",
              },
              {
                title: "Owner review",
                detail: claim.status === "PENDING"
                  ? "Waiting for a decision"
                  : claim.status === "REJECTED"
                    ? "Claim declined"
                    : "Claim accepted",
                state: decisionState,
              },
              {
                title: "Item handover",
                detail: completed
                  ? "Return confirmed"
                  : claim.status === "ACCEPTED"
                    ? "Waiting for confirmation"
                    : claim.status === "REJECTED"
                      ? "Not needed"
                      : "After approval",
                state: handoverState,
              },
            ];
            return (
              <article className={`claim-card panel claim-card-${statusClass}`} key={claim.claimId}>
                <header className="claim-card-header">
                  <div className="claim-item-icon" aria-hidden="true">
                    <Icon name="found" />
                  </div>
                  <div className="claim-card-type">
                    <span>FOUND-ITEM CLAIM</span>
                    <small>Claim #{claim.claimId}</small>
                  </div>
                  <span className={`claim-state claim-state-${statusClass}`}>
                    {completed ? "RETURNED" : claim.status}
                  </span>
                </header>

                <div className="claim-card-body">
                  <h3>
                    <Link to={`/item-details.html?id=lost-${claim.itemId}`}>
                      {claim.itemTitle}
                    </Link>
                  </h3>
                  <div className="claim-card-details">
                    <span><Icon name="user" /> Owner: {claim.ownerName}</span>
                    <span><Icon name="pin" /> Found at: {claim.foundLocation}</span>
                    <span>
                      <Icon name="calendar" />
                      Submitted <time dateTime={claim.createdAt}>{date(claim.createdAt)}</time>
                    </span>
                  </div>
                </div>

                <ol className="claim-progress" aria-label={`Progress for ${claim.itemTitle}`}>
                  {progress.map((step, index) => (
                    <li className={`claim-step claim-step-${step.state}`} key={step.title}>
                      <span className="claim-step-marker">
                        {step.state === "complete" ? (
                          <Icon name="check" />
                        ) : step.state === "declined" ? (
                          <Icon name="close" />
                        ) : (
                          `0${index + 1}`
                        )}
                      </span>
                      <span className="claim-step-copy">
                        <strong>{step.title}</strong>
                        <small>{step.detail}</small>
                      </span>
                    </li>
                  ))}
                </ol>

                <footer className="claim-card-footer">
                  <p className={`claim-footer-note claim-footer-${statusClass}`}>
                    {completed
                      ? <>The owner confirmed receiving the item{claim.returnedAt ? ` · ${date(claim.returnedAt)}` : ""}. This claim is complete.</>
                      : claim.status === "ACCEPTED"
                        ? "The owner will confirm the handover after receiving the item."
                        : claim.status === "REJECTED"
                          ? <>The owner declined this claim{claim.decidedAt ? ` · ${date(claim.decidedAt)}` : ""}. No further action is needed.</>
                          : "We’ll let you know when the owner reviews your claim."}
                  </p>
                  <div className="claim-card-actions">
                    <Button
                      variant="outline"
                      className="btn-small"
                      to={`/item-details.html?id=lost-${claim.itemId}`}
                    >
                      View item <Icon name="arrow" />
                    </Button>
                    {claim.status !== "PENDING" && (
                      <Link className="text-link" to="/notifications.html">
                        Notifications <Icon name="arrow" />
                      </Link>
                    )}
                  </div>
                </footer>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No claims yet"
          message="Found-item claims you submit for lost reports will appear here."
        >
          <Button to="/lost-items.html">Browse lost items <Icon name="arrow" /></Button>
        </EmptyState>
      )}
    </div>
  );
}
