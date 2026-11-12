package com.digitallostfound.server;

import com.digitallostfound.repository.ConversationRepository;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.sun.net.httpserver.HttpExchange;
import java.util.Map;
import java.util.UUID;

final class ConversationHandler {
    private static final String BASE = "/api/conversations";
    private final AuthHandler auth;
    private final ConversationRepository conversations = new ConversationRepository();

    ConversationHandler(AuthHandler auth) {
        this.auth = auth;
    }

    void handle(HttpExchange exchange) throws Exception {
        String path = exchange.getRequestURI().getPath();
        String method = exchange.getRequestMethod();
        int userId = auth.requireUserId(exchange);

        if (path.equals(BASE)) {
            if (method.equals("GET")) {
                Http.json(exchange, 200, conversations.list(userId));
                return;
            }
            if (!method.equals("POST")) Http.method(exchange, "GET, POST");
            JsonObject body = Http.body(exchange);
            String itemType = Http.text(body, "itemType", 5, true);
            if (!itemType.equals("lost") && !itemType.equals("found")) {
                throw new Http.Error(400, "Choose a valid lost or found item.");
            }
            int itemId = positiveInteger(body.get("itemId"));
            String message = Http.text(body, "message", 1500, true);
            String clientMessageId = clientMessageId(exchange);
            long conversationId = conversations.start(itemType, itemId, userId);
            Map<String, Object> stored = conversations.send(
                conversationId, userId, clientMessageId, message);
            Http.json(exchange, 200, Map.of(
                "conversationId", conversationId,
                "message", stored
            ));
            return;
        }

        if (path.equals(BASE + "/unread-count")) {
            if (!method.equals("GET")) Http.method(exchange, "GET");
            Http.json(exchange, 200, Map.of("count", conversations.unreadCount(userId)));
            return;
        }

        var match = java.util.regex.Pattern
            .compile("^" + BASE + "/([1-9][0-9]*)/(messages|read)$")
            .matcher(path);
        if (!match.matches()) throw new Http.Error(404, "Not found.");
        long conversationId;
        try {
            conversationId = Long.parseLong(match.group(1));
        } catch (NumberFormatException error) {
            throw new Http.Error(400, "Invalid conversation ID.");
        }
        if (match.group(2).equals("read")) {
            if (!method.equals("POST")) Http.method(exchange, "POST");
            Http.json(exchange, 200, Map.of(
                "updated", conversations.markRead(conversationId, userId)
            ));
            return;
        }
        if (method.equals("GET")) {
            Http.json(exchange, 200, conversations.messages(conversationId, userId));
            return;
        }
        if (!method.equals("POST")) Http.method(exchange, "GET, POST");
        JsonObject body = Http.body(exchange);
        String message = Http.text(body, "message", 1500, true);
        Map<String, Object> stored = conversations.send(
            conversationId, userId, clientMessageId(exchange), message);
        Http.json(exchange, 201, stored);
    }

    private int positiveInteger(JsonElement value) {
        if (value == null || !value.isJsonPrimitive() || !value.getAsJsonPrimitive().isNumber()) {
            throw new Http.Error(400, "Choose a valid item report.");
        }
        try {
            int itemId = value.getAsInt();
            if (itemId < 1 || !value.getAsBigDecimal().equals(java.math.BigDecimal.valueOf(itemId))) {
                throw new Http.Error(400, "Choose a valid item report.");
            }
            return itemId;
        } catch (NumberFormatException | ArithmeticException error) {
            throw new Http.Error(400, "Choose a valid item report.");
        }
    }

    private String clientMessageId(HttpExchange exchange) {
        String key = exchange.getRequestHeaders().getFirst("Idempotency-Key");
        if (key == null || !key.matches(
                "(?i)[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}")) {
            throw new Http.Error(400, "A unique message retry key is required.");
        }
        return UUID.fromString(key).toString();
    }
}
