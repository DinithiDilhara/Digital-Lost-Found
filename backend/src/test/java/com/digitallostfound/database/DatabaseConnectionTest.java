
package com.digitallostfound.database;

import com.digitallostfound.config.DatabaseConnection;
import com.mysql.cj.jdbc.AbandonedConnectionCleanupThread;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;

public class DatabaseConnectionTest {

    public static void main(String[] args) {

        try (Connection connection = DatabaseConnection.getConnection();
             Statement statement = connection.createStatement();
             ResultSet result = statement.executeQuery("SELECT DATABASE()")) {

            if (result.next()) {
                System.out.println("MySQL connection successful!");
                System.out.println("Connected database: " + result.getString(1));
            }

        } catch (Exception e) {
            System.out.println("MySQL connection failed.");
            e.printStackTrace();
            throw new IllegalStateException("Database connection test failed", e);

        } finally {
            AbandonedConnectionCleanupThread.checkedShutdown();
        }
    }
}
