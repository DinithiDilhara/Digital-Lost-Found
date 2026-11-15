package com.digitallostfound.repository;

import com.digitallostfound.config.DatabaseConnection;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public final class NotificationRepository {
    public List<Map<String, Object>> list(int recipientId) {
        String sql = """
            SELECT notification_id, claim_id, lost_item_id, type, title, message, is_read, created_at
            FROM notifications
            WHERE recipient_id = ?
            ORDER BY created_at DESC, notification_id DESC
            """;
        try (Connection connection = DatabaseConnection.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setInt(1, recipientId);
            try (ResultSet result = statement.executeQuery()) {
                List<Map<String, Object>> notifications = new ArrayList<>();
                while (result.next()) notifications.add(map(result));
                return notifications;
            }
        } catch (SQLException error) {
            throw new IllegalStateException("Failed to retrieve notifications", error);
        }
    }

    public int markRead(long notificationId, int recipientId) {
        return updateRead("UPDATE notifications SET is_read = TRUE WHERE notification_id = ? AND recipient_id = ?",
            notificationId, recipientId);
    }

    public int markAllRead(int recipientId) {
        try (Connection connection = DatabaseConnection.getConnection();
             PreparedStatement statement = connection.prepareStatement(
                 "UPDATE notifications SET is_read = TRUE WHERE recipient_id = ? AND is_read = FALSE")) {
            statement.setInt(1, recipientId);
            return statement.executeUpdate();
        } catch (SQLException error) {
            throw new IllegalStateException("Failed to mark notifications as read", error);
        }
    }

    public long unreadCount(int recipientId) {
        try (Connection connection = DatabaseConnection.getConnection();
             PreparedStatement statement = connection.prepareStatement(
                 "SELECT COUNT(*) FROM notifications WHERE recipient_id = ? AND is_read = FALSE")) {
            statement.setInt(1, recipientId);
            try (ResultSet result = statement.executeQuery()) {
                result.next();
                return result.getLong(1);
            }
        } catch (SQLException error) {
            throw new IllegalStateException("Failed to count unread notifications", error);
        }
    }

    /**
     * Call this with the claim submission connection before its commit.
     */
    public Map<String, Object> latestForClaim(int recipientId, long claimId) {
        String sql = """
            SELECT notification_id, claim_id, lost_item_id, type, title, message, is_read, created_at
            FROM notifications
            WHERE recipient_id = ? AND claim_id = ?
            ORDER BY notification_id DESC
            LIMIT 1
            """;
        try (Connection connection = DatabaseConnection.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setInt(1, recipientId);
            statement.setLong(2, claimId);
            try (ResultSet result = statement.executeQuery()) {
                return result.next() ? map(result) : Map.of();
            }
        } catch (SQLException error) {
            throw new IllegalStateException("Failed to load the most recent claim notification", error);
        }
    }

    public void createClaimNotification(Connection connection, int ownerId, long claimId,
                                        int lostItemId, String title, String message)
            throws SQLException {
        String sql = """
            INSERT INTO notifications
                (recipient_id, claim_id, lost_item_id, type, title, message)
            VALUES (?, ?, ?, 'CLAIM_SUBMITTED', ?, ?)
            ON DUPLICATE KEY UPDATE notification_id = notification_id
            """;
        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setInt(1, ownerId);
            statement.setLong(2, claimId);
            statement.setInt(3, lostItemId);
            statement.setString(4, title);
            statement.setString(5, message);
            statement.executeUpdate();
        }
    }

    public void createClaimStatusNotification(Connection connection, int finderId, long claimId,
                                              int lostItemId, String status, String itemTitle) throws SQLException {
        String type;
        String title;
        String message;
        switch (status) {
            case "ACCEPTED" -> {
                type = "CLAIM_ACCEPTED";
                title = "Claim accepted";
                message = "The owner accepted your claim for " + itemTitle + ". Please arrange a handover.";
            }
            case "REJECTED" -> {
                type = "CLAIM_REJECTED";
                title = "Claim declined";
                message = "The owner declined your claim for " + itemTitle + ".";
            }
            case "RETURNED" -> {
                type = "CLAIM_RETURNED";
                title = "Item return confirmed!";
                message = "The owner has confirmed receiving the " + itemTitle
                    + ". Your claim has been successfully completed.";
            }
            default -> throw new IllegalArgumentException("Unsupported claim notification status.");
        }
        String sql = """
            INSERT INTO notifications
                (recipient_id, claim_id, lost_item_id, type, title, message)
            VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE notification_id = notification_id
            """;
        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setInt(1, finderId);
            statement.setLong(2, claimId);
            statement.setInt(3, lostItemId);
            statement.setString(4, type);
            statement.setString(5, title);
            statement.setString(6, message);
            statement.executeUpdate();
        }
    }

    private int updateRead(String sql, long notificationId, int recipientId) {
        try (Connection connection = DatabaseConnection.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setLong(1, notificationId);
            statement.setInt(2, recipientId);
            return statement.executeUpdate();
        } catch (SQLException error) {
            throw new IllegalStateException("Failed to mark notification as read", error);
        }
    }

    private Map<String, Object> map(ResultSet result) throws SQLException {
        Map<String, Object> notification = new LinkedHashMap<>();
        notification.put("id", result.getLong("notification_id"));
        long claimId = result.getLong("claim_id");
        notification.put("claimId", result.wasNull() ? null : claimId);
        int itemId = result.getInt("lost_item_id");
        notification.put("lostItemId", result.wasNull() ? null : itemId);
        notification.put("type", result.getString("type"));
        notification.put("title", result.getString("title"));
        notification.put("message", result.getString("message"));
        notification.put("read", result.getBoolean("is_read"));
        notification.put("date", result.getTimestamp("created_at").toInstant().toString());
        return notification;
    }
}
