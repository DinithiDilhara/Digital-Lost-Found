package com.digitallostfound.server;

import com.digitallostfound.repository.ClaimReviewRepository;
import com.google.gson.JsonObject;
import com.sun.net.httpserver.HttpExchange;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

final class ClaimReviewHandler {
    private static final Pattern CLAIMS_PATH = Pattern.compile("^/api/lost-items/([1-9][0-9]*)/claims$");
    private static final Pattern DECISION_PATH = Pattern.compile("^/api/claims/([1-9][0-9]*)/status$");
    private static final Pattern RETURN_PATH = Pattern.compile("^/api/lost-items/([1-9][0-9]*)/return$");
    private final AuthHandler auth;
    private final ClaimReviewRepository claims = new ClaimReviewRepository();

    ClaimReviewHandler(AuthHandler auth) {
        this.auth = auth;
    }

    void list(HttpExchange exchange) throws Exception {
        if (!exchange.getRequestMethod().equals("GET")) Http.method(exchange, "GET");
        int ownerId = auth.requireUserId(exchange);
        int itemId = parseId(CLAIMS_PATH.matcher(exchange.getRequestURI().getPath()), "lost-item");
        run(exchange, () -> claims.listForOwner(itemId, ownerId));
    }

    void listForFinder(HttpExchange exchange) throws Exception {
        if (!exchange.getRequestURI().getPath().equals("/api/me/claims"))
            throw new Http.Error(404, "Not found.");
        if (!exchange.getRequestMethod().equals("GET")) Http.method(exchange, "GET");
        int finderId = auth.requireUserId(exchange);
        run(exchange, () -> claims.listForFinder(finderId));
    }

    void decide(HttpExchange exchange) throws Exception {
        if (!exchange.getRequestMethod().equals("PATCH")) Http.method(exchange, "PATCH");
        int ownerId = auth.requireUserId(exchange);
        long claimId = parseLongId(DECISION_PATH.matcher(exchange.getRequestURI().getPath()), "claim");
        JsonObject body = Http.body(exchange);
        String decision = Http.text(body, "status", 30, true).toUpperCase(java.util.Locale.ROOT);
        if (!decision.equals("ACCEPTED") && !decision.equals("REJECTED"))
            throw new Http.Error(400, "Claim status must be ACCEPTED or REJECTED.");
        run(exchange, () -> claims.decide(claimId, ownerId, decision));
    }

    void markReturned(HttpExchange exchange) throws Exception {
        if (!exchange.getRequestMethod().equals("PATCH")) Http.method(exchange, "PATCH");
        int ownerId = auth.requireUserId(exchange);
        int itemId = parseId(RETURN_PATH.matcher(exchange.getRequestURI().getPath()), "lost-item");
        run(exchange, () -> claims.markReturned(itemId, ownerId));
    }

    private void run(HttpExchange exchange, Result action) throws Exception {
        try {
            Http.json(exchange, 200, action.get());
        } catch (ClaimReviewRepository.Failure error) {
            throw new Http.Error(error.status(), error.getMessage());
        }
    }

    private int parseId(Matcher match, String label) {
        try {
            long value = parseLongId(match, label);
            if (value > Integer.MAX_VALUE) throw new NumberFormatException();
            return (int)value;
        } catch (NumberFormatException error) {
            throw new Http.Error(400, "Invalid " + label + " ID.");
        }
    }

    private long parseLongId(Matcher match, String label) {
        if (!match.matches()) throw new Http.Error(404, "Not found.");
        try {
            return Long.parseLong(match.group(1));
        } catch (NumberFormatException error) {
            throw new Http.Error(400, "Invalid " + label + " ID.");
        }
    }

    @FunctionalInterface
    private interface Result {
        Object get();
    }
}
