package com.digitallostfound.database;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;
import com.mysql.cj.jdbc.AbandonedConnectionCleanupThread;
public class DatabaseConnectionTest {

    public static void main(String[] args) {

        String url = "jdbc:mysql://localhost:3306/digital_lost_found";

        String username = System.getenv("DB_USER");
        String password = System.getenv("DB_PASSWORD");

        if (username == null || password == null) {
            System.out.println("Database credentials are missing.");
            return;
        }

        try (Connection connection =
                     DriverManager.getConnection(url, username, password);

             Statement statement = connection.createStatement();

             ResultSet result = statement.executeQuery("SELECT DATABASE()")) {

            if (result.next()) {
                System.out.println("MySQL connection successful!");
                System.out.println("Connected database: " + result.getString(1));
            }
        } catch (Exception e) {
            System.out.println("MySQL connection failed.");
            e.printStackTrace();
                } finally {
            AbandonedConnectionCleanupThread.checkedShutdown();
                }

    }
}
