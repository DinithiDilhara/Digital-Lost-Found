package com.digitallostfound.server;

import com.digitallostfound.repository.NotificationRepository;
import com.sun.net.httpserver.HttpExchange;

final class NotificationHandler {
    private static final String BASE = "/api/notifications";
    private final AuthHandler auth;
    private final NotificationRepository notifications = new NotificationRepository();

    NotificationHandler(AuthHandler auth) {
        this.auth = auth;
    }

    void handle(HttpExchange exchange) throws Exception {
        int recipientId = auth.requireUserId(exchange);
        String path = exchange.getRequestURI().getPath();
        String method = exchange.getRequestMethod();
        if (path.equals(BASE)) {
            if (!method.equals("GET")) Http.method(exchange, "GET");
            Http.json(exchange, 200, notifications.list(recipientId));
            return;
        }
        if (path.equals(BASE + "/read")) {
            if (!method.equals("PATCH")) Http.method(exchange, "PATCH");
            Http.json(exchange, 200, java.util.Map.of(
                "updated", notifications.markAllRead(recipientId)));
            return;
        }
        if (path.equals(BASE + "/unread-count")) {
            if (!method.equals("GET")) Http.method(exchange, "GET");
            Http.json(exchange, 200, java.util.Map.of(
                "count", notifications.unreadCount(recipientId)));
            return;
        }
        var match = java.util.regex.Pattern
            .compile("^" + BASE + "/([1-9][0-9]*)/read$")
            .matcher(path);
        if (!match.matches()) throw new Http.Error(404, "Not found.");
        if (!method.equals("PATCH")) Http.method(exchange, "PATCH");
        try {
            long notificationId = Long.parseLong(match.group(1));
            Http.json(exchange, 200, java.util.Map.of(
                "updated", notifications.markRead(notificationId, recipientId)));
        } catch (NumberFormatException error) {
            throw new Http.Error(400, "Invalid notification ID.");
        }
    }
}
