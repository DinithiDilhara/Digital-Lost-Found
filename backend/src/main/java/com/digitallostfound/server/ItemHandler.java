package com.digitallostfound.server;

import com.digitallostfound.model.*;
import com.digitallostfound.repository.*;
import com.digitallostfound.service.Passwords;
import com.google.gson.*;
import com.sun.net.httpserver.HttpExchange;
import java.util.*;

/** Keeps the existing lost/found URLs and repository models, with shared validation/auth. */
final class ItemHandler {
    private final boolean lost;
    private final AuthHandler auth;
    private final LostItemRepository lostItems = new LostItemRepository();
    private final FoundItemRepository foundItems = new FoundItemRepository();
    ItemHandler(boolean lost, AuthHandler auth) { this.lost = lost; this.auth = auth; }

    private JsonObject object(Object item) { return Http.JSON.toJsonTree(item).getAsJsonObject(); }
    private Object get(int id) { return lost ? lostItems.getLostItemById(id) : foundItems.getFoundItemById(id); }
    private Object byRequest(int owner, String key) { return lost ? lostItems.getByRequest(owner, key) : foundItems.getByRequest(owner, key); }
    private Object model(JsonObject body) { return Http.JSON.fromJson(body, lost ? LostItem.class : FoundItem.class); }
    private void insert(Object item) {
        if (lost) lostItems.addLostItem((LostItem)item); else foundItems.addFoundItem((FoundItem)item);
    }
    private boolean update(Object item) {
        return lost ? lostItems.updateLostItem((LostItem)item) : foundItems.updateFoundItem((FoundItem)item);
    }
    private boolean delete(int id, int owner) {
        return lost ? lostItems.deleteLostItem(id, owner) : foundItems.deleteFoundItem(id, owner);
    }
    private JsonObject visible(Object item, Integer owner) {
        JsonObject data = object(item);
        data.remove("clientRequestId"); data.remove("requestHash");
        if (owner == null || owner != data.get("userId").getAsInt()) data.remove("contact");
        return data;
    }
    List<JsonObject> mine(int owner) {
        List<?> items = lost ? lostItems.getByOwner(owner) : foundItems.getByOwner(owner);
        return items.stream().map(item -> visible(item, owner)).toList();
    }
    private String status(String raw) {
        return switch (raw.toUpperCase(Locale.ROOT)) {
            case "OPEN" -> lost ? "LOST" : "FOUND";
            case "LOST" -> { if (!lost) throw new Http.Error(400, "Invalid found status."); yield "LOST"; }
            case "FOUND" -> "FOUND"; // Retains legacy lost-item FOUND (resolved) status.
            case "RESOLVED" -> { if (!lost) throw new Http.Error(400, "Use Returned for found items."); yield "RESOLVED"; }
            case "RETURNED" -> {
                if (lost) throw new Http.Error(400, "Use the owner-only return endpoint after the physical handover.");
                yield "RETURNED";
            }
            default -> throw new Http.Error(400, "Invalid report status.");
        };
    }
    private JsonObject validated(JsonObject input, int owner, JsonObject previous) {
        JsonObject body = previous == null ? new JsonObject() : previous.deepCopy();
        body.addProperty("userId", owner); // Browser-supplied owner IDs are never used.
        body.addProperty("title", Http.text(input, "title", 150, true));
        body.addProperty("description", Http.text(input, "description", 2000, true));
        body.addProperty("category", Http.text(input, "category", 50, true));
        body.addProperty("location", Http.text(input, "location", 150, true));
        String dateField = lost ? "dateLost" : "dateFound";
        String date = Http.text(input, dateField, 10, true);
        String dateError = ReportDates.validationError(date, ReportDates.today());
        if (dateError != null) throw new Http.Error(400, dateError);
        body.addProperty(dateField, date);
        for (String field : List.of("color", "contact", "image")) {
            if (previous == null || input.has(field))
                body.addProperty(field, Http.text(input, field, field.equals("image") ? 2_800_000 : field.equals("color") ? 40 : 150, false));
        }
        String image = body.has("image") ? body.get("image").getAsString() : "";
        if (!image.isEmpty() && !image.matches("assets/images/[a-z-]+\\.svg")) {
            if (!image.startsWith("data:image/png;base64,") && !image.startsWith("data:image/jpeg;base64,") && !image.startsWith("data:image/webp;base64,"))
                throw new Http.Error(400, "Use a PNG, JPEG or WebP image.");
            try {
                if (Base64.getDecoder().decode(image.substring(image.indexOf(',') + 1)).length > 2 * 1024 * 1024)
                    throw new Http.Error(400, "Image must be no larger than 2 MB.");
            } catch (IllegalArgumentException e) { throw new Http.Error(400, "Invalid image data."); }
        }
        // Creation always starts open. Edits preserve status; PATCH changes it explicitly.
        if (previous == null) body.addProperty("status", lost ? "LOST" : "FOUND");
        return body;
    }
    void handle(HttpExchange exchange) throws Exception {
        String base = lost ? "/api/lost-items" : "/api/found-items";
        String path = exchange.getRequestURI().getPath();
        String method = exchange.getRequestMethod();
        if (path.equals(base)) {
            if (method.equals("GET")) {
                List<?> items = lost ? lostItems.getAllLostItems() : foundItems.getAllFoundItems();
                Http.json(exchange, 200, items.stream().map(item -> visible(item, null)).toList());
            } else if (method.equals("POST")) {
                int owner = auth.requireUserId(exchange);
                JsonObject body = validated(Http.body(exchange), owner, null);
                String key = exchange.getRequestHeaders().getFirst("Idempotency-Key");
                if (key == null || !key.matches("[A-Za-z0-9_-]{16,64}"))
                    throw new Http.Error(400, "A unique Idempotency-Key header is required for a new report.");
                String hash = Passwords.digest(body.toString());
                Object existing = byRequest(owner, key);
                if (existing != null) { replay(exchange, existing, hash, owner); return; }
                body.addProperty("clientRequestId", key); body.addProperty("requestHash", hash);
                Object item = model(body);
                try { insert(item); }
                catch (IllegalStateException e) {
                    if (Http.sqlCause(e) != null && Http.sqlCause(e).getErrorCode() == 1062) {
                        existing = byRequest(owner, key);
                        if (existing != null) { replay(exchange, existing, hash, owner); return; }
                    }
                    throw e;
                }
                int id = object(item).get("itemId").getAsInt();
                exchange.getResponseHeaders().set("Location", base + "/" + id);
                Http.json(exchange, 201, visible(get(id), owner));
            } else Http.method(exchange, "GET, POST");
            return;
        }
        if (!path.matches(base + "/[1-9][0-9]*")) throw new Http.Error(404, "Report not found.");
        int id;
        try { id = Integer.parseInt(path.substring(base.length() + 1)); }
        catch (NumberFormatException e) { throw new Http.Error(400, "Invalid report ID."); }
        if (!List.of("GET", "PUT", "PATCH", "DELETE").contains(method)) Http.method(exchange, "GET, PUT, PATCH, DELETE");
        Integer viewer;
        if (method.equals("GET")) viewer = auth.optionalUserId(exchange);
        else viewer = auth.requireUserId(exchange);
        Object existing = get(id);
        if (existing == null) throw new Http.Error(404, "Report not found.");
        JsonObject previous = object(existing);
        if (method.equals("GET")) { Http.json(exchange, 200, visible(existing, viewer)); return; }
        if (viewer != previous.get("userId").getAsInt()) throw new Http.Error(403, "Only the owner can change this report.");
        if (method.equals("DELETE")) {
            if (!delete(id, viewer)) throw new Http.Error(404, "Report not found.");
            Http.json(exchange, 204, null); return;
        }
        JsonObject input = Http.body(exchange);
        JsonObject changed;
        if (method.equals("PATCH")) {
            changed = previous;
            changed.addProperty("status", status(Http.text(input, "status", 30, true)));
        } else changed = validated(input, viewer, previous);
        if (!update(model(changed))) throw new Http.Error(404, "Report not found.");
        Http.json(exchange, 200, visible(get(id), viewer));
    }
    private void replay(HttpExchange exchange, Object item, String hash, int owner) throws Exception {
        JsonObject record = object(item);
        if (!record.has("requestHash") || !hash.equals(record.get("requestHash").getAsString()))
            throw new Http.Error(409, "This submission key was already used for different report details.");
        Http.json(exchange, 200, visible(item, owner));
    }
}
