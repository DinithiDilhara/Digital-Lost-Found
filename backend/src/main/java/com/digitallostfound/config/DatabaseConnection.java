package com.digitallostfound.config;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.Map;

public class DatabaseConnection {

    private static final String DEFAULT_URL =
        "jdbc:mysql://localhost:3306/digital_lost_found";

    public static Connection getConnection() throws SQLException {

        Map<String, String> dotenv = readDotenv();
        String url = setting("DB_URL", dotenv);
        String username = setting("DB_USER", dotenv);
        String password = setting("DB_PASSWORD", dotenv);

        if (url == null || url.isBlank()) {
            url = DEFAULT_URL;
        }

        if (username == null || username.isBlank()
                || password == null) {
            throw new SQLException("MySQL credentials are missing.");
        }

        return DriverManager.getConnection(url, username, password);
    }

    private static String setting(String name, Map<String, String> dotenv) {
        String environmentValue = System.getenv(name);
        return environmentValue == null || environmentValue.isBlank()
                ? dotenv.get(name)
                : environmentValue;
    }

    private static Map<String, String> readDotenv() throws SQLException {
        Path current = Path.of("").toAbsolutePath().normalize();
        Path dotenvPath = Files.exists(current.resolve(".env"))
                ? current.resolve(".env")
                : current.getParent() == null
                ? current.resolve(".env")
                : current.getParent().resolve(".env");

        if (!Files.exists(dotenvPath)) {
            return Map.of();
        }

        Map<String, String> values = new HashMap<>();
        try {
            for (String line : Files.readAllLines(dotenvPath)) {
                String trimmed = line.trim();
                if (trimmed.isEmpty() || trimmed.startsWith("#")) {
                    continue;
                }
                int separator = trimmed.indexOf('=');
                if (separator <= 0) {
                    throw new SQLException("Invalid entry in local .env file.");
                }
                String name = trimmed.substring(0, separator).trim();
                String value = trimmed.substring(separator + 1).trim();
                if ((value.startsWith("\"") && value.endsWith("\""))
                        || (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.substring(1, value.length() - 1);
                }
                values.put(name, value);
            }
            return values;
        } catch (java.io.IOException e) {
            throw new SQLException("Unable to read .env file", e);
        }
    }
}