package com.digitallostfound.config;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class DatabaseConnection {

    private static final String URL =
        "jdbc:mysql://localhost:3306/digital_lost_found";

    public static Connection getConnection() throws SQLException {

        String username = System.getenv("DB_USER");
        String password = System.getenv("DB_PASSWORD");

        if (username == null || username.isBlank()
                || password == null) {
            throw new SQLException("MySQL credentials are missing.");
        }

        return DriverManager.getConnection(
            URL, username, password
        );
    }
}