
package com.digitallostfound.repository;

import com.digitallostfound.config.DatabaseConnection;
import com.digitallostfound.model.LostItem;

import java.sql.Connection;
import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

public class LostItemRepository {

    public void addLostItem(LostItem item) {
        String sql = "INSERT INTO lost_items (user_id, title, description, category, location, date_lost, status, color, contact, image, client_request_id, request_hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(
                     sql, Statement.RETURN_GENERATED_KEYS)) {

            stmt.setInt(1, item.getUserId());
            stmt.setString(2, item.getTitle());
            stmt.setString(3, item.getDescription());
            stmt.setString(4, item.getCategory());
            stmt.setString(5, item.getLocation());
            stmt.setDate(6, Date.valueOf(item.getDateLost()));
            stmt.setString(7, item.getStatus());
            stmt.setString(8, item.getColor());
            stmt.setString(9, item.getContact());
            stmt.setString(10, item.getImage());
            stmt.setString(11, item.getClientRequestId());
            stmt.setString(12, item.getRequestHash());

            if (stmt.executeUpdate() != 1) {
                throw new SQLException("Lost item was not inserted.");
            }

            try (ResultSet keys = stmt.getGeneratedKeys()) {
                if (keys.next()) {
                    item.setItemId(keys.getInt(1));
                } else {
                    throw new SQLException("No generated item ID.");
                }
            }

        } catch (SQLException | IllegalArgumentException e) {
            throw new IllegalStateException("Failed to add lost item", e);
        }
    }

    public List<LostItem> getAllLostItems() {
        List<LostItem> items = new ArrayList<>();
        String sql = "SELECT * FROM lost_items ORDER BY created_at DESC, item_id DESC";

        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {

            while (rs.next()) {
                items.add(mapLostItem(rs));
            }

        } catch (SQLException e) {
            throw new IllegalStateException("Failed to retrieve lost items", e);
        }

        return items;
    }

    public LostItem getLostItemById(int itemId) {
        String sql = "SELECT * FROM lost_items WHERE item_id = ?";

        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, itemId);

            try (ResultSet rs = stmt.executeQuery()) {
                return rs.next() ? mapLostItem(rs) : null;
            }

        } catch (SQLException e) {
            throw new IllegalStateException("Failed to find lost item", e);
        }
    }

    public boolean updateLostItem(LostItem item) {
        String sql = "UPDATE lost_items SET user_id = ?, title = ?, description = ?, category = ?, location = ?, date_lost = ?, status = ?, color = ?, contact = ?, image = ? WHERE item_id = ? AND user_id = ?";

        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, item.getUserId());
            stmt.setString(2, item.getTitle());
            stmt.setString(3, item.getDescription());
            stmt.setString(4, item.getCategory());
            stmt.setString(5, item.getLocation());
            stmt.setDate(6, Date.valueOf(item.getDateLost()));
            stmt.setString(7, item.getStatus());
            stmt.setString(8, item.getColor());
            stmt.setString(9, item.getContact());
            stmt.setString(10, item.getImage());
            stmt.setInt(11, item.getItemId());
            stmt.setInt(12, item.getUserId());

            return stmt.executeUpdate() > 0;

        } catch (SQLException | IllegalArgumentException e) {
            throw new IllegalStateException("Failed to update lost item", e);
        }
    }

    public boolean deleteLostItem(int itemId) {
        String sql = "DELETE FROM lost_items WHERE item_id = ?";

        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, itemId);
            return stmt.executeUpdate() > 0;

        } catch (SQLException e) {
            throw new IllegalStateException("Failed to delete lost item", e);
        }
    }


    public List<LostItem> getByOwner(int userId) {
        List<LostItem> items = new ArrayList<>();
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement("SELECT * FROM lost_items WHERE user_id = ? ORDER BY created_at DESC, item_id DESC")) {
            stmt.setInt(1, userId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) items.add(mapLostItem(rs));
            }
            return items;
        } catch (SQLException e) { throw new IllegalStateException("Failed to retrieve own reports", e); }
    }

    public LostItem getByRequest(int userId, String key) {
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement("SELECT * FROM lost_items WHERE user_id = ? AND client_request_id = ?")) {
            stmt.setInt(1, userId);
            stmt.setString(2, key);
            try (ResultSet rs = stmt.executeQuery()) { return rs.next() ? mapLostItem(rs) : null; }
        } catch (SQLException e) { throw new IllegalStateException("Failed to retrieve request", e); }
    }

    // HTTP callers must use this overload. The original is retained for existing repository tests/services.
    public boolean deleteLostItem(int itemId, int ownerId) {
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement("DELETE FROM lost_items WHERE item_id = ? AND user_id = ?")) {
            stmt.setInt(1, itemId);
            stmt.setInt(2, ownerId);
            return stmt.executeUpdate() == 1;
        } catch (SQLException e) { throw new IllegalStateException("Failed to delete report", e); }
    }

    private LostItem mapLostItem(ResultSet rs) throws SQLException {
        LostItem item = new LostItem(
                rs.getInt("item_id"),
                rs.getInt("user_id"),
                rs.getString("title"),
                rs.getString("description"),
                rs.getString("category"),
                rs.getString("location"),
                rs.getDate("date_lost").toString(),
                rs.getString("status")
        );
        item.setColor(rs.getString("color"));
        item.setContact(rs.getString("contact"));
        item.setImage(rs.getString("image"));
        item.setCreatedAt(rs.getTimestamp("created_at").toInstant().toString());
        item.setClientRequestId(rs.getString("client_request_id"));
        item.setRequestHash(rs.getString("request_hash"));
        return item;
    }
}
