import { useState } from "react";
import { Link } from "react-router-dom";
import { Badge, Button, EmptyState } from "../components/Common.jsx";
import Icon from "../components/Icon.jsx";
import Modal from "../components/Modal.jsx";
import { useApp } from "../context/AppContext.jsx";
import { useLoad } from "../hooks.js";
import { api } from "../services/api.js";
import { date, safeImage } from "../utils.js";

export default function MyReports() {
  const [reports, reload] = useLoad(() => api.getMyReports());
  const [active, setActive] = useState("all");
  const [modal, setModal] = useState(null);
  const { toast } = useApp();
  if (!reports) return null;
  const items = reports.filter(
    (item) =>
      active === "all" ||
      (active === "resolved" ? item.status !== "Open" : item.type === active),
  );
  const deleting = modal?.action === "delete";
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">YOUR CONTRIBUTIONS</span>
          <h2>My Reports</h2>
          <p>Manage your reports and keep track of happy reunions.</p>
        </div>
        <Button to="/report-item.html">
          <Icon name="plus" />
          New Report
        </Button>
      </div>
      <div className="report-tabs" aria-label="Filter your reports">
        {["all", "lost", "found", "resolved"].map((type) => (
          <button
            key={type}
            data-tab={type}
            className={type === active ? "active" : ""}
            aria-pressed={type === active}
            onClick={() => setActive(type)}
          >
            {type[0].toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>
      <div id="my-reports-list">
        {items.length ? (
          <div className="report-list">
            {items.map((item) => (
              <article className="panel report-row" key={item.id}>
                <Link
                  to={`/item-details.html?id=${item.id}`}
                  className="report-thumbnail"
                >
                  <img src={safeImage(item.image)} alt={item.name} />
                </Link>
                <div className="report-row-info">
                  <div className="detail-badges">
                    <Badge item={item} />
                    {item.status === "Open" && (
                      <span className="open-label">Open</span>
                    )}
                  </div>
                  <h3>
                    <Link to={`/item-details.html?id=${item.id}`}>
                      {item.name}
                    </Link>
                  </h3>
                  <p>
                    <Icon name="pin" />
                    {item.location}
                    <span>·</span>
                    {date(item.date)}
                  </p>
                </div>
                <div className="report-row-actions">
                  <Button
                    variant="outline"
                    className="btn-small"
                    to={`/item-details.html?id=${item.id}`}
                  >
                    View
                  </Button>
                  <Link
                    className="icon-button"
                    to={`/report-item.html?edit=${item.id}`}
                    aria-label={`Edit ${item.name}`}
                  >
                    <Icon name="edit" />
                  </Link>
                  <button
                    className="icon-button danger-text"
                    data-delete={item.id}
                    aria-label={`Delete ${item.name}`}
                    onClick={() => setModal({ action: "delete", id: item.id })}
                  >
                    <Icon name="trash" />
                  </button>
                  {item.status === "Open" && (
                    <button
                      className="text-button resolve-button"
                      data-resolve={item.id}
                      onClick={() =>
                        setModal({ action: "resolve", id: item.id })
                      }
                    >
                      <Icon name="check" />
                      Mark as {item.type === "found" ? "Returned" : "Resolved"}
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No reports here yet"
            message="Your lost and found reports will appear here."
          >
            <Button to="/report-item.html">Create a Report</Button>
          </EmptyState>
        )}
      </div>
      {modal && (
        <Modal
          title={deleting ? "Delete this report?" : "Another happy reunion?"}
          confirmText={deleting ? "Delete Report" : "Mark as resolved"}
          danger={deleting}
          onClose={() => setModal(null)}
          onConfirm={async () => {
            if (deleting) await api.deleteReport(modal.id);
            else await api.resolveReport(modal.id);
            reload();
            toast(
              deleting
                ? "Report deleted."
                : "Report resolved. Thanks for helping your community!",
            );
          }}
        >
          <p>
            {deleting
              ? "Are you sure you want to delete this report? This will remove it from your reports and campus listings in this browser."
              : "Mark this item as returned or resolved? It will remain in your report history and no longer accept claims."}
          </p>
        </Modal>
      )}
    </>
  );
}
