package com.digitallostfound.server;

import com.digitallostfound.config.DatabaseConnection;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.sql.Connection;
import java.util.Map;
import java.util.concurrent.Executors;

public class Server {
    public static void main(String[] args) throws IOException {
        int port = Integer.parseInt(System.getenv().getOrDefault("PORT", "5000"));
        int websocketPort = Integer.parseInt(System.getenv().getOrDefault("WS_PORT", "5001"));
        String host = System.getenv().getOrDefault("HOST", "0.0.0.0");
        HttpServer server = HttpServer.create(new InetSocketAddress(host, port), 0);
        AuthHandler auth = new AuthHandler();
        WebSocketServer websocket = new WebSocketServer(new InetSocketAddress(host, websocketPort), auth);
        ItemHandler lost = new ItemHandler(true, auth);
        ItemHandler found = new ItemHandler(false, auth);
        ConversationHandler conversations = new ConversationHandler(auth);
        ClaimHandler claims = new ClaimHandler(auth);
        ClaimReviewHandler claimReview = new ClaimReviewHandler(auth);
        NotificationHandler notifications = new NotificationHandler(auth);
        server.createContext("/api/health", Http.safe(exchange -> {
            if (!exchange.getRequestMethod().equals("GET")) Http.method(exchange, "GET");
            switch (exchange.getRequestURI().getPath()) {
                case "/api/health" -> Http.json(exchange, 200, Map.of("status", "ok"));
                case "/api/health/db" -> {
                    try (Connection connection = DatabaseConnection.getConnection();
                         var statement = connection.createStatement()) {
                        // Verify the migrated tables as well as the connection, without changing data.
                        for (String sql : new String[] {
                            "SELECT registration FROM users LIMIT 0",
                            "SELECT color, contact, image, created_at, client_request_id, request_hash FROM lost_items LIMIT 0",
                            "SELECT color, contact, image, created_at, client_request_id, request_hash FROM found_items LIMIT 0",
                            "SELECT token_hash, user_id, expires_at FROM auth_sessions LIMIT 0",
                            "SELECT conversation_id, lost_item_id, found_item_id FROM conversations LIMIT 0",
                            "SELECT message_id, conversation_id, sender_id, body, read_at FROM messages LIMIT 0",
                            "SELECT notification_id, recipient_id, claim_id, lost_item_id, is_read FROM notifications LIMIT 0",
                            "SELECT claim_id, lost_item_id, finder_id, found_location, message, status, created_at, decided_at FROM found_claims LIMIT 0",
                            "SELECT returned_at FROM lost_items LIMIT 0"}) {
                            try (var ignored = statement.executeQuery(sql)) { }
                        }
                        Http.json(exchange, 200, Map.of("status", "ok", "database", connection.getCatalog()));
                    }
                }
                default -> throw new Http.Error(404, "Not found.");
            }
        }));
        server.createContext("/api/auth/", Http.safe(auth::handle));
        server.createContext("/api/lost-items", Http.safe(exchange -> {
            String path = exchange.getRequestURI().getPath();
            if (path.matches("/api/lost-items/[1-9][0-9]*/claims")) {
                if (exchange.getRequestMethod().equals("GET")) claimReview.list(exchange);
                else if (exchange.getRequestMethod().equals("POST")) claims.handle(exchange);
                else Http.method(exchange, "GET, POST");
            } else if (path.matches("/api/lost-items/[1-9][0-9]*/return")) {
                claimReview.markReturned(exchange);
            } else lost.handle(exchange);
        }));
        server.createContext("/api/claims/", Http.safe(claimReview::decide));
        server.createContext("/api/me/claims", Http.safe(claimReview::listForFinder));
        server.createContext("/api/found-items", Http.safe(found::handle));
        server.createContext("/api/conversations", Http.safe(conversations::handle));
        server.createContext("/api/notifications", Http.safe(notifications::handle));
        server.createContext("/api/me/reports", Http.safe(exchange -> {
            if (!exchange.getRequestURI().getPath().equals("/api/me/reports")) throw new Http.Error(404, "Not found.");
            if (!exchange.getRequestMethod().equals("GET")) Http.method(exchange, "GET");
            int owner = auth.requireUserId(exchange);
            Http.json(exchange, 200, Map.of("lost", lost.mine(owner), "found", found.mine(owner)));
        }));
        server.createContext("/", Http.safe(exchange -> { throw new Http.Error(404, "Not found."); }));
        var executor = Executors.newFixedThreadPool(8);
        server.setExecutor(executor);
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            server.stop(1);
            executor.shutdown();
            try {
                websocket.stop(1000);
            } catch (InterruptedException error) {
                Thread.currentThread().interrupt();
            }
        }));
        server.start();
        websocket.start();
        System.out.println("Digital Lost & Found: http://" + host + ":" + port + "/api/health");
        System.out.println("WebSocket: ws://" + host + ":" + websocketPort + "/api/ws");
        System.out.println("Database readiness: http://" + host + ":" + port + "/api/health/db");
    }
}
