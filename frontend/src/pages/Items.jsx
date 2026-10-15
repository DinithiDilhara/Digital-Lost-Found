import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button, EmptyState, ItemCard } from "../components/Common.jsx";
import { Field } from "../components/Forms.jsx";
import Icon from "../components/Icon.jsx";
import { api } from "../services/api.js";
import { data } from "../services/data.js";
import { useLoad } from "../hooks.js";

export default function Items({ type = "" }) {
  const [params] = useSearchParams();
  const emptyFilters = {
    query: "",
    category: "",
    location: "",
    date: "",
    status: "",
    type: "",
  };
  const [filters, setFilters] = useState({
    ...emptyFilters,
    query: params.get("q") || "",
  });
  const [resolved, setResolved] = useState(!!params.get("resolved"));
  const [items] = useLoad(() => api.getItems());
  if (!items) return null;
  const title =
    type === "lost"
      ? "Lost Items"
      : type === "found"
        ? "Found Items"
        : "Search Campus Items";
  const locations = [
    ...new Set([...data.locations, ...items.map((item) => item.location)]),
  ].sort();
  let result = api.filterItems(items, {
    ...filters,
    type: type || filters.type,
  });
  if (resolved && !filters.status)
    result = result.filter((item) => item.status !== "Open");
  const change = (event) =>
    setFilters((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">LET’S RECONNECT</span>
          <h2>{title}</h2>
          <p>
            {type
              ? `Browse items recently reported as ${type} on campus.`
              : "Look for a name, category, color, location, or lost/found status."}
          </p>
        </div>
        <Button to={`/report-item.html${type ? `?type=${type}` : ""}`}>
          <Icon name="plus" />
          Report {type ? `${type[0].toUpperCase()}${type.slice(1)}` : "an"} Item
        </Button>
      </div>
      <section className="panel filter-panel" aria-label="Search and filters">
        <form
          id="filter-form"
          onSubmit={(event) => event.preventDefault()}
          onReset={(event) => {
            event.preventDefault();
            setFilters(emptyFilters);
            setResolved(false);
          }}
        >
          <div className="list-search">
            <Icon name="search" />
            <label className="sr-only" htmlFor="item-search">
              Search {type || "all"} items
            </label>
            <input
              type="search"
              id="item-search"
              name="query"
              placeholder={`Search ${type || "all"} items...`}
              value={filters.query}
              onChange={change}
            />
          </div>
          <div className="filter-row">
            <Field
              label="Category"
              name="category"
              as="select"
              value={filters.category}
              onChange={change}
            >
              <option value="">All categories</option>
              {data.categories.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </Field>
            <Field
              label="Location"
              name="location"
              as="select"
              value={filters.location}
              onChange={change}
            >
              <option value="">All locations</option>
              {locations.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </Field>
            <Field
              label={`Date ${type || "reported"}`}
              name="date"
              type="date"
              value={filters.date}
              onChange={change}
            />
            <Field
              label="Status"
              name="status"
              as="select"
              value={filters.status}
              onChange={change}
            >
              <option value="">All statuses</option>
              <option>Open</option>
              <option>Returned</option>
              <option>Resolved</option>
            </Field>
            {!type && (
              <Field
                label="Report type"
                name="type"
                as="select"
                value={filters.type}
                onChange={change}
              >
                <option value="">Lost &amp; found</option>
                <option value="lost">Lost</option>
                <option value="found">Found</option>
              </Field>
            )}
            <button className="text-button clear-filters" type="reset">
              Clear filters
            </button>
          </div>
        </form>
      </section>
      <div className="results-heading">
        <span id="result-count" role="status" aria-live="polite">
          {result.length} {result.length === 1 ? "item" : "items"} found
        </span>
        <span>
          <Icon name="filter" />
          Campus reports
        </span>
      </div>
      <div className="items-grid browse-grid" id="items-grid">
        {result.length ? (
          result.map((item) => <ItemCard key={item.id} item={item} full />)
        ) : (
          <EmptyState
            title="No items found"
            message="Try another keyword or clear a filter to broaden your search."
          />
        )}
      </div>
    </>
  );
}
