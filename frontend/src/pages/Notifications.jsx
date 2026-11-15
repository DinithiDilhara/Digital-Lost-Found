import { Link, useNavigate } from "react-router-dom";
import { Button, EmptyState } from "../components/Common.jsx";
import Icon from "../components/Icon.jsx";
import { useApp } from "../context/AppContext.jsx";
import { useLoad } from "../hooks.js";
import { api } from "../services/api.js";
import { date } from "../utils.js";

export default function Notifications() {
  const [notes, reload] = useLoad(() => api.getNotifications());
  const { toast, refreshUnread } = useApp();
  const navigate = useNavigate();
  if (!notes) return <p className="notice" role="status">Loading…</p>;
  const unread = notes.filter((note) => !note.read).length;
  const read = async (id, destination) => {
    try {
      if (id) await api.markNotificationRead(id);
      else await api.markAllNotificationsRead();
      await refreshUnread();
      if (destination) navigate(destination);
      else reload();
      if (!id) toast("All notifications marked as read.");
    } catch (error) {
      toast(error.message, "error");
    }
  };
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">STAY IN THE LOOP</span>
          <h2>
            Notifications{" "}
            {unread ? <span className="heading-count">{unread}</span> : null}
          </h2>
          <p>Your matches, claims, and campus updates, all in one place.</p>
        </div>
        <Button
          variant="outline"
          id="mark-all"
          disabled={!unread}
          onClick={() => read()}
        >
          <Icon name="check" />
          Mark All as Read
        </Button>
      </div>
      <section
        className="panel notification-list"
        aria-label="Your notifications"
      >
        {notes.length ? (
          notes.map((note) => (
            <article
              className={`notification-row ${!note.read ? "unread" : ""}`}
              key={note.id}
            >
              <span className={`notification-icon ${(note.type || "notification").toLowerCase()}`}>
                <Icon name={note.type === "CLAIM_SUBMITTED" ? "found" : "bell"} />
              </span>
              <div className="notification-copy">
                <h3>
                  {note.title}
                  {!note.read && (
                    <span className="unread-dot" aria-label="Unread" />
                  )}
                </h3>
                <p>{note.message}</p>
                <time dateTime={note.date}>
                  {date(note.date)} ·{" "}
                  {new Date(note.date).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </time>
                <div className="notification-actions">
                  {note.lostItemId && (
                    <Link
                      to={`/item-details.html?id=lost-${note.lostItemId}`}
                      className="text-link"
                      data-read-link={note.id}
                      onClick={(event) => {
                        event.preventDefault();
                        read(note.id, `/item-details.html?id=lost-${note.lostItemId}`);
                      }}
                    >
                      View item <Icon name="arrow" />
                    </Link>
                  )}
                  {!note.read ? (
                    <button
                      className="text-button"
                      data-read={note.id}
                      onClick={() => read(note.id)}
                    >
                      Mark as read
                    </button>
                  ) : (
                    <span className="read-label">Read</span>
                  )}
                </div>
              </div>
            </article>
          ))
        ) : (
          <EmptyState
            title="You’re all caught up"
            message="New updates about your reports will appear here."
          />
        )}
      </section>
    </>
  );
}
