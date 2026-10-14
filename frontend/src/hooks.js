import { useEffect, useState } from "react";

// Ignore late responses when navigation replaces a page.
export function useLoad(loader, dependencies = []) {
  const [state, setState] = useState({ value: null, error: null });
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    Promise.resolve()
      .then(loader)
      .then(
        (value) => {
          if (active) setState({ value, error: null });
        },
        (error) => {
          if (active) setState({ value: null, error });
        },
      );
    return () => {
      active = false;
    };
  }, [...dependencies, revision]);
  if (state.error) throw state.error;
  return [state.value, () => setRevision((value) => value + 1)];
}

export function useMobile() {
  const [mobile, setMobile] = useState(
    () => window.matchMedia("(max-width: 780px)").matches,
  );
  useEffect(() => {
    const query = window.matchMedia("(max-width: 780px)");
    const update = () => setMobile(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return mobile;
}
