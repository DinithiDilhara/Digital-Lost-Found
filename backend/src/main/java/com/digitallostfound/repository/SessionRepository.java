package com.digitallostfound.repository;

import com.digitallostfound.config.DatabaseConnection;
import com.digitallostfound.service.Passwords;
import java.sql.*;
import java.time.Instant;

public class SessionRepository {
    public void create(String token, int userId, long seconds) throws SQLException {
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement("INSERT INTO auth_sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)")) {
            stmt.setString(1, Passwords.digest(token)); stmt.setInt(2, userId);
            stmt.setTimestamp(3, Timestamp.from(Instant.now().plusSeconds(seconds)));
            stmt.executeUpdate();
        }
    }
    public Integer find(String token) throws SQLException {
        if (token == null) return null;
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement("SELECT user_id FROM auth_sessions WHERE token_hash = ? AND expires_at > CURRENT_TIMESTAMP")) {
            stmt.setString(1, Passwords.digest(token));
            try (ResultSet rs = stmt.executeQuery()) { return rs.next() ? rs.getInt(1) : null; }
        }
    }
    public void delete(String token) throws SQLException {
        if (token == null) return;
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement("DELETE FROM auth_sessions WHERE token_hash = ?")) {
            stmt.setString(1, Passwords.digest(token)); stmt.executeUpdate();
        }
    }
    public void deleteOthers(int userId, String token) throws SQLException {
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement("DELETE FROM auth_sessions WHERE user_id = ? AND token_hash <> ?")) {
            stmt.setInt(1, userId); stmt.setString(2, Passwords.digest(token)); stmt.executeUpdate();
        }
    }
}
