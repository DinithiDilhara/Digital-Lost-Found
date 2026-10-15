
package com.digitallostfound.server;

import com.digitallostfound.repository.LostItemRepository;
import com.google.gson.Gson;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.concurrent.Executors;
import com.digitallostfound.repository.FoundItemRepository;

public class Server {

    private static final Gson gson = new Gson();

    public static void main(String[] args) throws IOException {

        HttpServer server = HttpServer.create(
                new InetSocketAddress("127.0.0.1", 5000), 0);

        server.createContext("/api/health", exchange -> {
            if (!exchange.getRequestMethod().equals("GET")) {
                exchange.getResponseHeaders().set("Allow", "GET");
                sendJson(exchange, 405,
                        Map.of("error", "Method not allowed"));
                return;
            }

            sendJson(exchange, 200,
                    Map.of("status", "ok",
                           "message", "Digital Lost & Found server is running"));
        });

        server.createContext("/api/lost-items", exchange -> {

            if (!exchange.getRequestURI().getPath().equals("/api/lost-items")) {
                sendJson(exchange, 404, Map.of("error", "Not found"));
                return;
            }

            if (!exchange.getRequestMethod().equals("GET")) {
                exchange.getResponseHeaders().set("Allow", "GET");
                sendJson(exchange, 405,
                        Map.of("error", "Method not allowed"));
                return;
            }

            try {
                LostItemRepository repository = new LostItemRepository();
                sendJson(exchange, 200, repository.getAllLostItems());
            } catch (Exception e) {
                System.err.println("Database error: " + e.getMessage());
                sendJson(exchange, 500,
                        Map.of("error", "Unable to retrieve lost items"));
            }
        });

server.createContext("/api/found-items", exchange -> {

    if (!exchange.getRequestURI().getPath().equals("/api/found-items")) {
        sendJson(exchange, 404, Map.of("error", "Not found"));
        return;
    }

    if (!exchange.getRequestMethod().equals("GET")) {
        exchange.getResponseHeaders().set("Allow", "GET");
        sendJson(exchange, 405,
                Map.of("error", "Method not allowed"));
        return;
    }

    try {
        FoundItemRepository repository = new FoundItemRepository();
        sendJson(exchange, 200, repository.getAllFoundItems());

    } catch (Exception e) {
        System.err.println("Found items database error: " + e.getMessage());

        sendJson(exchange, 500,
                Map.of("error", "Unable to retrieve found items"));
    }
});

        server.setExecutor(Executors.newFixedThreadPool(4));
        server.start();

        System.out.println("Digital Lost & Found Server Started!");
        System.out.println("http://127.0.0.1:5000/api/health");
        System.out.println("http://127.0.0.1:5000/api/lost-items");
        System.out.println("http://127.0.0.1:5000/api/found-items");
    }

    private static void sendJson(
            com.sun.net.httpserver.HttpExchange exchange,
            int status,
            Object data) throws IOException {

        byte[] bytes = gson.toJson(data)
                .getBytes(StandardCharsets.UTF_8);

        exchange.getResponseHeaders().set(
                "Content-Type", "application/json; charset=UTF-8");
        exchange.getResponseHeaders().set(
                "Cache-Control", "no-store");

        exchange.sendResponseHeaders(status, bytes.length);

        try (OutputStream output = exchange.getResponseBody()) {
            output.write(bytes);
        }
    }
}
