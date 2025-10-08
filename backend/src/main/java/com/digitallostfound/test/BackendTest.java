package com.digitallostfound.test;

import com.digitallostfound.model.User;
import com.digitallostfound.service.UserService;

public class BackendTest {

    public static void main(String[] args) {

        UserService userService = new UserService();

        User user1 = new User(
                1,
                "Kamal",
                "kamal@gmail.com",
                "12345",
                "0712345678"
        );

        userService.registerUser(user1);
        

        System.out.println("User registered successfully!");
        User foundUser = userService.getUserById(1);

System.out.println("User found: " + foundUser.getName());
    }
    
}