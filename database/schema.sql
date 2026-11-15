CREATE DATABASE IF NOT EXISTS digital_lost_found;

USE digital_lost_found;

CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS lost_items (
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    location VARCHAR(150),
    date_lost DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'LOST',

    CONSTRAINT fk_lost_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS found_items (
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    location VARCHAR(150),
    date_found DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'FOUND',

    CONSTRAINT fk_found_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
);