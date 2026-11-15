package com.digitallostfound.service;

import com.digitallostfound.model.User;
import com.digitallostfound.repository.UserRepository;
import java.util.List;

public class UserService {

    private UserRepository userRepository;

    public UserService() {
        this.userRepository = new UserRepository();
    }
    public void registerUser(User user) {
    userRepository.addUser(user);
}
public List<User> getAllUsers() {
    return userRepository.getAllUsers();
}
public User getUserById(int userId) {
    return userRepository.getUserById(userId);
}
public User getUserByEmail(String email) {
    return userRepository.getUserByEmail(email);
}
public boolean updateUser(User updatedUser) {
    return userRepository.updateUser(updatedUser);
}
public boolean deleteUser(int userId) {
    return userRepository.deleteUser(userId);
}
}