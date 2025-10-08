package com.digitallostfound.model;

public class FoundItem {

    private int itemId;
    private int userId;
    private String title;
    private String description;
    private String category;
    private String location;
    private String dateFound;
    private String status;

    public FoundItem(int itemId, int userId, String title, String description,
                 String category, String location, String dateFound, String status) {

    this.itemId = itemId;
    this.userId = userId;
    this.title = title;
    this.description = description;
    this.category = category;
    this.location = location;
    this.dateFound = dateFound;
    this.status = status;
}
public int getItemId() {
    return itemId;
}

public int getUserId() {
    return userId;
}

public String getTitle() {
    return title;
}

public String getDescription() {
    return description;
}

public String getCategory() {
    return category;
}

public String getLocation() {
    return location;
}

public String getDateFound() {
    return dateFound;
}

public String getStatus() {
    return status;
}
public void setItemId(int itemId) {
    this.itemId = itemId;
}

public void setUserId(int userId) {
    this.userId = userId;
}

public void setTitle(String title) {
    this.title = title;
}

public void setDescription(String description) {
    this.description = description;
}

public void setCategory(String category) {
    this.category = category;
}

public void setLocation(String location) {
    this.location = location;
}

public void setDateFound(String dateFound) {
    this.dateFound = dateFound;
}

public void setStatus(String status) {
    this.status = status;
}
}
