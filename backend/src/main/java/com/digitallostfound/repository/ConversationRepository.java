package com.digitallostfound.repository;

import com.digitallostfound.config.DatabaseConnection;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Types;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public final class ConversationRepository {
    public static final class Failure extends RuntimeException {
        private final int status;
        public Failure(int status, String message) { super(message); this.status = status; }
        public int status() { return status; }
    }

    public long start(String itemType, int itemId, int requesterId) {
        String itemSql = itemType.equals("lost")
            ? "SELECT user_id FROM lost_items WHERE item_id = ?"
            : "SELECT user_id FROM found_items WHERE item_id = ?";
        String findSql = itemType.equals("lost")
            ? "SELECT conversation_id FROM conversations WHERE lost_item_id = ? AND requester_id = ?"
            : "SELECT conversation_id FROM conversations WHERE found_item_id = ? AND requester_id = ?";
        try (Connection connection = DatabaseConnection.getConnection()) {
            int reporterId;
            try (PreparedStatement statement = connection.prepareStatement(itemSql)) {
                statement.setInt(1, itemId);
                try (ResultSet result = statement.executeQuery()) {
                    if (!result.next()) throw new Failure(404, "Item report not found.");
                    reporterId = result.getInt(1);
                }
            }
            if (reporterId == requesterId) {
                throw new Failure(400, "You cannot start a conversation about your own report.");
            }
            Long existing = findConversation(connection, findSql, itemId, requesterId);
            if (existing != null) return existing;

            try (PreparedStatement statement = connection.prepareStatement(
                    "INSERT INTO conversations (lost_item_id, found_item_id, reporter_id, requester_id) VALUES (?, ?, ?, ?)",
                    Statement.RETURN_GENERATED_KEYS)) {
                if (itemType.equals("lost")) {
                    statement.setInt(1, itemId);
                    statement.setNull(2, Types.INTEGER);
                } else {
                    statement.setNull(1, Types.INTEGER);
                    statement.setInt(2, itemId);
                }
                statement.setInt(3, reporterId);
                statement.setInt(4, requesterId);
                statement.executeUpdate();
                try (ResultSet keys = statement.getGeneratedKeys()) {
                    if (keys.next()) return keys.getLong(1);
                }
                throw new SQLException("No generated conversation ID.");
            } catch (SQLException error) {
                if (error.getErrorCode() == 1062) {
                    existing = findConversation(connection, findSql, itemId, requesterId);
                    if (existing != null) return existing;
                }
                throw error;
            }
        } catch (SQLException error) {
            throw new IllegalStateException("Failed to start conversation", error);
        }
    }

    public Map<String, Object> send(long conversationId, int senderId, String clientMessageId, String body) {
        try (Connection connection = DatabaseConnection.getConnection()) {
            requireParticipant(connection, conversationId, senderId);
            Map<String, Object> existing = findByClientId(connection, senderId, clientMessageId);
            if (existing != null) {
                if (((Number) existing.get("conversationId")).longValue() != conversationId
                        || !body.equals(existing.get("body"))) {
                    throw new Failure(409, "This message retry key was already used for different content.");
                }
                return existing;
            }
            long messageId;
            try (PreparedStatement statement = connection.prepareStatement(
                    "INSERT INTO messages (conversation_id, sender_id, client_message_id, body) VALUES (?, ?, ?, ?)",
                    Statement.RETURN_GENERATED_KEYS)) {
                statement.setLong(1, conversationId);
                statement.setInt(2, senderId);
                statement.setString(3, clientMessageId);
                statement.setString(4, body);
                statement.executeUpdate();
                try (ResultSet keys = statement.getGeneratedKeys()) {
                    if (!keys.next()) throw new SQLException("No generated message ID.");
                    messageId = keys.getLong(1);
                }
            } catch (SQLException error) {
                if (error.getErrorCode() == 1062) {
                    existing = findByClientId(connection, senderId, clientMessageId);
                    if (existing != null
                            && ((Number) existing.get("conversationId")).longValue() == conversationId
                            && body.equals(existing.get("body"))) {
                        return existing;
                    }
                    throw new Failure(409, "This message retry key was already used.");
                }
                throw error;
            }
            try (PreparedStatement statement = connection.prepareStatement(
                    "UPDATE conversations SET updated_at = CURRENT_TIMESTAMP(6) WHERE conversation_id = ?")) {
                statement.setLong(1, conversationId);
                statement.executeUpdate();
            }
            return message(connection, messageId);
        } catch (SQLException error) {
            throw new IllegalStateException("Failed to send message", error);
        }
    }

    public List<Map<String, Object>> list(int userId) {
        String sql = """
            SELECT c.conversation_id,
                   CASE WHEN c.lost_item_id IS NOT NULL THEN 'lost' ELSE 'found' END AS item_type,
                   COALESCE(c.lost_item_id, c.found_item_id) AS item_id,
                   COALESCE(li.title, fi.title, 'Deleted item') AS item_title,
                   CASE WHEN c.requester_id = ? THEN reporter.name ELSE requester.name END AS other_name,
                   CASE WHEN c.requester_id = ? THEN c.reporter_id ELSE c.requester_id END AS other_id,
                   (SELECT m.body FROM messages m WHERE m.conversation_id = c.conversation_id
                    ORDER BY m.created_at DESC, m.message_id DESC LIMIT 1) AS latest_message,
                   (SELECT m.created_at FROM messages m WHERE m.conversation_id = c.conversation_id
                    ORDER BY m.created_at DESC, m.message_id DESC LIMIT 1) AS latest_message_at,
                   (SELECT COUNT(*) FROM messages unread
                    WHERE unread.conversation_id = c.conversation_id
                      AND unread.sender_id <> ? AND unread.read_at IS NULL) AS unread_count
            FROM conversations c
            LEFT JOIN lost_items li ON li.item_id = c.lost_item_id
            LEFT JOIN found_items fi ON fi.item_id = c.found_item_id
            JOIN users reporter ON reporter.user_id = c.reporter_id
            JOIN users requester ON requester.user_id = c.requester_id
            WHERE c.reporter_id = ? OR c.requester_id = ?
            ORDER BY COALESCE(c.updated_at, c.created_at) DESC, c.conversation_id DESC
            """;
        try (Connection connection = DatabaseConnection.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setInt(1, userId);
            statement.setInt(2, userId);
            statement.setInt(3, userId);
            statement.setInt(4, userId);
            statement.setInt(5, userId);
            try (ResultSet result = statement.executeQuery()) {
                List<Map<String, Object>> rows = new ArrayList<>();
                while (result.next()) {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", result.getLong("conversation_id"));
                    row.put("itemType", result.getString("item_type"));
                    row.put("itemId", result.getInt("item_id"));
                    row.put("itemTitle", result.getString("item_title"));
                    row.put("otherParticipant", result.getString("other_name"));
                    row.put("otherParticipantId", String.valueOf(result.getInt("other_id")));
                    row.put("latestMessage", result.getString("latest_message"));
                    row.put("latestMessageAt", instant(result.getTimestamp("latest_message_at")));
                    row.put("unreadCount", result.getInt("unread_count"));
                    rows.add(row);
                }
                return rows;
            }
        } catch (SQLException error) {
            throw new IllegalStateException("Failed to list conversations", error);
        }
    }

    public List<Map<String, Object>> messages(long conversationId, int userId) {
        try (Connection connection = DatabaseConnection.getConnection()) {
            requireParticipant(connection, conversationId, userId);
            try (PreparedStatement statement = connection.prepareStatement("""
                    SELECT m.message_id, m.conversation_id, m.sender_id, u.name AS sender_name,
                           m.body, m.created_at, m.read_at
                    FROM messages m JOIN users u ON u.user_id = m.sender_id
                    WHERE m.conversation_id = ?
                    ORDER BY m.created_at, m.message_id
                    """)) {
                statement.setLong(1, conversationId);
                try (ResultSet result = statement.executeQuery()) {
                    List<Map<String, Object>> rows = new ArrayList<>();
                    while (result.next()) {
                        Map<String, Object> row = new LinkedHashMap<>();
                        row.put("id", result.getLong("message_id"));
                        row.put("conversationId", result.getLong("conversation_id"));
                        row.put("senderId", String.valueOf(result.getInt("sender_id")));
                        row.put("senderName", result.getString("sender_name"));
                        row.put("body", result.getString("body"));
                        row.put("createdAt", instant(result.getTimestamp("created_at")));
                        row.put("readAt", instant(result.getTimestamp("read_at")));
                        rows.add(row);
                    }
                    return rows;
                }
            }
        } catch (SQLException error) {
            throw new IllegalStateException("Failed to retrieve messages", error);
        }
    }

    public int markRead(long conversationId, int userId) {
        try (Connection connection = DatabaseConnection.getConnection()) {
            requireParticipant(connection, conversationId, userId);
            try (PreparedStatement statement = connection.prepareStatement("""
                    UPDATE messages m JOIN conversations c ON c.conversation_id = m.conversation_id
                    SET m.read_at = CURRENT_TIMESTAMP(6)
                    WHERE m.conversation_id = ? AND m.sender_id <> ? AND m.read_at IS NULL
                      AND (c.reporter_id = ? OR c.requester_id = ?)
                    """)) {
                statement.setLong(1, conversationId);
                statement.setInt(2, userId);
                statement.setInt(3, userId);
                statement.setInt(4, userId);
                return statement.executeUpdate();
            }
        } catch (SQLException error) {
            throw new IllegalStateException("Failed to mark messages read", error);
        }
    }

    public int unreadCount(int userId) {
        try (Connection connection = DatabaseConnection.getConnection();
             PreparedStatement statement = connection.prepareStatement("""
                    SELECT COUNT(*) FROM messages m
                    JOIN conversations c ON c.conversation_id = m.conversation_id
                    WHERE (c.reporter_id = ? OR c.requester_id = ?)
                      AND m.sender_id <> ? AND m.read_at IS NULL
                    """)) {
            statement.setInt(1, userId);
            statement.setInt(2, userId);
            statement.setInt(3, userId);
            try (ResultSet result = statement.executeQuery()) {
                result.next();
                return result.getInt(1);
            }
        } catch (SQLException error) {
            throw new IllegalStateException("Failed to count unread messages", error);
        }
    }

    private Long findConversation(Connection connection, String sql, int itemId, int requesterId)
            throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setInt(1, itemId);
            statement.setInt(2, requesterId);
            try (ResultSet result = statement.executeQuery()) {
                return result.next() ? result.getLong(1) : null;
            }
        }
    }

    private void requireParticipant(Connection connection, long conversationId, int userId)
            throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement(
                "SELECT 1 FROM conversations WHERE conversation_id = ? AND (reporter_id = ? OR requester_id = ?)")) {
            statement.setLong(1, conversationId);
            statement.setInt(2, userId);
            statement.setInt(3, userId);
            try (ResultSet result = statement.executeQuery()) {
                if (!result.next()) throw new Failure(404, "Conversation not found.");
            }
        }
    }

    private Map<String, Object> findByClientId(Connection connection, int senderId, String clientMessageId)
            throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement(
                "SELECT message_id, conversation_id, sender_id, body, created_at, read_at FROM messages WHERE sender_id = ? AND client_message_id = ?")) {
            statement.setInt(1, senderId);
            statement.setString(2, clientMessageId);
            try (ResultSet result = statement.executeQuery()) {
                return result.next() ? message(result) : null;
            }
        }
    }

    private Map<String, Object> message(Connection connection, long messageId) throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement(
                "SELECT message_id, conversation_id, sender_id, body, created_at, read_at FROM messages WHERE message_id = ?")) {
            statement.setLong(1, messageId);
            try (ResultSet result = statement.executeQuery()) {
                if (!result.next()) throw new SQLException("Stored message could not be retrieved.");
                return message(result);
            }
        }
    }

    private Map<String, Object> message(ResultSet result) throws SQLException {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", result.getLong("message_id"));
        row.put("conversationId", result.getLong("conversation_id"));
        row.put("senderId", String.valueOf(result.getInt("sender_id")));
        row.put("body", result.getString("body"));
        row.put("createdAt", instant(result.getTimestamp("created_at")));
        row.put("readAt", instant(result.getTimestamp("read_at")));
        return row;
    }

    private String instant(Timestamp value) {
        return value == null ? null : Instant.ofEpochMilli(value.getTime())
            .plusNanos(value.getNanos() % 1_000_000).toString();
    }
}
