package com.digitallostfound.database;

import com.digitallostfound.model.User;
import com.digitallostfound.model.LostItem;
import com.digitallostfound.repository.UserRepository;
import com.digitallostfound.repository.LostItemRepository;
import com.mysql.cj.jdbc.AbandonedConnectionCleanupThread;

import java.util.UUID;

public class LostItemRepositoryTest {

    public static void main(String[] args) {

        UserRepository userRepo = new UserRepository();
        LostItemRepository lostRepo = new LostItemRepository();

        User user = new User(
            0,
            "Lost Item Test User",
            "lost-test-" + UUID.randomUUID() + "@example.com",
            "TEST_HASH_NOT_FOR_REAL_LOGIN",
            "0771234567"
        );

        int userId = 0;
        int itemId = 0;

        try {
            userRepo.addUser(user);
            userId = user.getUserId();

            LostItem item = new LostItem(
                0,
                userId,
                "Test Wallet",
                "Black wallet lost near library",
                "Accessories",
                "University Library",
                "2026-10-15",
                "LOST"
            );

            lostRepo.addLostItem(item);
            itemId = item.getItemId();

            if (itemId <= 0) {
                throw new IllegalStateException("INSERT failed");
            }
            System.out.println("INSERT PASSED");

            LostItem saved = lostRepo.getLostItemById(itemId);

            if (saved == null ||
                !saved.getTitle().equals("Test Wallet")) {
                throw new IllegalStateException("SELECT failed");
            }
            System.out.println("SELECT PASSED");

            item.setStatus("FOUND");

            if (!lostRepo.updateLostItem(item)) {
                throw new IllegalStateException("UPDATE failed");
            }

            LostItem updated = lostRepo.getLostItemById(itemId);

            if (updated == null ||
                !updated.getStatus().equals("FOUND")) {
                throw new IllegalStateException("UPDATE verification failed");
            }
            System.out.println("UPDATE PASSED");

            final int savedItemId = itemId;

            boolean foundInList = lostRepo.getAllLostItems()
                .stream()
                .anyMatch(i -> i.getItemId() == savedItemId);

            if (!foundInList) {
                throw new IllegalStateException("GET ALL failed");
            }
            System.out.println("GET ALL PASSED");

        } finally {
            try {
                if (itemId > 0) {
                    if (lostRepo.deleteLostItem(itemId)) {
                        System.out.println("DELETE ITEM PASSED");
                    } else {
                        throw new IllegalStateException("DELETE ITEM failed");
                    }
                }
            } finally {
                try {
                    if (userId > 0) {
                        if (userRepo.deleteUser(userId)) {
                            System.out.println("DELETE TEST USER PASSED");
                        } else {
                            throw new IllegalStateException("DELETE TEST USER failed");
                        }
                    }
                } finally {
                    AbandonedConnectionCleanupThread.checkedShutdown();
                }
            }
        }
    }
}