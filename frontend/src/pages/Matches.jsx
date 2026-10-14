import { useState } from "react";
import { Button, EmptyState, Notice } from "../components/Common.jsx";
import Icon from "../components/Icon.jsx";
import ContactModal from "../components/ContactModal.jsx";
import { useApp } from "../context/AppContext.jsx";
import { useLoad } from "../hooks.js";
import { api } from "../services/api.js";
import { date, safeImage } from "../utils.js";

export default function Matches() {
  const [matches, reload] = useLoad(() => api.getMatches());
  const [contact, setContact] = useState(null);
  const { toast } = useApp();
  if (!matches) return null;
  const dismiss = async (id) => {
    try {
      await api.dismissMatch(id);
      reload();
      toast("Match dismissed.");
    } catch (error) {
      toast(error.message, "error");
    }
  };
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">A STEP CLOSER TO HOME</span>
          <h2>Possible Matches</h2>
          <p>These found items might be what you’re looking for.</p>
        </div>
        <span className="date-chip">
          <Icon name="match" />
          {matches.length} possible {matches.length === 1 ? "match" : "matches"}
        </span>
      </div>
      <Notice className="matches-notice">
        These are sample matches for your reports. Compare the details before
        contacting the reporter.
      </Notice>
      <div className="matches-list">
        {matches.length ? (
          matches.map((match) => (
            <article className="panel match-panel" key={match.id}>
              <div className="match-heading">
                <span className="match-label">
                  <Icon name="match" />
                  Worth a closer look
                </span>
                <span className="muted">Sample match</span>
              </div>
              <div className="match-pair">
                {[
                  [match.lost, "YOUR LOST ITEM"],
                  [match.found, "POSSIBLE FOUND ITEM"],
                ].map(([item, label]) => (
                  <div className="match-item" key={label}>
                    <span className="eyebrow">{label}</span>
                    <div>
                      <img src={safeImage(item.image)} alt={item.name} />
                      <div>
                        <h3>{item.name}</h3>
                        <p>{item.color}</p>
                        <p className="item-meta">
                          <Icon name="pin" />
                          {item.location}
                        </p>
                        <small>{date(item.date)}</small>
                      </div>
                    </div>
                  </div>
                ))}
                <span className="match-connector">
                  <Icon name="match" />
                </span>
              </div>
              <div className="match-reasons">
                <span>
                  <Icon name="check" />
                  Similar Item Name
                </span>
                <span>
                  <Icon name="check" />
                  Same Color
                </span>
                <span>
                  <Icon name="check" />
                  Nearby Location
                </span>
              </div>
              <div className="match-actions">
                <Button to={`/item-details.html?id=${match.found.id}`}>
                  View Found Item <Icon name="arrow" />
                </Button>
                <Button
                  variant="outline"
                  data-contact={match.found.id}
                  onClick={() => setContact(match.found.id)}
                >
                  Contact Reporter
                </Button>
                <button
                  className="text-button"
                  data-dismiss={match.id}
                  onClick={() => dismiss(match.id)}
                >
                  Not My Item
                </button>
              </div>
            </article>
          ))
        ) : (
          <EmptyState
            title="No possible matches right now"
            message="Browse found items or add a report. The demo has preset matches for the sample user."
          >
            <Button to="/found-items.html">Browse Found Items</Button>
          </EmptyState>
        )}
      </div>
      {contact !== null && (
        <ContactModal itemId={contact} onClose={() => setContact(null)} />
      )}
    </>
  );
}
