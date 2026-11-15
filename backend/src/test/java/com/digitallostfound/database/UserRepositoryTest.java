package com.digitallostfound.database;

import com.digitallostfound.model.User;
import com.digitallostfound.repository.UserRepository;

public class UserRepositoryTest {

    public static void main(String[] args) {

        UserRepository repo = new UserRepository();
        String email = "jdbc-test-" + java.util.UUID.randomUUID()
                       + "@example.com";

        User user = new User(
            0,
            "Database Test User",
            email,
            "TEST_HASH_NOT_FOR_REAL_LOGIN",
            "0771234567"
        );

        int createdId = 0;

        try {
            repo.addUser(user);
            createdId = user.getUserId();

            if (createdId <= 0) {
                throw new IllegalStateException("INSERT failed");
            }
            System.out.println("INSERT PASSED");

            User saved = repo.getUserById(createdId);

            if (saved == null || !saved.getEmail().equals(email)) {
                throw new IllegalStateException("SELECT failed");
            }
            System.out.println("SELECT PASSED");

            saved.setName("Updated Database User");

            if (!repo.updateUser(saved)) {
                throw new IllegalStateException("UPDATE failed");
            }

            User updated = repo.getUserById(createdId);

            if (updated == null ||
                !updated.getName().equals("Updated Database User")) {
                throw new IllegalStateException("UPDATE verification failed");
            }
            System.out.println("UPDATE PASSED");

            if (repo.getUserByEmail(email) == null) {
                throw new IllegalStateException("Email lookup failed");
            }
            System.out.println("EMAIL LOOKUP PASSED");

        } finally {
            if (createdId > 0) {
                if (repo.deleteUser(createdId)) {
                    System.out.println("DELETE PASSED");
                } else {
                    throw new IllegalStateException("DELETE failed");
                }
            }
        }
    }
}