
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
        String sql = "INSERT INTO lost_items (user_id, title, description, category, location, date_lost, status) VALUES (?, ?, ?, ?, ?, ?, ?)";

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
        String sql = "SELECT * FROM lost_items";

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
        String sql = "UPDATE lost_items SET user_id = ?, title = ?, description = ?, category = ?, location = ?, date_lost = ?, status = ? WHERE item_id = ?";

        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, item.getUserId());
            stmt.setString(2, item.getTitle());
            stmt.setString(3, item.getDescription());
            stmt.setString(4, item.getCategory());
            stmt.setString(5, item.getLocation());
            stmt.setDate(6, Date.valueOf(item.getDateLost()));
            stmt.setString(7, item.getStatus());
            stmt.setInt(8, item.getItemId());

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

    private LostItem mapLostItem(ResultSet rs) throws SQLException {
        return new LostItem(
                rs.getInt("item_id"),
                rs.getInt("user_id"),
                rs.getString("title"),
                rs.getString("description"),
                rs.getString("category"),
                rs.getString("location"),
                rs.getDate("date_lost").toString(),
                rs.getString("status")
        );
    }
}
