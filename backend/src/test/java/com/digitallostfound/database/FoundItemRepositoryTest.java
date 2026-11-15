package com.digitallostfound.database;

import com.digitallostfound.model.User;
import com.digitallostfound.model.FoundItem;
import com.digitallostfound.repository.UserRepository;
import com.digitallostfound.repository.FoundItemRepository;
import com.mysql.cj.jdbc.AbandonedConnectionCleanupThread;

import java.util.UUID;

public class FoundItemRepositoryTest {

    public static void main(String[] args) {

        UserRepository userRepo = new UserRepository();
        FoundItemRepository foundRepo = new FoundItemRepository();

        User user = new User(
            0,
            "Found Item Test User",
            "found-test-" + UUID.randomUUID() + "@example.com",
            "TEST_HASH_NOT_FOR_REAL_LOGIN",
            "0771234567"
        );

        int userId = 0;
        int itemId = 0;

        try {
            userRepo.addUser(user);
            userId = user.getUserId();

            FoundItem item = new FoundItem(
                0,
                userId,
                "Test Phone",
                "Phone found near cafeteria",
                "Electronics",
                "University Cafeteria",
                "2026-10-15",
                "FOUND"
            );

            foundRepo.addFoundItem(item);
            itemId = item.getItemId();

            if (itemId <= 0) {
                throw new IllegalStateException("INSERT failed");
            }
            System.out.println("INSERT PASSED");

            FoundItem saved = foundRepo.getFoundItemById(itemId);

            if (saved == null ||
                !saved.getTitle().equals("Test Phone")) {
                throw new IllegalStateException("SELECT failed");
            }
            System.out.println("SELECT PASSED");

            item.setStatus("RETURNED");

            if (!foundRepo.updateFoundItem(item)) {
                throw new IllegalStateException("UPDATE failed");
            }

            FoundItem updated = foundRepo.getFoundItemById(itemId);

            if (updated == null ||
                !updated.getStatus().equals("RETURNED")) {
                throw new IllegalStateException("UPDATE verification failed");
            }
            System.out.println("UPDATE PASSED");

            final int savedItemId = itemId;

            boolean foundInList = foundRepo.getAllFoundItems()
                .stream()
                .anyMatch(i -> i.getItemId() == savedItemId);

            if (!foundInList) {
                throw new IllegalStateException("GET ALL failed");
            }
            System.out.println("GET ALL PASSED");

        } finally {
            try {
                if (itemId > 0) {
                    if (foundRepo.deleteFoundItem(itemId)) {
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