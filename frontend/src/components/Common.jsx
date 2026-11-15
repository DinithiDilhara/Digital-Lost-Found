import { Link } from "react-router-dom";
import Icon from "./Icon.jsx";
import { date, safeImage } from "../utils.js";

export function Button({
  to,
  variant = "primary",
  className = "",
  children,
  ...props
}) {
  const classes = `btn btn-${variant}${className ? ` ${className}` : ""}`;
  return to ? (
    <Link to={to} className={classes} {...props}>
      {children}
    </Link>
  ) : (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
export function Brand({ small = false }) {
  return (
    <Link
      className={`brand ${small ? "brand-small" : ""}`}
      to="/index.html"
      aria-label="DigitalLostFound home"
    >
      <span className="brand-mark">
        <Icon name="pin" />
      </span>
      <span>
        Digital<span className="brand-light">LostFound</span>
        {small && <small>CAMPUS COMMUNITY</small>}
      </span>
    </Link>
  );
}
export function Badge({ item }) {
  return (
    <>
      <span className={`badge ${item.type}`}>
        <span />
        {item.type}
      </span>
      {item.status !== "Open" && (
        <span className="badge resolved">{item.status}</span>
      )}
    </>
  );
}
export function ItemCard({ item, full = false }) {
  const href = `/item-details.html?id=${item.id}`;
  return (
    <article className="item-card">
      <Link
        className={`item-picture ${item.category.toLowerCase().replace(/ /g, "-")}`}
        to={href}
        tabIndex={-1}
        aria-hidden="true"
      >
        <img src={safeImage(item.image)} alt="" loading="lazy" />
        <div className="card-badges">
          <Badge item={item} />
        </div>
      </Link>
      <div className="item-body">
        <span className="sr-only">
          {item.type} item. Status: {item.status}.
        </span>
        <div className="item-category">
          {item.category}
          {full && (
            <>
              {" "}
              <span>· {item.color || "Not specified"}</span>
            </>
          )}
        </div>
        <h3>
          <Link to={href}>{item.name}</Link>
        </h3>
        <p className="item-meta">
          <Icon name="pin" />
          {item.location}
        </p>
        <p className="item-meta">
          <Icon name="calendar" />
          {date(item.date)}
        </p>
        {full && <p className="item-description">{item.description}</p>}
        <Link className="card-link" to={href}>
          View Details <Icon name="arrow" />
        </Link>
      </div>
    </article>
  );
}
export function EmptyState({ title, message, children }) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Icon name="search" />
      </span>
      <h3>{title}</h3>
      <p>{message}</p>
      {children}
    </div>
  );
}
export function Notice({ children, icon = "info", className = "" }) {
  return (
    <div className={`notice${className ? ` ${className}` : ""}`}>
      <Icon name={icon} />
      {children}
    </div>
  );
}
