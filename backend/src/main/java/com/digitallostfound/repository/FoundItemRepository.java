
package com.digitallostfound.repository;

import com.digitallostfound.config.DatabaseConnection;
import com.digitallostfound.model.FoundItem;

import java.sql.Connection;
import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

public class FoundItemRepository {

    public void addFoundItem(FoundItem item) {
        String sql = "INSERT INTO found_items (user_id, title, description, category, location, date_found, status) VALUES (?, ?, ?, ?, ?, ?, ?)";

        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(
                     sql, Statement.RETURN_GENERATED_KEYS)) {

            stmt.setInt(1, item.getUserId());
            stmt.setString(2, item.getTitle());
            stmt.setString(3, item.getDescription());
            stmt.setString(4, item.getCategory());
            stmt.setString(5, item.getLocation());
            stmt.setDate(6, Date.valueOf(item.getDateFound()));
            stmt.setString(7, item.getStatus());

            if (stmt.executeUpdate() != 1) {
                throw new SQLException("Found item was not inserted.");
            }

            try (ResultSet keys = stmt.getGeneratedKeys()) {
                if (keys.next()) {
                    item.setItemId(keys.getInt(1));
                } else {
                    throw new SQLException("No generated item ID.");
                }
            }

        } catch (SQLException | IllegalArgumentException e) {
            throw new IllegalStateException("Failed to add found item", e);
        }
    }

    public List<FoundItem> getAllFoundItems() {
        List<FoundItem> items = new ArrayList<>();
        String sql = "SELECT * FROM found_items";

        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {

            while (rs.next()) {
                items.add(mapFoundItem(rs));
            }

        } catch (SQLException e) {
            throw new IllegalStateException("Failed to retrieve found items", e);
        }

        return items;
    }

    public FoundItem getFoundItemById(int itemId) {
        String sql = "SELECT * FROM found_items WHERE item_id = ?";

        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, itemId);

            try (ResultSet rs = stmt.executeQuery()) {
                return rs.next() ? mapFoundItem(rs) : null;
            }

        } catch (SQLException e) {
            throw new IllegalStateException("Failed to find found item", e);
        }
    }

    public boolean updateFoundItem(FoundItem item) {
        String sql = "UPDATE found_items SET user_id = ?, title = ?, description = ?, category = ?, location = ?, date_found = ?, status = ? WHERE item_id = ?";

        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, item.getUserId());
            stmt.setString(2, item.getTitle());
            stmt.setString(3, item.getDescription());
            stmt.setString(4, item.getCategory());
            stmt.setString(5, item.getLocation());
            stmt.setDate(6, Date.valueOf(item.getDateFound()));
            stmt.setString(7, item.getStatus());
            stmt.setInt(8, item.getItemId());

            return stmt.executeUpdate() > 0;

        } catch (SQLException | IllegalArgumentException e) {
            throw new IllegalStateException("Failed to update found item", e);
        }
    }

    public boolean deleteFoundItem(int itemId) {
        String sql = "DELETE FROM found_items WHERE item_id = ?";

        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, itemId);

            return stmt.executeUpdate() > 0;

        } catch (SQLException e) {
            throw new IllegalStateException("Failed to delete found item", e);
        }
    }

    private FoundItem mapFoundItem(ResultSet rs) throws SQLException {
        return new FoundItem(
                rs.getInt("item_id"),
                rs.getInt("user_id"),
                rs.getString("title"),
                rs.getString("description"),
                rs.getString("category"),
                rs.getString("location"),
                rs.getDate("date_found").toString(),
                rs.getString("status")
        );
    }
}
