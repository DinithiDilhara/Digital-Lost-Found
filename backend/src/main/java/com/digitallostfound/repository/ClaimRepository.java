package com.digitallostfound.repository;

import com.digitallostfound.config.DatabaseConnection;
import com.digitallostfound.server.WebSocketServer;
import java.sql.*;
import java.util.Map;

public final class ClaimRepository {
    public record Claim(long claimId, int itemId, int finderId, int ownerId, String status) { }
    public static final class Failure extends RuntimeException {
        private final int status;
        public Failure(int status, String message) { super(message); this.status = status; }
        public int status() { return status; }
    }

    public Claim submit(int itemId, int finderId, String location, String message) {
        try (Connection connection = DatabaseConnection.getConnection()) {
            connection.setAutoCommit(false);
            try {
                int ownerId;
                try (PreparedStatement statement = connection.prepareStatement(
                        "SELECT user_id, status FROM lost_items WHERE item_id = ? FOR UPDATE")) {
                    statement.setInt(1, itemId);
                    try (ResultSet row = statement.executeQuery()) {
                        if (!row.next()) throw new Failure(404, "Lost-item report not found.");
                        ownerId = row.getInt("user_id");
                        if (ownerId == finderId) throw new Failure(403, "You cannot claim your own lost-item report.");
                        String status = row.getString("status");
                        if (!"LOST".equalsIgnoreCase(status) && !"OPEN".equalsIgnoreCase(status))
                            throw new Failure(409, "This lost-item report is no longer open for claims.");
                    }
                }
                long claimId;
                try (PreparedStatement statement = connection.prepareStatement(
                        "INSERT INTO found_claims (lost_item_id, finder_id, found_location, message, status) VALUES (?, ?, ?, ?, 'PENDING')",
                        Statement.RETURN_GENERATED_KEYS)) {
                    statement.setInt(1, itemId);
                    statement.setInt(2, finderId);
                    statement.setString(3, location);
                    statement.setString(4, message);
                    statement.executeUpdate();
                    try (ResultSet keys = statement.getGeneratedKeys()) {
                        if (!keys.next()) throw new SQLException("No generated claim ID.");
                        claimId = keys.getLong(1);
                    }
                }
                new NotificationRepository().createClaimNotification(
                    connection, ownerId, claimId, itemId,
                    "New found-item claim",
                    "Someone submitted a claim for your lost-item report.");
                connection.commit();
                Map<String, Object> notification = new NotificationRepository().latestForClaim(ownerId, claimId);
                if (!notification.isEmpty()) {
                    WebSocketServer.notifyUser(ownerId, Map.of("type", "NEW_NOTIFICATION", "notification", notification));
                }
                return new Claim(claimId, itemId, finderId, ownerId, "PENDING");
            } catch (SQLException | RuntimeException error) {
                connection.rollback();
                if (error instanceof SQLException sql && sql.getErrorCode() == 1062)
                    throw new Failure(409, "You have already submitted a found-item claim for this report.");
                throw error;
            }
        } catch (SQLException error) {
            throw new IllegalStateException("Failed to submit found-item claim", error);
        }
    }
}
