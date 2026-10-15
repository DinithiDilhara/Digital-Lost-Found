import { Component, useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useApp } from "./context/AppContext.jsx";
import { AppLayout, PublicHeader } from "./components/Layout.jsx";
import { Button, EmptyState } from "./components/Common.jsx";
import Home from "./pages/Home.jsx";
import Auth from "./pages/Auth.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Items from "./pages/Items.jsx";
import ItemDetails from "./pages/ItemDetails.jsx";
import ReportItem from "./pages/ReportItem.jsx";
import Matches from "./pages/Matches.jsx";
import MyReports from "./pages/MyReports.jsx";
import Notifications from "./pages/Notifications.jsx";
import Profile from "./pages/Profile.jsx";

const titles = {
  index: "Home",
  login: "Login",
  register: "Create Account",
  dashboard: "Dashboard",
  "lost-items": "Lost Items",
  "found-items": "Found Items",
  "report-item": "Report Item",
  "item-details": "Item Details",
  "possible-matches": "Possible Matches",
  "my-reports": "My Reports",
  notifications: "Notifications",
  profile: "Profile",
  search: "Search",
};

function Page({ name, children, isPublic = false }) {
  const { session } = useApp();
  useEffect(() => {
    document.title = `${titles[name]} · DigitalLostFound`;
    document.body.dataset.page = name;
  }, [name]);
  if (!isPublic && !session) return <Navigate to="/login.html" replace />;
  if (name === "item-details" && !session)
    return (
      <>
        <PublicHeader />
        <main id="main" className="container public-details">
          {children}
        </main>
      </>
    );
  if (["index", "login", "register"].includes(name)) return children;
  return (
    <AppLayout
      page={name}
      title={
        name === "dashboard"
          ? "Overview"
          : name === "profile"
            ? "My Profile"
            : titles[name]
      }
    >
      {children}
    </AppLayout>
  );
}

class PageError extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error) {
    console.error(error);
  }
  render() {
    return this.state.error ? (
      <main className="container public-details">
        <EmptyState
          title="Something went wrong"
          message={this.state.error.message}
        >
          <Button to="/index.html">Back to Home</Button>
        </EmptyState>
      </main>
    ) : (
      this.props.children
    );
  }
}

function ScrollPosition() {
  const location = useLocation();
  useEffect(() => {
    if (!location.hash) {
      window.scrollTo({ top: 0, behavior: "instant" });
      return;
    }
    const scroll = () => {
      const target = document.getElementById(location.hash.slice(1));
      if (target) {
        target.scrollIntoView();
        return true;
      }
      return false;
    };
    if (scroll()) return;
    const observer = new MutationObserver(() => {
      if (scroll()) observer.disconnect();
    });
    observer.observe(document.getElementById("app"), {
      childList: true,
      subtree: true,
    });
    return () => observer.disconnect();
  }, [location.pathname, location.search, location.hash]);
  return null;
}

export default function App() {
  const location = useLocation();
  // .html route aliases preserve existing bookmarks, query strings and links.
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to main content
      </a>
      <ScrollPosition />
      <PageError key={`${location.pathname}${location.search}`}>
        <Routes>
          <Route
            path="/"
            element={
              <Page name="index" isPublic>
                <Home />
              </Page>
            }
          />
          <Route
            path="/index.html"
            element={
              <Page name="index" isPublic>
                <Home />
              </Page>
            }
          />
          <Route
            path="/login.html"
            element={
              <Page name="login" isPublic>
                <Auth />
              </Page>
            }
          />
          <Route
            path="/register.html"
            element={
              <Page name="register" isPublic>
                <Auth register />
              </Page>
            }
          />
          <Route
            path="/dashboard.html"
            element={
              <Page name="dashboard">
                <Dashboard />
              </Page>
            }
          />
          <Route
            path="/lost-items.html"
            element={
              <Page name="lost-items">
                <Items type="lost" />
              </Page>
            }
          />
          <Route
            path="/found-items.html"
            element={
              <Page name="found-items">
                <Items type="found" />
              </Page>
            }
          />
          <Route
            path="/search.html"
            element={
              <Page name="search">
                <Items />
              </Page>
            }
          />
          <Route
            path="/report-item.html"
            element={
              <Page name="report-item">
                <ReportItem />
              </Page>
            }
          />
          <Route
            path="/item-details.html"
            element={
              <Page name="item-details" isPublic>
                <ItemDetails />
              </Page>
            }
          />
          <Route
            path="/possible-matches.html"
            element={
              <Page name="possible-matches">
                <Matches />
              </Page>
            }
          />
          <Route
            path="/my-reports.html"
            element={
              <Page name="my-reports">
                <MyReports />
              </Page>
            }
          />
          <Route
            path="/notifications.html"
            element={
              <Page name="notifications">
                <Notifications />
              </Page>
            }
          />
          <Route
            path="/profile.html"
            element={
              <Page name="profile">
                <Profile />
              </Page>
            }
          />
          <Route path="*" element={<Navigate to="/index.html" replace />} />
        </Routes>
      </PageError>
    </>
  );
}
