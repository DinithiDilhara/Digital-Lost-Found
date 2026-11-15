package com.digitallostfound.server;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import com.sun.net.httpserver.HttpServer;
import java.net.*;
import java.net.http.*;

class HttpTest {
    @Test void unsafeRequestsNeedBrowserCsrfProtection() throws Exception {
        var server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/", Http.safe(exchange -> Http.json(exchange, 200, Http.body(exchange))));
        server.start();
        try {
            URI uri = URI.create("http://127.0.0.1:" + server.getAddress().getPort());
            var client = HttpClient.newHttpClient();
            var noHeader = HttpRequest.newBuilder(uri).header("Content-Type", "application/json").POST(HttpRequest.BodyPublishers.ofString("{}")).build();
            assertEquals(403, client.send(noHeader, HttpResponse.BodyHandlers.ofString()).statusCode());
            var valid = HttpRequest.newBuilder(uri).header("Content-Type", "application/json").header("X-DLF-Request", "1").POST(HttpRequest.BodyPublishers.ofString("{}")).build();
            var response = client.send(valid, HttpResponse.BodyHandlers.ofString());
            assertEquals(200, response.statusCode());
            assertEquals("no-store", response.headers().firstValue("Cache-Control").orElseThrow());
            assertTrue(response.headers().firstValue("Access-Control-Allow-Origin").isEmpty());
            var invalid = HttpRequest.newBuilder(uri).header("Content-Type", "application/json").header("X-DLF-Request", "1").POST(HttpRequest.BodyPublishers.ofString("[]")).build();
            assertEquals(400, client.send(invalid, HttpResponse.BodyHandlers.ofString()).statusCode());
        } finally { server.stop(0); }
    }
    @Test void databaseFailuresCannotProduceSuccessOrExposeDetails() throws Exception {
        var server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/", Http.safe(exchange -> { throw new java.sql.SQLException("private credentials", "08001"); }));
        server.start();
        try {
            var response = HttpClient.newHttpClient().send(HttpRequest.newBuilder(URI.create("http://127.0.0.1:" + server.getAddress().getPort())).build(), HttpResponse.BodyHandlers.ofString());
            assertEquals(503, response.statusCode());
            assertFalse(response.body().contains("private credentials"));
        } finally { server.stop(0); }
    }
}
