
package com.digitallostfound.server;

import com.digitallostfound.model.FoundItem;
import com.digitallostfound.model.LostItem;
import com.digitallostfound.repository.LostItemRepository;
import com.google.gson.Gson;
import com.google.gson.JsonParseException;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
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

            String path = exchange.getRequestURI().getPath();
            String lostItemsPath = "/api/lost-items";

            if (!path.equals(lostItemsPath)
                    && !path.startsWith(lostItemsPath + "/")) {
                sendJson(exchange, 404, Map.of("error", "Not found"));
                return;
            }

            if (path.startsWith(lostItemsPath + "/")) {
                if (exchange.getRequestMethod().equals("DELETE")) {
                    String idText = path.substring((lostItemsPath + "/").length());
                    int itemId;
                    try {
                        itemId = Integer.parseInt(idText);
                        if (itemId <= 0) {
                            throw new NumberFormatException();
                        }
                    } catch (NumberFormatException e) {
                        sendJson(exchange, 400,
                                Map.of("error", "Invalid lost item ID"));
                        return;
                    }

                    try {
                        LostItemRepository repository = new LostItemRepository();
                        if (!repository.deleteLostItem(itemId)) {
                            sendJson(exchange, 404,
                                    Map.of("error", "Lost item not found"));
                            return;
                        }

                        exchange.sendResponseHeaders(204, -1);
                        exchange.close();
                    } catch (Exception e) {
                        System.err.println("Database error: " + e.getMessage());
                        e.printStackTrace();
                        sendJson(exchange, 500,
                                Map.of("error", "Unable to delete lost item"));
                    }
                    return;
                }

                if (!exchange.getRequestMethod().equals("PUT")) {
                    exchange.getResponseHeaders().set("Allow", "PUT, DELETE");
                    sendJson(exchange, 405,
                            Map.of("error", "Method not allowed"));
                    return;
                }

                String idText = path.substring((lostItemsPath + "/").length());
                int itemId;
                try {
                    itemId = Integer.parseInt(idText);
                    if (itemId <= 0) {
                        throw new NumberFormatException();
                    }
                } catch (NumberFormatException e) {
                    sendJson(exchange, 400,
                            Map.of("error", "Invalid lost item ID"));
                    return;
                }

                try (InputStreamReader reader = new InputStreamReader(
                        exchange.getRequestBody(), StandardCharsets.UTF_8)) {
                    LostItem item = gson.fromJson(reader, LostItem.class);
                    if (!isValidLostItem(item)) {
                        sendJson(exchange, 400,
                                Map.of("error", "Invalid lost item data"));
                        return;
                    }

                    item.setItemId(itemId);
                    LostItemRepository repository = new LostItemRepository();
                    if (!repository.updateLostItem(item)) {
                        sendJson(exchange, 404,
                                Map.of("error", "Lost item not found"));
                        return;
                    }

                    sendJson(exchange, 200, item);
                } catch (JsonParseException | DateTimeParseException e) {
                    sendJson(exchange, 400,
                            Map.of("error", "Invalid lost item data"));
                } catch (Exception e) {
                    System.err.println("Database error: " + e.getMessage());
                    e.printStackTrace();
                    sendJson(exchange, 500,
                            Map.of("error", "Unable to update lost item"));
                }
                return;
            }

            if (exchange.getRequestMethod().equals("GET")) {
                try {
                    LostItemRepository repository = new LostItemRepository();
                    sendJson(exchange, 200, repository.getAllLostItems());
                } catch (Exception e) {
                    System.err.println("Database error: " + e.getMessage());
                    sendJson(exchange, 500,
                            Map.of("error", "Unable to retrieve lost items"));
                }
                return;
            }

            if (exchange.getRequestMethod().equals("POST")) {
                try (InputStreamReader reader = new InputStreamReader(
                        exchange.getRequestBody(), StandardCharsets.UTF_8)) {
                    LostItem item = gson.fromJson(reader, LostItem.class);
                    if (!isValidLostItem(item)) {
                        sendJson(exchange, 400,
                                Map.of("error", "Invalid lost item data"));
                        return;
                    }

                    LostItemRepository repository = new LostItemRepository();
                    repository.addLostItem(item);
                    sendJson(exchange, 201, item);
                } catch (JsonParseException | DateTimeParseException e) {
                    sendJson(exchange, 400,
                            Map.of("error", "Invalid lost item data"));
                } catch (Exception e) {
                    System.err.println("Database error: " + e.getMessage());
                    e.printStackTrace();
                    sendJson(exchange, 500,
                            Map.of("error", "Unable to create lost item"));
                }
                return;
            }

            exchange.getResponseHeaders().set("Allow", "GET, POST");
            sendJson(exchange, 405,
                    Map.of("error", "Method not allowed"));
        });

