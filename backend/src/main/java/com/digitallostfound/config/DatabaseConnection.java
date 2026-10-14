package com.digitallostfound.config;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class DatabaseConnection {

    private static final String DEFAULT_URL =
        "jdbc:mysql://localhost:3306/digital_lost_found";

    public static Connection getConnection() throws SQLException {

        String url = System.getenv("DB_URL");
        String username = System.getenv("DB_USER");
        String password = System.getenv("DB_PASSWORD");

        if (url == null || url.isBlank()) {
            url = DEFAULT_URL;
        }

        if (username == null || username.isBlank()
                || password == null) {
            throw new SQLException("MySQL credentials are missing.");
        }

        return DriverManager.getConnection(url, username, password);
    }
}