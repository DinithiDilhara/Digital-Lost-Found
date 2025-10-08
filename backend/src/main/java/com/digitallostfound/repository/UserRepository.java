package com.digitallostfound.repository;

import com.digitallostfound.model.User;
import java.util.ArrayList;
import java.util.List;

public class UserRepository {

    private List<User> users = new ArrayList<>();

    public void addUser(User user) {
        users.add(user);
    }

    public List<User> getAllUsers() {
        return users;
    }
    public User getUserById(int userId) {

    for (User user : users) {

        if (user.getUserId() == userId) {
            return user;
        }
    }
    return null;
}
public User getUserByEmail(String email) {

    for (User user : users) {

        if (user.getEmail().equalsIgnoreCase(email)) {
            return user;
        }
    }

    return null;
}
public boolean updateUser(User updatedUser) {

    for (int i = 0; i < users.size(); i++) {

        if (users.get(i).getUserId() == updatedUser.getUserId()) {
            users.set(i, updatedUser);
            return true;
        }
    }

    return false;
}
public boolean deleteUser(int userId) {

    for (int i = 0; i < users.size(); i++) {

        if (users.get(i).getUserId() == userId) {
            users.remove(i);
            return true;
        }
    }

    return false;
}
}
