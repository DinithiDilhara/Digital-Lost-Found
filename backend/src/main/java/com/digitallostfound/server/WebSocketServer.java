package com.digitallostfound.server;

import com.digitallostfound.repository.ConversationRepository;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import java.net.InetSocketAddress;
import java.sql.SQLException;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.java_websocket.WebSocket;
import org.java_websocket.handshake.ClientHandshake;

public final class WebSocketServer extends org.java_websocket.server.WebSocketServer {
    private static final Gson JSON = new Gson();
    private static final Map<Integer, Set<WebSocket>> ACTIVE = new ConcurrentHashMap<>();
    private static final Map<WebSocket, Integer> USERS = new ConcurrentHashMap<>();
    private static final ConversationRepository CONVERSATIONS = new ConversationRepository();
    private final AuthHandler auth;

    WebSocketServer(InetSocketAddress address, AuthHandler auth) {
        super(address);
        this.auth = auth;
    }

    @Override
    public void onOpen(WebSocket connection, ClientHandshake handshake) {
        if (!"/api/ws".equals(handshake.getResourceDescriptor())) {
            connection.close(1008, "WebSocket path not found.");
            return;
        }

        Integer userId;
        try {
            userId = auth.optionalUserId(AuthHandler.token(handshake.getFieldValue("Cookie")));
        } catch (SQLException error) {
            System.err.println("WebSocket authentication lookup failed: SQLState="
                + error.getSQLState() + " code=" + error.getErrorCode());
            connection.close(1011, "Authentication service unavailable.");
            return;
        }
        if (userId == null) {
            connection.close(1008, "Please log in to continue.");
            return;
        }

        USERS.put(connection, userId);
        ACTIVE.compute(userId, (id, current) -> {
            Set<WebSocket> next = current == null ? ConcurrentHashMap.newKeySet() : current;
            next.add(connection);
            return next;
        });
        send(connection, Map.of("type", "CONNECTED"));
    }

    @Override
    public void onMessage(WebSocket connection, String text) {
        Integer userId = USERS.get(connection);
        if (userId == null) {
            connection.close(1008, "Please log in to continue.");
            return;
        }
        handleText(connection, userId, text);
    }

    @Override
    public void onClose(WebSocket connection, int code, String reason, boolean remote) {
        Integer userId = USERS.remove(connection);
        if (userId != null) {
            ACTIVE.computeIfPresent(userId, (id, current) -> {
                current.remove(connection);
                return current.isEmpty() ? null : current;
            });
        }
    }

    @Override
    public void onError(WebSocket connection, Exception error) {
        System.err.println("WebSocket failure: " + error.getClass().getSimpleName());
    }

    @Override
    public void onStart() {
        setConnectionLostTimeout(60);
    }

    public static void notifyUser(int userId, Object payload) {
        if (userId < 1) return;
        Set<WebSocket> sessions = ACTIVE.get(userId);
        if (sessions == null || sessions.isEmpty()) return;
        for (WebSocket session : Set.copyOf(sessions)) {
            send(session, payload);
        }
    }

    private void handleText(WebSocket connection, int userId, String text) {
        if (text == null || text.isBlank()) return;
        String clientMessageId = null;
        try {
            JsonObject body = JsonParser.parseString(text).getAsJsonObject();
            if (body.has("clientMessageId") && body.get("clientMessageId").isJsonPrimitive()
                    && body.get("clientMessageId").getAsJsonPrimitive().isString()) {
                clientMessageId = body.get("clientMessageId").getAsString();
            }
            String type = body.has("type") ? body.get("type").getAsString() : "";
            switch (type) {
                case "PING" -> send(connection, Map.of("type", "PONG", "timestamp", Instant.now().toString()));
                case "CHAT_MESSAGE" -> handleChatMessage(connection, userId, body);
                case "SUBSCRIBE" -> { }
                default -> send(connection, Map.of("type", "ERROR", "error", "Unsupported WebSocket message."));
            }
        } catch (RuntimeException error) {
            Map<String, Object> response = new LinkedHashMap<>();
            response.put("type", "ERROR");
            response.put("error", error.getMessage() == null
                ? "Unable to process WebSocket message." : error.getMessage());
            if (clientMessageId != null) response.put("clientMessageId", clientMessageId);
            send(connection, response);
        }
    }

    private void handleChatMessage(WebSocket connection, int userId, JsonObject body) {
        long conversationId = body.has("conversationId") ? body.get("conversationId").getAsLong() : 0L;
        if (conversationId < 1) {
            throw new IllegalArgumentException("Choose a valid conversation.");
        }
        String content = "";
        if (body.has("content") && !body.get("content").isJsonNull()) {
            content = body.get("content").getAsString();
        } else if (body.has("message") && !body.get("message").isJsonNull()) {
            content = body.get("message").getAsString();
        }
        String key = body.has("clientMessageId") ? body.get("clientMessageId").getAsString() : "";
        if (!key.matches("(?i)[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}")) {
            throw new IllegalArgumentException("A valid message retry key is required.");
        }
        key = UUID.fromString(key).toString();
        content = content == null ? "" : content.trim();
        if (content.isBlank()) {
            throw new IllegalArgumentException("Write a message before sending it.");
        }
        if (content.length() > 1500) {
            throw new IllegalArgumentException("Messages can be up to 1,500 characters.");
        }
        Map<String, Object> message = CONVERSATIONS.send(conversationId, userId, key, content);
        send(connection, Map.of(
            "type", "MESSAGE_SENT",
            "clientMessageId", key,
            "message", message
        ));
    }

    private static void send(WebSocket connection, Object payload) {
        if (connection.isOpen()) {
            connection.send(JSON.toJson(payload));
        }
    }
}
