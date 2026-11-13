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

public final class ClaimReviewRepository {
    public static final class Failure extends RuntimeException {
        private final int status;
        public Failure(int status, String message) { super(message); this.status = status; }
        public int status() { return status; }
    }

    private final NotificationRepository notifications = new NotificationRepository();

    public List<Map<String, Object>> listForOwner(int itemId, int ownerId) {
        try (Connection connection = DatabaseConnection.getConnection()) {
            requireOwner(connection, itemId, ownerId, false);
            String sql = """
                SELECT c.claim_id, c.finder_id, u.name AS finder_name, u.registration,
                       c.found_location, c.message, c.status, c.created_at, c.decided_at
                FROM found_claims c
                JOIN lost_items i ON i.item_id = c.lost_item_id
                JOIN users u ON u.user_id = c.finder_id
                WHERE c.lost_item_id = ? AND i.user_id = ?
                ORDER BY c.created_at DESC, c.claim_id DESC
                """;
            try (PreparedStatement statement = connection.prepareStatement(sql)) {
                statement.setInt(1, itemId);
                statement.setInt(2, ownerId);
                try (ResultSet rows = statement.executeQuery()) {
                    List<Map<String, Object>> claims = new ArrayList<>();
                    while (rows.next()) {
                        Map<String, Object> claim = new LinkedHashMap<>();
                        claim.put("claimId", rows.getLong("claim_id"));
                        claim.put("itemId", itemId);
                        claim.put("finderId", rows.getInt("finder_id"));
                        claim.put("finderName", rows.getString("finder_name"));
                        claim.put("finderRegistration", rows.getString("registration"));
                        claim.put("foundLocation", rows.getString("found_location"));
                        claim.put("message", rows.getString("message"));
                        claim.put("status", rows.getString("status"));
                        claim.put("createdAt", rows.getTimestamp("created_at").toInstant().toString());
                        var decidedAt = rows.getTimestamp("decided_at");
                        claim.put("decidedAt", decidedAt == null ? null : decidedAt.toInstant().toString());
                        claims.add(claim);
                    }
                    return claims;
                }
            }
        } catch (SQLException error) {
            throw new IllegalStateException("Failed to retrieve found-item claims", error);
        }
    }

    public List<Map<String, Object>> listForFinder(int finderId) {
        String sql = """
            SELECT c.claim_id, c.lost_item_id, c.found_location, c.message, c.status,
                   c.created_at, c.decided_at, i.title AS item_title, i.status AS item_status,
                   i.returned_at, u.name AS owner_name
            FROM found_claims c
            JOIN lost_items i ON i.item_id = c.lost_item_id
            JOIN users u ON u.user_id = i.user_id
            WHERE c.finder_id = ?
            ORDER BY c.created_at DESC, c.claim_id DESC
            """;
        try (Connection connection = DatabaseConnection.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setInt(1, finderId);
            try (ResultSet rows = statement.executeQuery()) {
                List<Map<String, Object>> claims = new ArrayList<>();
                while (rows.next()) {
                    Map<String, Object> claim = new LinkedHashMap<>();
                    claim.put("claimId", rows.getLong("claim_id"));
                    claim.put("itemId", rows.getInt("lost_item_id"));
                    claim.put("itemTitle", rows.getString("item_title"));
                    claim.put("ownerName", rows.getString("owner_name"));
                    claim.put("foundLocation", rows.getString("found_location"));
                    claim.put("message", rows.getString("message"));
                    claim.put("status", rows.getString("status"));
                    claim.put("itemStatus", rows.getString("item_status"));
                    claim.put("createdAt", rows.getTimestamp("created_at").toInstant().toString());
                    var decidedAt = rows.getTimestamp("decided_at");
                    claim.put("decidedAt", decidedAt == null ? null : decidedAt.toInstant().toString());
                    var returnedAt = rows.getTimestamp("returned_at");
                    claim.put("returnedAt", returnedAt == null ? null : returnedAt.toInstant().toString());
                    claims.add(claim);
                }
                return claims;
            }
        } catch (SQLException error) {
            throw new IllegalStateException("Failed to retrieve submitted claims", error);
        }
    }

