import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button, EmptyState } from "../components/Common.jsx";
import Icon from "../components/Icon.jsx";
import { useApp } from "../context/AppContext.jsx";
import { api } from "../services/api.js";
import "./messages.css";

const time = (value) => value
  ? new Date(value).toLocaleString(undefined, {
      month: "short", day: "numeric", year: "numeric",
      hour: "numeric", minute: "2-digit",
    })
  : "";

export default function Messages() {
  const [params] = useSearchParams();
  const requestedId = params.get("conversation");
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(requestedId || "");
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [listError, setListError] = useState("");
  const [messagesError, setMessagesError] = useState("");
  const [sendError, setSendError] = useState("");
  const submission = useRef(null);
  const { session, refreshMessagesUnread } = useApp();

  const loadConversations = useCallback(async () => {
    try {
      const rows = await api.getConversations();
      setConversations(rows);
      setListError("");
      setSelectedId((current) => {
        if (requestedId && rows.some((row) => String(row.id) === requestedId)) {
          return requestedId;
        }
        if (rows.some((row) => String(row.id) === current)) return current;
        return rows.length ? String(rows[0].id) : "";
      });
    } catch (error) {
      setListError(error.message);
    } finally {
      setLoading(false);
    }
  }, [requestedId]);

  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 15000);
    return () => clearInterval(interval);
  }, [loadConversations]);

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      setMessagesError("");
      setMessagesLoading(false);
      return undefined;
    }
    let active = true;
    let busy = false;
    const refresh = async () => {
      if (busy) return;
      busy = true;
      try {
        const rows = await api.getConversationMessages(selectedId);
        if (!active) return;
        setMessages(rows);
        setMessagesError("");
        await api.markConversationRead(selectedId);
        if (!active) return;
        setConversations((current) => current.map((conversation) =>
          String(conversation.id) === selectedId
            ? { ...conversation, unreadCount: 0 }
            : conversation));
        refreshMessagesUnread().catch((error) =>
          console.error("Could not refresh unread messages:", error));
      } catch (error) {
        if (active) setMessagesError(error.message);
      } finally {
        busy = false;
        if (active) setMessagesLoading(false);
      }
    };
    setMessages([]);
    setMessagesError("");
    setMessagesLoading(true);
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [selectedId, refreshMessagesUnread]);

  const selected = conversations.find((row) => String(row.id) === selectedId);
  const send = async (event) => {
    event.preventDefault();
    const content = draft.trim();
    if (!content) {
      setSendError("Write a message before sending.");
      return;
    }
    if (content.length > 1500) {
      setSendError("Messages can be up to 1,500 characters.");
      return;
    }
    if (!selected || sending) return;
    if (submission.current?.message !== content) {
      submission.current = { message: content, key: crypto.randomUUID() };
    }
    setSending(true);
    setSendError("");
    try {
      await api.replyToConversation(selected.id, content, submission.current.key);
      submission.current = null;
      setDraft("");
      setMessages(await api.getConversationMessages(selected.id));
      await loadConversations();
    } catch (error) {
      setSendError(error.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">PRIVATE ITEM CONVERSATIONS</span>
          <h2>Messages</h2>
          <p>Talk privately with students about specific lost and found reports.</p>
        </div>
      </div>
      <div className="messages-layout">
        <section className="panel conversation-panel" aria-label="Conversations">
          <div className="messages-panel-heading">
            <h3>Conversations</h3>
            <span>{conversations.length}</span>
          </div>
          {loading && <p className="messages-state" role="status">Loading conversations…</p>}
          {listError && <p className="messages-error" role="alert">{listError}</p>}
          {!loading && !conversations.length && !listError && (
            <EmptyState
              title="No conversations yet"
              message="Contact the reporter from an item page to start a private conversation."
            />
          )}
          {conversations.map((conversation) => (
            <button
              type="button"
              className={`conversation-card${String(conversation.id) === selectedId ? " active" : ""}`}
              key={conversation.id}
              aria-pressed={String(conversation.id) === selectedId}
              onClick={() => setSelectedId(String(conversation.id))}
            >
              <span className="conversation-card-top">
                <strong>{conversation.itemTitle}</strong>
                {conversation.unreadCount > 0 && (
                  <span className="conversation-unread" aria-label={`${conversation.unreadCount} unread messages`}>
                    {conversation.unreadCount}
                  </span>
                )}
              </span>
              <span className="conversation-person">{conversation.otherParticipant}</span>
              <span className="conversation-preview">
                {conversation.latestMessage || "Conversation started"}
              </span>
              <span className="conversation-time">{time(conversation.latestMessageAt)}</span>
            </button>
          ))}
        </section>

        <section className="panel chat-panel" aria-label="Selected conversation">
          {selected ? (
            <>
              <header className="chat-heading">
                <div>
                  <span className="eyebrow">{selected.itemType} item conversation</span>
                  <h3>{selected.itemTitle}</h3>
                  <p>With {selected.otherParticipant}</p>
                </div>
                <Button
                  variant="outline"
                  className="chat-item-link"
                  to={`/item-details.html?id=${selected.itemType}-${selected.itemId}`}
                >
                  View item <Icon name="arrow" />
                </Button>
              </header>
              <div className="chat-messages" role="log" aria-live="polite" aria-label="Messages">
                {messagesLoading && !messages.length && (
                  <p className="messages-state" role="status">Loading messages…</p>
                )}
                {messagesError && <p className="messages-error" role="alert">{messagesError}</p>}
                {!messagesLoading && !messages.length && !messagesError && (
                  <p className="messages-state">No messages in this conversation yet.</p>
                )}
                {messages.map((message) => {
                  const ownMessage = String(message.senderId) === String(session.id);
                  return (
                    <article
                      className={`chat-message${ownMessage ? " sent" : " received"}`}
                      key={message.id}
                    >
                      <p>{message.body}</p>
                      <time dateTime={message.createdAt}>
                        {ownMessage ? "You" : message.senderName} · {time(message.createdAt)}
                      </time>
                    </article>
                  );
                })}
              </div>
              <form className="chat-reply" onSubmit={send}>
                {sendError && <p className="messages-error" role="alert">{sendError}</p>}
                <label className="sr-only" htmlFor="message-reply">Reply to {selected.otherParticipant}</label>
                <textarea
                  id="message-reply"
                  name="message"
                  rows="3"
                  maxLength="1500"
                  placeholder="Write a private reply…"
                  value={draft}
                  onChange={(event) => {
                    setDraft(event.target.value);
                    setSendError("");
                  }}
                  disabled={sending}
                />
                <div className="chat-reply-actions">
                  <span>{draft.length}/1500</span>
                  <button className="btn btn-primary" type="submit" disabled={sending || !draft.trim()}>
                    <Icon name="mail" /> {sending ? "Sending…" : "Send message"}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <EmptyState
              title="Choose a conversation"
              message="Your private conversations about lost and found items will appear here."
            >
              <Link className="text-link" to="/found-items.html">Browse found items</Link>
            </EmptyState>
          )}
        </section>
      </div>
    </>
  );
}
