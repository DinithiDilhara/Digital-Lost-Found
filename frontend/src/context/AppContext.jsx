import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { api } from "../services/api.js";
import Icon from "../components/Icon.jsx";

const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

export function AppProvider({ children }) {
  const [session, setSession] = useState(() => api.getSession());
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [unread, setUnread] = useState(0);
  const [messagesUnread, setMessagesUnread] = useState(0);
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Set());
  const nextId = useRef(0);
  const toast = useCallback((message, type = "success") => {
    const id = ++nextId.current;
    setToasts((current) => [...current, { id, message, type }]);
    const timer = setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
      timers.current.delete(timer);
    }, 6500);
    timers.current.add(timer);
  }, []);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => {
    let active = true;
    api.getUser().then((profile) => {
      if (active) { setUser(profile); setSession(profile); }
    }).catch((error) => {
      if (active && error.status !== 401) setAuthError(error.message);
    }).finally(() => { if (active) setAuthLoading(false); });
    const expired = () => { setSession(null); setUser(null); setUnread(0); };
    window.addEventListener("dlf:session-expired", expired);
    return () => { active = false; window.removeEventListener("dlf:session-expired", expired); };
  }, []);
  useEffect(() => {
    try {
      const message = sessionStorage.getItem("dlf-flash");
      if (message) {
        sessionStorage.removeItem("dlf-flash");
        toast(message);
      }
    } catch {
      /* Optional legacy cross-page notification. */
    }
  }, [toast]);
  useEffect(() => {
    let active = true;
    if (session) {
      Promise.all([api.getUser(), api.getNotifications()])
        .then(([profile, notes]) => {
          if (active) {
            setUser(profile);
            setUnread(notes.filter((note) => !note.read).length);
          }
        })
        .catch((error) => toast(error.message, "error"));
    } else {
      setUser(null);
      setUnread(0);
    }
    return () => {
      active = false;
    };
  }, [session, toast]);
  const refreshUnread = useCallback(async () => {
    if (api.getSession())
      setUnread(
        (await api.getNotifications()).filter((note) => !note.read).length,
      );
  }, []);
  const refreshMessagesUnread = useCallback(async () => {
    if (!api.getSession()) {
      setMessagesUnread(0);
      return 0;
    }
    const count = await api.getUnreadMessageCount();
    setMessagesUnread(count);
    return count;
  }, []);
  useEffect(() => {
    if (!session) {
      setMessagesUnread(0);
      return undefined;
    }
    let active = true;
    const refresh = async () => {
      try {
        const count = await api.getUnreadMessageCount();
        if (active) setMessagesUnread(count);
      } catch (error) {
        if (active) console.error("Could not refresh unread messages:", error);
      }
    };
    refresh();
    const interval = setInterval(refresh, 30000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [session]);
  const login = async (values) => {
    const profile = await api.loginUser(values);
    setUser(profile);
    setSession(api.getSession());
    setAuthError("");
  };
  const logout = async () => {
    await api.logout();
    setSession(null);
    setUser(null);
    setUnread(0);
  };
  return (
    <AppContext.Provider
      value={{
        session,
        authLoading,
        authError,
        user,
        setUser,
        unread,
        refreshUnread,
        messagesUnread,
        refreshMessagesUnread,
        login,
        logout,
        toast,
      }}
    >
      {children}
      {createPortal(
        <div id="toasts" role="status" aria-live="polite">
          {toasts.map((item) => (
            <div className={`toast ${item.type}`} key={item.id}>
              <Icon name={item.type === "success" ? "check" : "info"} />
              <span>{item.message}</span>
              <button
                className="icon-button"
                aria-label="Dismiss notification"
                onClick={() =>
                  setToasts((current) =>
                    current.filter((row) => row.id !== item.id),
                  )
                }
              >
                <Icon name="close" />
              </button>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </AppContext.Provider>
  );
}