    public Map<String, Object> decide(long claimId, int ownerId, String decision) {
        try (Connection connection = DatabaseConnection.getConnection()) {
            connection.setAutoCommit(false);
            try {
                int itemId;
                int finderId;
                try (PreparedStatement statement = connection.prepareStatement(
                        "SELECT lost_item_id, finder_id FROM found_claims WHERE claim_id = ?")) {
                    statement.setLong(1, claimId);
                    try (ResultSet row = statement.executeQuery()) {
                        if (!row.next()) throw new Failure(404, "Found-item claim not found.");
                        itemId = row.getInt("lost_item_id");
                        finderId = row.getInt("finder_id");
                    }
                }
                String itemStatus = requireOwner(connection, itemId, ownerId, true);
                String itemTitle = itemTitle(connection, itemId);
                if ("ACCEPTED".equals(decision)
                        && !"LOST".equalsIgnoreCase(itemStatus)
                        && !"OPEN".equalsIgnoreCase(itemStatus))
                    throw new Failure(409, "Claims can only be accepted while the lost-item report is open.");
                String currentStatus;
                try (PreparedStatement statement = connection.prepareStatement(
                        "SELECT status FROM found_claims WHERE claim_id = ? FOR UPDATE")) {
                    statement.setLong(1, claimId);
                    try (ResultSet row = statement.executeQuery()) {
                        if (!row.next()) throw new Failure(404, "Found-item claim not found.");
                        currentStatus = row.getString("status");
                    }
                }
                if (!"PENDING".equalsIgnoreCase(currentStatus))
                    throw new Failure(409, "Only pending claims can be decided.");
                if ("ACCEPTED".equals(decision)) {
                    try (PreparedStatement statement = connection.prepareStatement(
                            "SELECT COUNT(*) FROM found_claims WHERE lost_item_id = ? AND status = 'ACCEPTED' AND claim_id <> ?")) {
                        statement.setInt(1, itemId);
                        statement.setLong(2, claimId);
                        try (ResultSet row = statement.executeQuery()) {
                            row.next();
                            if (row.getLong(1) > 0)
                                throw new Failure(409, "Another claim has already been accepted for this item.");
                        }
                    }
                }
                try (PreparedStatement statement = connection.prepareStatement(
                        "UPDATE found_claims SET status = ?, decided_at = CURRENT_TIMESTAMP(6) WHERE claim_id = ? AND status = 'PENDING'")) {
                    statement.setString(1, decision);
                    statement.setLong(2, claimId);
                    if (statement.executeUpdate() != 1)
                        throw new Failure(409, "Only pending claims can be decided.");
                }
                notifications.createClaimStatusNotification(
                    connection, finderId, claimId, itemId, decision, itemTitle);
                connection.commit();
                return Map.of(
                    "claimId", claimId,
                    "itemId", itemId,
                    "finderId", finderId,
                    "status", decision);
            } catch (SQLException | RuntimeException error) {
                connection.rollback();
                throw error;
            }
        } catch (SQLException error) {
            throw new IllegalStateException("Failed to decide found-item claim", error);
        }
    }

    public Map<String, Object> markReturned(int itemId, int ownerId) {
        try (Connection connection = DatabaseConnection.getConnection()) {
            connection.setAutoCommit(false);
            try {
                String itemStatus = requireOwner(connection, itemId, ownerId, true);
                if ("RETURNED".equalsIgnoreCase(itemStatus)) {
                    connection.commit();
                    return Map.of("itemId", itemId, "status", "RETURNED");
                }
                String itemTitle = itemTitle(connection, itemId);
                if (!"LOST".equalsIgnoreCase(itemStatus)
                        && !"OPEN".equalsIgnoreCase(itemStatus)
                        && !"RESOLVED".equalsIgnoreCase(itemStatus))
                    throw new Failure(409, "This lost-item report cannot be marked returned.");

                long claimId;
                int finderId;
                try (PreparedStatement statement = connection.prepareStatement("""
                        SELECT claim_id, finder_id FROM found_claims
                        WHERE lost_item_id = ? AND status = 'ACCEPTED'
                        ORDER BY decided_at DESC, claim_id DESC
                        LIMIT 1 FOR UPDATE
                        """)) {
                    statement.setInt(1, itemId);
                    try (ResultSet row = statement.executeQuery()) {
                        if (!row.next())
                            throw new Failure(409, "Accept a found-item claim before confirming the handover.");
                        claimId = row.getLong("claim_id");
                        finderId = row.getInt("finder_id");
                    }
                }
                try (PreparedStatement statement = connection.prepareStatement(
                        "UPDATE lost_items SET status = 'RETURNED', returned_at = CURRENT_TIMESTAMP(6) WHERE item_id = ? AND user_id = ? AND status IN ('LOST', 'OPEN', 'RESOLVED')")) {
                    statement.setInt(1, itemId);
                    statement.setInt(2, ownerId);
                    if (statement.executeUpdate() != 1)
                        throw new Failure(409, "This lost-item report cannot be marked returned.");
                }
                notifications.createClaimStatusNotification(
                    connection, finderId, claimId, itemId, "RETURNED", itemTitle);
                connection.commit();
                return Map.of("itemId", itemId, "status", "RETURNED");
            } catch (SQLException | RuntimeException error) {
                connection.rollback();
                throw error;
            }
        } catch (SQLException error) {
            throw new IllegalStateException("Failed to mark lost item returned", error);
        }
    }

    private String requireOwner(Connection connection, int itemId, int ownerId, boolean lock)
            throws SQLException {
        String sql = "SELECT user_id, status FROM lost_items WHERE item_id = ?" + (lock ? " FOR UPDATE" : "");
        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setInt(1, itemId);
            try (ResultSet row = statement.executeQuery()) {
                if (!row.next()) throw new Failure(404, "Lost-item report not found.");
                if (row.getInt("user_id") != ownerId)
                    throw new Failure(403, "Only the item owner can review claims or confirm a return.");
                return row.getString("status");
            }
        }
    }

    private String itemTitle(Connection connection, int itemId) throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement(
                "SELECT title FROM lost_items WHERE item_id = ?")) {
            statement.setInt(1, itemId);
            try (ResultSet row = statement.executeQuery()) {
                if (!row.next()) throw new Failure(404, "Lost-item report not found.");
                return row.getString("title");
            }
        }
    }
}
