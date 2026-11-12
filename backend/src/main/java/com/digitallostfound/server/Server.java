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
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", port), 0);
        AuthHandler auth = new AuthHandler();
        ItemHandler lost = new ItemHandler(true, auth);
        ItemHandler found = new ItemHandler(false, auth);
        ConversationHandler conversations = new ConversationHandler(auth);
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
                            "SELECT message_id, conversation_id, sender_id, body, read_at FROM messages LIMIT 0"}) {
                            try (var ignored = statement.executeQuery(sql)) { }
                        }
                        Http.json(exchange, 200, Map.of("status", "ok", "database", connection.getCatalog()));
                    }
                }
                default -> throw new Http.Error(404, "Not found.");
            }
        }));
        server.createContext("/api/auth/", Http.safe(auth::handle));
        server.createContext("/api/lost-items", Http.safe(lost::handle));
        server.createContext("/api/found-items", Http.safe(found::handle));
        server.createContext("/api/conversations", Http.safe(conversations::handle));
        server.createContext("/api/me/reports", Http.safe(exchange -> {
            if (!exchange.getRequestURI().getPath().equals("/api/me/reports")) throw new Http.Error(404, "Not found.");
            if (!exchange.getRequestMethod().equals("GET")) Http.method(exchange, "GET");
            int owner = auth.requireUserId(exchange);
            Http.json(exchange, 200, Map.of("lost", lost.mine(owner), "found", found.mine(owner)));
        }));
        // No claims or notifications routes existed in this checkout. Keep their namespace free.
        server.createContext("/", Http.safe(exchange -> { throw new Http.Error(404, "Not found."); }));
        var executor = Executors.newFixedThreadPool(8);
        server.setExecutor(executor);
        Runtime.getRuntime().addShutdownHook(new Thread(() -> { server.stop(1); executor.shutdown(); }));
        server.start();
        System.out.println("Digital Lost & Found: http://127.0.0.1:" + port + "/api/health");
        System.out.println("Database readiness: http://127.0.0.1:" + port + "/api/health/db");
    }
}
