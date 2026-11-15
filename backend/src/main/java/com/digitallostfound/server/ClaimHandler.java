package com.digitallostfound.server;

import com.digitallostfound.repository.ClaimRepository;
import com.google.gson.JsonObject;
import com.sun.net.httpserver.HttpExchange;

final class ClaimHandler {
    private final AuthHandler auth;
    private final ClaimRepository claims = new ClaimRepository();
    ClaimHandler(AuthHandler auth) { this.auth = auth; }

    void handle(HttpExchange exchange) throws Exception {
        if (!exchange.getRequestMethod().equals("POST")) Http.method(exchange, "POST");
        int finderId = auth.requireUserId(exchange);
        String[] parts = exchange.getRequestURI().getPath().split("/");
        int itemId;
        try { itemId = Integer.parseInt(parts[3]); }
        catch (NumberFormatException error) { throw new Http.Error(400, "Invalid lost-item ID."); }
        JsonObject body = Http.body(exchange);
        String location = Http.text(body, "foundLocation", 150, true);
        String message = Http.text(body, "message", 1500, true);
        try {
            Http.json(exchange, 201, claims.submit(itemId, finderId, location, message));
        } catch (ClaimRepository.Failure error) {
            throw new Http.Error(error.status(), error.getMessage());
        }
    }
}
