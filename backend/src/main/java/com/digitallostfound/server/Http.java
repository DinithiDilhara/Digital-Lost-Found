package com.digitallostfound.server;

import com.google.gson.*;
import com.digitallostfound.repository.ConversationRepository;
import com.sun.net.httpserver.*;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.sql.SQLException;
import java.util.Map;

final class Http {
    static final Gson JSON = new Gson();
    interface Action { void run(HttpExchange exchange) throws Exception; }
    static final class Error extends RuntimeException {
        final int status;
        Error(int status, String message) { super(message); this.status = status; }
    }
    static HttpHandler safe(Action action) {
        return exchange -> {
            try {
                if (!exchange.getRequestMethod().equals("GET")) {
                    // A cross-origin browser cannot send this header without a CORS preflight.
                    // No CORS permission is granted; React uses the same-origin Vite proxy.
                    if (!"1".equals(exchange.getRequestHeaders().getFirst("X-DLF-Request")))
                        throw new Error(403, "Use the application's authenticated API client.");
                }
                action.run(exchange);
            } catch (Error e) {
                json(exchange, e.status, Map.of("error", e.getMessage()));
            } catch (ConversationRepository.Failure e) {
                json(exchange, e.status(), Map.of("error", e.getMessage()));
            } catch (JsonParseException | IllegalArgumentException e) {
                json(exchange, 400, Map.of("error", "Invalid request data."));
            } catch (Exception e) {
                SQLException sql = sqlCause(e);
                if (sql != null && sql.getErrorCode() == 1062) {
                    json(exchange, 409, Map.of("error", "This email or request is already registered."));
                } else if (sql != null && (sql.getErrorCode() == 1451 || sql.getErrorCode() == 1452)) {
                    json(exchange, 409, Map.of("error", "This operation conflicts with a related record."));
                } else {
                    // Log only diagnostic codes, never credentials, request bodies or tokens.
                    System.err.println("Request failed: " + e.getClass().getSimpleName()
                        + (sql == null ? "" : " SQLState=" + sql.getSQLState() + " code=" + sql.getErrorCode()));
                    json(exchange, 503, Map.of("error", "Database unavailable or schema incomplete. Check MySQL, configuration and migrations."));
                }
            } finally { exchange.close(); }
        };
    }
    static SQLException sqlCause(Throwable error) {
        for (Throwable next = error; next != null; next = next.getCause())
            if (next instanceof SQLException sql) return sql;
        return null;
    }
    static JsonObject body(HttpExchange exchange) throws IOException {
        String type = exchange.getRequestHeaders().getFirst("Content-Type");
        if (type == null || !type.toLowerCase().startsWith("application/json"))
            throw new Error(415, "Content-Type must be application/json.");
        byte[] bytes = exchange.getRequestBody().readNBytes(3_000_001);
        if (bytes.length > 3_000_000) throw new Error(413, "Report image is too large.");
        JsonElement value = JsonParser.parseString(new String(bytes, StandardCharsets.UTF_8));
        if (!value.isJsonObject()) throw new Error(400, "Expected a JSON object.");
        return value.getAsJsonObject();
    }
    static String text(JsonObject body, String name, int max, boolean required) {
        JsonElement raw = body.get(name);
        if (raw != null && !raw.isJsonNull() && (!raw.isJsonPrimitive() || !raw.getAsJsonPrimitive().isString()))
            throw new Error(400, "Invalid " + name + ".");
        String value = raw == null || raw.isJsonNull() ? "" : raw.getAsString().trim();
        if ((required && value.isEmpty()) || value.length() > max)
            throw new Error(400, "Please check " + name + ".");
        return value;
    }
    static String password(JsonObject body, String name) {
        text(body, name, 256, true);
        return body.get(name).getAsString(); // Password whitespace is significant.
    }
    static void method(HttpExchange exchange, String allowed) {
        exchange.getResponseHeaders().set("Allow", allowed);
        throw new Error(405, "Method not allowed.");
    }
    static void json(HttpExchange exchange, int status, Object data) throws IOException {
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
        exchange.getResponseHeaders().set("Cache-Control", "no-store");
        exchange.getResponseHeaders().set("X-Content-Type-Options", "nosniff");
        if (status == 204) { exchange.sendResponseHeaders(status, -1); return; }
        byte[] bytes = JSON.toJson(data).getBytes(StandardCharsets.UTF_8);
        exchange.sendResponseHeaders(status, bytes.length);
        exchange.getResponseBody().write(bytes);
    }
}