server.createContext("/api/found-items", exchange -> {

    String path = exchange.getRequestURI().getPath();
    String foundItemsPath = "/api/found-items";

    if (!path.equals(foundItemsPath)
            && !path.startsWith(foundItemsPath + "/")) {
        sendJson(exchange, 404, Map.of("error", "Not found"));
        return;
    }

    if (path.startsWith(foundItemsPath + "/")) {
        if (exchange.getRequestMethod().equals("DELETE")) {
            String idText = path.substring((foundItemsPath + "/").length());
            int itemId;
            try {
                itemId = Integer.parseInt(idText);
                if (itemId <= 0) {
                    throw new NumberFormatException();
                }
            } catch (NumberFormatException e) {
                sendJson(exchange, 400,
                        Map.of("error", "Invalid found item ID"));
                return;
            }

            try {
                FoundItemRepository repository = new FoundItemRepository();
                if (!repository.deleteFoundItem(itemId)) {
                    sendJson(exchange, 404,
                            Map.of("error", "Found item not found"));
                    return;
                }

                exchange.sendResponseHeaders(204, -1);
                exchange.close();
            } catch (Exception e) {
                System.err.println("Found items database error: " + e.getMessage());
                e.printStackTrace();
                sendJson(exchange, 500,
                        Map.of("error", "Unable to delete found item"));
            }
            return;
        }

        if (!exchange.getRequestMethod().equals("PUT")) {
            exchange.getResponseHeaders().set("Allow", "PUT, DELETE");
            sendJson(exchange, 405,
                    Map.of("error", "Method not allowed"));
            return;
        }

        String idText = path.substring((foundItemsPath + "/").length());
        int itemId;
        try {
            itemId = Integer.parseInt(idText);
            if (itemId <= 0) {
                throw new NumberFormatException();
            }
        } catch (NumberFormatException e) {
            sendJson(exchange, 400,
                    Map.of("error", "Invalid found item ID"));
            return;
        }

        try (InputStreamReader reader = new InputStreamReader(
                exchange.getRequestBody(), StandardCharsets.UTF_8)) {
            FoundItem item = gson.fromJson(reader, FoundItem.class);
            if (!isValidFoundItem(item)) {
                sendJson(exchange, 400,
                        Map.of("error", "Invalid found item data"));
                return;
            }

            item.setItemId(itemId);
            FoundItemRepository repository = new FoundItemRepository();
            if (!repository.updateFoundItem(item)) {
                sendJson(exchange, 404,
                        Map.of("error", "Found item not found"));
                return;
            }

            sendJson(exchange, 200, item);
        } catch (JsonParseException | DateTimeParseException e) {
            sendJson(exchange, 400,
                    Map.of("error", "Invalid found item data"));
        } catch (Exception e) {
            System.err.println("Found items database error: " + e.getMessage());
            e.printStackTrace();
            sendJson(exchange, 500,
                    Map.of("error", "Unable to update found item"));
        }
        return;
    }

    if (exchange.getRequestMethod().equals("GET")) {
        try {
            FoundItemRepository repository = new FoundItemRepository();
            sendJson(exchange, 200, repository.getAllFoundItems());

        } catch (Exception e) {
            System.err.println("Found items database error: " + e.getMessage());

            sendJson(exchange, 500,
                    Map.of("error", "Unable to retrieve found items"));
        }
        return;
    }

    if (exchange.getRequestMethod().equals("POST")) {
        try (InputStreamReader reader = new InputStreamReader(
                exchange.getRequestBody(), StandardCharsets.UTF_8)) {
            FoundItem item = gson.fromJson(reader, FoundItem.class);
            if (!isValidFoundItem(item)) {
                sendJson(exchange, 400,
                        Map.of("error", "Invalid found item data"));
                return;
            }

            FoundItemRepository repository = new FoundItemRepository();
            repository.addFoundItem(item);
            sendJson(exchange, 201, item);
        } catch (JsonParseException | DateTimeParseException e) {
            sendJson(exchange, 400,
                    Map.of("error", "Invalid found item data"));
        } catch (Exception e) {
            System.err.println("Found items database error: " + e.getMessage());
            e.printStackTrace();
            sendJson(exchange, 500,
                    Map.of("error", "Unable to create found item"));
        }
        return;
    }

    exchange.getResponseHeaders().set("Allow", "GET, POST, PUT, DELETE");
    sendJson(exchange, 405,
            Map.of("error", "Method not allowed"));
});

        server.setExecutor(Executors.newFixedThreadPool(4));
        server.start();

        System.out.println("Digital Lost & Found Server Started!");
        System.out.println("http://127.0.0.1:5000/api/health");
        System.out.println("http://127.0.0.1:5000/api/lost-items");
        System.out.println("http://127.0.0.1:5000/api/found-items");
    }

    private static boolean isValidLostItem(LostItem item) {
        return item != null
                && item.getUserId() > 0
                && item.getTitle() != null
                && !item.getTitle().isBlank()
                && item.getDateLost() != null
                && !item.getDateLost().isBlank()
                && isValidDate(item.getDateLost())
                && item.getStatus() != null
                && !item.getStatus().isBlank();
    }

    private static boolean isValidFoundItem(FoundItem item) {
        return item != null
                && item.getUserId() > 0
                && item.getTitle() != null
                && !item.getTitle().isBlank()
                && item.getDateFound() != null
                && !item.getDateFound().isBlank()
                && isValidDate(item.getDateFound())
                && item.getStatus() != null
                && !item.getStatus().isBlank();
    }

    private static boolean isValidDate(String date) {
        try {
            LocalDate.parse(date);
            return true;
        } catch (DateTimeParseException e) {
            return false;
        }
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
