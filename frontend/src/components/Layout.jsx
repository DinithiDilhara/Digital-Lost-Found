import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Brand, Button } from "./Common.jsx";
import Icon from "./Icon.jsx";
import { useApp } from "../context/AppContext.jsx";
import { useMobile } from "../hooks.js";
import { initials } from "../utils.js";

const nav = [
  ["dashboard", "Dashboard", "dashboard"],
  ["lost-items", "Lost Items", "lost"],
  ["found-items", "Found Items", "found"],
  ["report-item", "Report Item", "plus"],
  ["possible-matches", "Possible Matches", "match"],
  ["my-reports", "My Reports", "reports"],
  ["notifications", "Notifications", "bell"],
  ["profile", "Profile", "user"],
];

export function PublicHeader() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => setOpen(false), [location]);
  return (
    <header className="landing-header">
      <div className="container nav-container">
        <Brand />
        <button
          className="icon-button public-menu"
          aria-label="Toggle navigation"
          aria-expanded={open}
          aria-controls="public-nav"
          onClick={() => setOpen((value) => !value)}
        >
          <Icon name="menu" />
        </button>
        <nav
          id="public-nav"
          aria-label="Main navigation"
          className={open ? "is-open" : undefined}
          onClick={() => setOpen(false)}
        >
          <Link to="/index.html#home">Home</Link>
          <Link to="/index.html#how-it-works">How It Works</Link>
          <Link to="/index.html#recent-items">Recent Items</Link>
          <Link to="/index.html#about">About</Link>
          <Link className="login-link" to="/login.html">
            Login
          </Link>
          <Button to="/register.html" className="btn-small">
            Get Started <Icon name="arrow" />
          </Button>
        </nav>
      </div>
    </header>
  );
}
export function PublicFooter() {
  return (
    <footer className="landing-footer">
      <div className="container footer-main">
        <div>
          <Brand />
          <p>Real-Time Campus Lost &amp; Found System</p>
        </div>
        <nav aria-label="Footer navigation">
          <Link to="/index.html#home">Home</Link>
          <Link to="/index.html#how-it-works">How It Works</Link>
          <Link to="/lost-items.html">Lost Items</Link>
          <Link to="/found-items.html">Found Items</Link>
          <Link to="/index.html#about">About</Link>
          <Link to="/login.html">Login</Link>
        </nav>
      </div>
      <div className="container footer-bottom">
        <span>© 2026 DigitalLostFound. All rights reserved.</span>
        <span>A more connected campus starts with us.</span>
      </div>
    </footer>
  );
}
function AppFooter() {
  return (
    <footer className="app-footer">
      <span>© 2026 DigitalLostFound</span>
      <span>
        <span className="status-dot" />
        Frontend preview · Mock data
      </span>
    </footer>
  );
}
function Sidebar({ page, open, mobile, sidebarRef, onLogout }) {
  const { unread } = useApp();
  return (
    <aside
      className="sidebar"
      id="sidebar"
      ref={sidebarRef}
      inert={mobile && !open}
      onKeyDown={(event) => {
        if (event.key !== "Tab" || !mobile) return;
        const controls = sidebarRef.current.querySelectorAll("a,button");
        if (event.shiftKey && document.activeElement === controls[0]) {
          event.preventDefault();
          controls[controls.length - 1].focus();
        } else if (
          !event.shiftKey &&
          document.activeElement === controls[controls.length - 1]
        ) {
          event.preventDefault();
          controls[0].focus();
        }
      }}
    >
      <Brand small />
      <div className="workspace-label">YOUR WORKSPACE</div>
      <nav aria-label="Main application">
        {nav.map(([path, label, glyph]) => (
          <Link
            to={`/${path}.html`}
            className={`nav-link ${page === path ? "active" : ""}`}
            aria-current={page === path ? "page" : undefined}
            key={path}
          >
            <Icon name={glyph} />
            <span>{label}</span>
            {path === "notifications" && (
              <span className="nav-count" data-unread hidden={!unread}>
                {unread}
              </span>
            )}
          </Link>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="community-note">
          <Icon name="heart" />
          <strong>A little help. A big difference.</strong>
          <p>Thank you for looking out for your campus community.</p>
        </div>
        <button className="nav-link logout" data-logout onClick={onLogout}>
          <Icon name="logout" />
          Log out
        </button>
      </div>
    </aside>
  );
}
function AppHeader({ title, menuRef, open, setOpen, onLogout }) {
  const { user, unread } = useApp();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [dropdown, setDropdown] = useState(false);
  const menu = useRef(null);
  useEffect(() => {
    const click = (event) => {
      if (!menu.current?.contains(event.target)) setDropdown(false);
    };
    const escape = (event) => {
      if (event.key === "Escape") setDropdown(false);
    };
    document.addEventListener("click", click);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("click", click);
      document.removeEventListener("keydown", escape);
    };
  }, []);
  return (
    <header className="app-header">
      <button
        ref={menuRef}
        className="icon-button mobile-menu"
        aria-label="Open navigation"
        aria-expanded={open}
        aria-controls="sidebar"
        onClick={() => setOpen((value) => !value)}
      >
        <Icon name="menu" />
      </button>
      <h1>{title}</h1>
      <form
        className="global-search"
        action="search.html"
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          navigate(`/search.html?q=${encodeURIComponent(query)}`);
        }}
      >
        <label className="sr-only" htmlFor="global-query">
          Search lost and found items
        </label>
        <Icon name="search" />
        <input
          id="global-query"
          name="q"
          placeholder="Search lost and found items..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <button className="sr-only" type="submit">
          Search
        </button>
      </form>
      <Link
        className="mobile-search icon-button"
        to="/search.html"
        aria-label="Search all campus items"
      >
        <Icon name="search" />
      </Link>
      <Link
        className="notification-button icon-button"
        to="/notifications.html"
        aria-label={`Notifications, ${unread} unread`}
      >
        <Icon name="bell" />
        <span data-unread hidden={!unread}>
          {unread}
        </span>
      </Link>
      <div className="user-menu" ref={menu}>
        <button
          className="user-toggle"
          aria-expanded={dropdown}
          aria-controls="user-dropdown"
          onClick={() => setDropdown((value) => !value)}
        >
          <span className="avatar" data-avatar>
            {initials(user.name)}
          </span>
          <span className="user-name" data-user-name>
            {user.name}
          </span>
          <Icon name="chevron" />
        </button>
        <div className="user-dropdown" id="user-dropdown" hidden={!dropdown}>
          <Link to="/profile.html">
            <Icon name="user" />
            My profile
          </Link>
          <button data-logout onClick={onLogout}>
            <Icon name="logout" />
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
export function AppLayout({ page, title, children }) {
  const { user, logout, toast } = useApp();
  const navigate = useNavigate();
  const mobile = useMobile();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const sidebarRef = useRef(null);
  useLayoutEffect(() => {
    document.body.classList.add("app-body");
    return () => {
      document.body.classList.remove("app-body", "sidebar-open");
    };
  }, []);
  useEffect(() => {
    setOpen(false);
  }, [mobile]);
  useEffect(() => {
    document.body.classList.toggle("sidebar-open", open);
    if (open) sidebarRef.current?.querySelector("a")?.focus();
    const escape = (event) => {
      if (event.key === "Escape" && open) {
        setOpen(false);
        menuRef.current?.focus();
      }
    };
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("keydown", escape);
      document.body.classList.remove("sidebar-open");
    };
  }, [open]);
  const onLogout = async () => {
    try {
      await logout();
      navigate("/index.html");
    } catch (error) {
      toast(error.message, "error");
    }
  };
  if (!user) return null;
  return (
    <>
      <button
        className="sidebar-scrim"
        aria-label="Close navigation"
        hidden={!open}
        onClick={() => {
          setOpen(false);
          menuRef.current?.focus();
        }}
      />
      <Sidebar
        page={page}
        open={open}
        mobile={mobile}
        sidebarRef={sidebarRef}
        onLogout={onLogout}
      />
      <div className="app-frame">
        <AppHeader
          title={title}
          open={open}
          setOpen={setOpen}
          menuRef={menuRef}
          onLogout={onLogout}
        />
        <main className="app-main" id="main" tabIndex={-1}>
          {children}
        </main>
        <AppFooter />
      </div>
    </>
  );
}
