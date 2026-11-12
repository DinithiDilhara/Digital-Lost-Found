package com.digitallostfound.server;

import com.digitallostfound.model.User;
import com.digitallostfound.repository.*;
import com.digitallostfound.service.Passwords;
import com.google.gson.JsonObject;
import com.sun.net.httpserver.HttpExchange;
import java.util.*;

final class AuthHandler {
    private final UserRepository users = new UserRepository();
    private final SessionRepository sessions = new SessionRepository();
    private static final String COOKIE = "dlf_session";
    private static final String DUMMY_HASH = Passwords.hash("unused-login-timing-padding");

    static String token(HttpExchange exchange) {
        String cookies = exchange.getRequestHeaders().getFirst("Cookie");
        if (cookies != null) for (String pair : cookies.split(";")) {
            String[] parts = pair.trim().split("=", 2);
            if (parts.length == 2 && parts[0].equals(COOKIE) && parts[1].matches("[A-Za-z0-9_-]{43}")) return parts[1];
        }
        return null;
    }
    Integer optionalUserId(HttpExchange exchange) throws Exception { return sessions.find(token(exchange)); }
    int requireUserId(HttpExchange exchange) throws Exception {
        Integer id = optionalUserId(exchange);
        if (id == null) throw new Http.Error(401, "Please log in to continue.");
        return id;
    }
    private void cookie(HttpExchange exchange, String token, Long seconds) {
        exchange.getResponseHeaders().add("Set-Cookie", COOKIE + "=" + token + "; Path=/api; HttpOnly; SameSite=Lax"
            + (seconds == null ? "" : "; Max-Age=" + seconds)
            + ("true".equalsIgnoreCase(System.getenv("COOKIE_SECURE")) ? "; Secure" : ""));
    }
    private Map<String, Object> profile(User user) {
        return Map.of("id", String.valueOf(user.getUserId()), "name", user.getName(), "email", user.getEmail(),
            "registration", Objects.toString(user.getRegistration(), ""));
    }
    private void profileFields(User user, JsonObject body) {
        user.setName(Http.text(body, "name", 100, true));
        user.setRegistration(Http.text(body, "registration", 40, true));
        String email = Http.text(body, "email", 255, true).toLowerCase(Locale.ROOT);
        if (!email.matches("[^\\s@]+@[^\\s@]+\\.[^\\s@]+")) throw new Http.Error(400, "Enter a valid email address.");
        user.setEmail(email);
    }
    void handle(HttpExchange exchange) throws Exception {
        String path = exchange.getRequestURI().getPath();
        String method = exchange.getRequestMethod();
        switch (path) {
            case "/api/auth/register" -> {
                if (!method.equals("POST")) Http.method(exchange, "POST");
                JsonObject body = Http.body(exchange);
                User user = new User(0, "", "", "", null);
                profileFields(user, body);
                String password = Http.password(body, "password");
                if (password.length() < 8) throw new Http.Error(400, "Use at least 8 characters for your password.");
                user.setPassword(Passwords.hash(password));
                users.addUser(user);
                Http.json(exchange, 201, profile(user));
            }
            case "/api/auth/login" -> {
                if (!method.equals("POST")) Http.method(exchange, "POST");
                JsonObject body = Http.body(exchange);
                User user = users.getUserByEmail(Http.text(body, "email", 255, true).toLowerCase(Locale.ROOT));
                boolean valid = Passwords.verify(Http.password(body, "password"), user == null ? DUMMY_HASH : user.getPassword());
                if (user == null || !valid) throw new Http.Error(401, "Incorrect email or password.");
                boolean remember = body.has("remember") && body.get("remember").isJsonPrimitive()
                    && body.get("remember").getAsJsonPrimitive().isBoolean() && body.get("remember").getAsBoolean();
                long seconds = remember ? 30 * 86400L : 12 * 3600L;
                String session = Passwords.token();
                sessions.create(session, user.getUserId(), seconds);
                sessions.delete(token(exchange));
                cookie(exchange, session, remember ? seconds : null);
                Http.json(exchange, 200, profile(user));
            }
            case "/api/auth/logout" -> {
                if (!method.equals("POST")) Http.method(exchange, "POST");
                sessions.delete(token(exchange)); cookie(exchange, "", 0L);
                Http.json(exchange, 204, null);
            }
            case "/api/auth/me" -> {
                if (!method.equals("GET") && !method.equals("PUT")) Http.method(exchange, "GET, PUT");
                User user = users.getUserById(requireUserId(exchange));
                if (user == null) throw new Http.Error(401, "Please log in again.");
                if (method.equals("PUT")) {
                    profileFields(user, Http.body(exchange));
                    if (!users.updateUser(user)) throw new Http.Error(404, "Account not found.");
                }
                Http.json(exchange, 200, profile(user));
            }
            case "/api/auth/password" -> {
                if (!method.equals("PUT")) Http.method(exchange, "PUT");
                User user = users.getUserById(requireUserId(exchange));
                JsonObject body = Http.body(exchange);
                if (!Passwords.verify(Http.password(body, "currentPassword"), user.getPassword()))
                    throw new Http.Error(400, "Current password is incorrect.");
                String password = Http.password(body, "newPassword");
                if (password.length() < 8) throw new Http.Error(400, "Use at least 8 characters.");
                user.setPassword(Passwords.hash(password));
                if (!users.updateUser(user)) throw new Http.Error(404, "Account not found.");
                sessions.deleteOthers(user.getUserId(), token(exchange));
                Http.json(exchange, 204, null);
            }
            default -> throw new Http.Error(404, "Not found.");
        }
    }
}
