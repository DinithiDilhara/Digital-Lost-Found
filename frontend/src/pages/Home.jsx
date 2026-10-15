import { useState } from "react";
import { Link } from "react-router-dom";
import { PublicHeader, PublicFooter } from "../components/Layout.jsx";
import { ItemCard, Button } from "../components/Common.jsx";
import Icon from "../components/Icon.jsx";
import { api } from "../services/api.js";
import { useLoad } from "../hooks.js";

export default function Home() {
  const [items] = useLoad(() => api.getItems());
  const [tab, setTab] = useState("all");
  if (!items) return null;
  return (
    <>
      <PublicHeader />
      <main id="main">
        <section className="hero" id="home">
          <div className="container hero-grid">
            <div className="hero-copy">
              <div className="eyebrow">
                <span className="status-dot" />
                YOUR CAMPUS. YOUR COMMUNITY.
              </div>
              <h1>
                Lost Something
                <br />
                on Campus?
                <br />
                <span>
                  Let’s Help You
                  <br className="hero-break" /> Find It.
                </span>
              </h1>
              <p>
                DigitalLostFound connects students across campus to report,
                search and recover lost belongings quickly and securely.
              </p>
              <div className="hero-actions">
                <Button to="/login.html">
                  <Icon name="search" />
                  Report Lost Item
                </Button>
                <Button to="/login.html" variant="outline">
                  <Icon name="found" />
                  Report Found Item
                </Button>
              </div>
              <div className="hero-social">
                <div className="avatar-stack">
                  <span>NL</span>
                  <span>AK</span>
                  <span>SM</span>
                  <span>RJ</span>
                </div>
                <div>
                  <strong>A campus that looks out for you.</strong>
                  <small>Find your things. Help someone find theirs.</small>
                </div>
              </div>
            </div>
            <div
              className="hero-visual"
              aria-label="Illustration of lost and found belongings connected across campus"
            >
              <div className="visual-grid" />
              <div className="orbit orbit-one" />
              <div className="orbit orbit-two" />
              <div className="campus-marker">
                <Icon name="campus" />
                <span>YOUR CAMPUS</span>
              </div>
              <div className="floating-item floating-bag">
                <span className="badge lost">
                  <span />
                  LOST
                </span>
                <img src="assets/images/backpack.svg" alt="Black backpack" />
                <strong>Black Backpack</strong>
                <small>
                  <Icon name="pin" />
                  Computer Laboratory
                </small>
              </div>
              <div className="floating-item floating-bottle">
                <span className="badge found">
                  <span />
                  FOUND
                </span>
                <img src="assets/images/bottle.svg" alt="Blue water bottle" />
                <strong>Blue Water Bottle</strong>
                <small>
                  <Icon name="pin" />
                  EIE Department
                </small>
              </div>
              <div className="reunion-note">
                <span className="reunion-icon">
                  <Icon name="check" />
                </span>
                <div>
                  <strong>A little lost. A little found.</strong>
                  <small>One connected community.</small>
                </div>
              </div>
              <div className="map-pin pin-one">
                <Icon name="pin" />
              </div>
              <div className="map-pin pin-two">
                <Icon name="pin" />
              </div>
              <span className="visual-spark spark-one">+</span>
              <span className="visual-spark spark-two">+</span>
            </div>
          </div>
          <div className="container hero-bottom">
            <span>
              <Icon name="shield" />
              Student-first &amp; privacy-minded
            </span>
            <span>
              <Icon name="campus" />
              Made for life on campus
            </span>
            <span>
              <Icon name="heart" />
              Small acts. Meaningful reunions.
            </span>
          </div>
        </section>
        <section className="section" id="how-it-works">
          <div className="container">
            <div className="section-heading centered">
              <span className="eyebrow">FROM LOST TO FOUND</span>
              <h2>How It Works</h2>
              <p>Three simple steps. One less thing to worry about.</p>
            </div>
            <div className="steps-grid">
              {[
                [
                  "reports",
                  "Report",
                  "Report an item you have lost or found on campus.",
                ],
                [
                  "search",
                  "Search & Match",
                  "Search campus reports and discover possible matches.",
                ],
                [
                  "heart",
                  "Reconnect",
                  "Connect with the reporter and safely recover your item.",
                ],
              ].map(([glyph, title, text], index) => (
                <article className="step-card" key={title}>
                  <span className="step-number">0{index + 1}</span>
                  <div className="step-icon">
                    <Icon name={glyph} />
                  </div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section className="section recent-section" id="recent-items">
          <div className="container">
            <div className="section-heading split-heading">
              <div>
                <span className="eyebrow">AROUND CAMPUS</span>
                <h2>Recent Lost &amp; Found</h2>
                <p>Your missing item might be closer than you think.</p>
              </div>
              <Link to="/login.html" className="text-link">
                Explore all items <Icon name="arrow" />
              </Link>
            </div>
            <div className="landing-tabs" aria-label="Filter recent items">
              {[
                ["all", "All items"],
                ["lost", "Lost items"],
                ["found", "Found items"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  className={value === tab ? "active" : undefined}
                  data-recent={value}
                  aria-pressed={value === tab}
                  onClick={() => setTab(value)}
                >
                  {label}
                </button>
              ))}
              <span>
                <span className="status-dot" />
                Sample campus reports
              </span>
            </div>
            <div className="items-grid" id="recent-grid">
              {items
                .filter((item) => tab === "all" || item.type === tab)
                .slice(0, 6)
                .map((item) => (
                  <ItemCard key={item.id} item={item} />
                ))}
            </div>
          </div>
        </section>
        <section className="section">
          <div className="container">
            <div className="section-heading centered">
              <span className="eyebrow">BUILT AROUND YOU</span>
              <h2>Everything You Need to Find What Matters</h2>
              <p>A simpler way to keep your campus connected.</p>
            </div>
            <div className="features-grid">
              {[
                [
                  "search",
                  "Smart Search",
                  "Search by item name, category, color and campus location.",
                ],
                [
                  "bell",
                  "Real-Time Updates",
                  "Receive notifications when possible matching items are reported.",
                ],
                [
                  "shield",
                  "Secure Claims",
                  "Help make sure found items are returned to the correct owner.",
                ],
                [
                  "campus",
                  "Campus Focused",
                  "Designed specifically for university students.",
                ],
              ].map(([glyph, title, text]) => (
                <article className="feature-card" key={title}>
                  <span className="feature-icon">
                    <Icon name={glyph} />
                  </span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              ))}
            </div>
            <p className="prototype-caption">
              Frontend preview: notifications and claims are simulated locally.
              Live updates will arrive with the backend.
            </p>
          </div>
        </section>
        <section className="statistics">
          <div className="container stats-row">
            {[
              ["120+", "Items Reported"],
              ["75+", "Items Found"],
              ["60+", "Items Returned"],
              ["500+", "Students Connected"],
            ].map(([number, label]) => (
              <div key={label}>
                <strong>{number}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
          <p>Illustrative community statistics</p>
        </section>
        <section className="section" id="about">
          <div className="container about-grid">
            <div>
              <span className="eyebrow">GOOD PEOPLE. FOUND THINGS.</span>
              <h2>About DigitalLostFound</h2>
            </div>
            <div>
              <p>
                DigitalLostFound is a real-time campus lost and found platform
                designed to help university students quickly report, search and
                recover lost belongings through a connected campus community.
              </p>
              <span className="about-signoff">
                Made for students, with community at heart.{" "}
                <Icon name="heart" />
              </span>
            </div>
          </div>
        </section>
        <section className="container">
          <div className="cta">
            <div>
              <span className="eyebrow">LET’S BRING IT BACK HOME</span>
              <h2>Ready to Find What You’ve Lost?</h2>
              <p>
                Join your campus community and make lost belongings easier to
                recover.
              </p>
            </div>
            <div className="cta-actions">
              <Button to="/register.html" variant="white">
                Get Started <Icon name="arrow" />
              </Button>
              <Button to="/login.html" variant="dark-outline">
                Login
              </Button>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
