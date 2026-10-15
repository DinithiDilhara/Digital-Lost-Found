import { Link } from "react-router-dom";
import { Button, ItemCard } from "../components/Common.jsx";
import Icon from "../components/Icon.jsx";
import { useLoad } from "../hooks.js";
import { api } from "../services/api.js";
import { date } from "../utils.js";

export default function Dashboard() {
  const [result] = useLoad(() =>
    Promise.all([
      api.getUser(),
      api.getItems(),
      api.getMyReports(),
      api.getNotifications(),
    ]),
  );
  if (!result) return null;
  const [user, items, reports, notes] = result;
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const lost = items.filter(
    (item) => item.type === "lost" && item.status === "Open",
  ).length;
  const found = items.filter(
    (item) => item.type === "found" && item.status === "Open",
  ).length;
  const returned = items.filter((item) => item.status !== "Open").length;
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">YOUR CAMPUS AT A GLANCE</span>
          <h2>
            {greeting}, {user.name.split(" ")[0]}!{" "}
            <span className="greeting-sun">✦</span>
          </h2>
          <p>Here’s what’s happening around campus.</p>
        </div>
        <span className="date-chip">
          <Icon name="calendar" />
          {new Date().toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      </div>
      <div className="dashboard-stats">
        {[
          ["lost", "Lost Items", lost, "lost-items"],
          ["found", "Found Items", found, "found-items"],
          ["check", "Items Returned", returned, "search"],
          ["reports", "My Reports", reports.length, "my-reports"],
        ].map(([glyph, label, value, href]) => (
          <Link
            key={glyph}
            className={`stat-card ${glyph}`}
            to={`/${href}.html${glyph === "check" ? "?resolved=1" : ""}`}
          >
            <div>
              <span>{label}</span>
              <strong>{value}</strong>
              <small>
                {glyph === "reports"
                  ? "Your campus contributions"
                  : glyph === "check"
                    ? "Back where they belong"
                    : "Open campus reports"}
              </small>
            </div>
            <span className="stat-icon">
              <Icon name={glyph} />
            </span>
          </Link>
        ))}
      </div>
      <section className="dashboard-banner">
        <div>
          <span className="eyebrow">LET’S BRING IT HOME</span>
          <h3>Missing something? Found something?</h3>
          <p>Your next report could make someone’s day.</p>
        </div>
        <div className="button-row">
          <Button to="/report-item.html?type=lost">
            <Icon name="plus" />
            Report Lost Item
          </Button>
          <Button to="/report-item.html?type=found" variant="outline">
            <Icon name="plus" />
            Report Found Item
          </Button>
        </div>
      </section>
      <div className="dashboard-columns">
        <section>
          <div className="content-heading">
            <h3>
              Recent Reports{" "}
              <span className="subtle-count">{items.length}</span>
            </h3>
            <Link className="text-link" to="/search.html">
              View all <Icon name="arrow" />
            </Link>
          </div>
          <div className="items-grid dashboard-items">
            {items.slice(0, 6).map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </section>
        <aside>
          <section className="panel activity-panel">
            <div className="content-heading">
              <h3>Recent Activity</h3>
              <span className="status-dot" />
            </div>
            {notes.length ? (
              notes.slice(0, 4).map((note) => (
                <Link
                  key={note.id}
                  className="activity-entry"
                  to="/notifications.html"
                >
                  <span className="activity-icon">
                    <Icon name={note.icon} />
                  </span>
                  <div>
                    <strong>{note.title}</strong>
                    <p>{note.message}</p>
                    <small>{date(note.date)}</small>
                  </div>
                </Link>
              ))
            ) : (
              <p className="muted">
                Your updates will appear here as you use the app.
              </p>
            )}
            <Link className="text-link activity-all" to="/notifications.html">
              All notifications <Icon name="arrow" />
            </Link>
          </section>
          <section className="help-card">
            <Icon name="shield" />
            <h3>A safer way to reconnect</h3>
            <p>
              Ask for a detail only the owner would know, and arrange handovers
              in a public campus location.
            </p>
            <Link className="text-link" to="/found-items.html">
              Help someone find their item <Icon name="arrow" />
            </Link>
          </section>
        </aside>
      </div>
    </>
  );
}
