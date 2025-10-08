package com.digitallostfound.repository;

import com.digitallostfound.model.FoundItem;
import java.util.ArrayList;
import java.util.List;

public class FoundItemRepository {

    private List<FoundItem> foundItems = new ArrayList<>();

    public void addFoundItem(FoundItem item) {
    foundItems.add(item);
}
    public List<FoundItem> getAllFoundItems() {
    return foundItems;
}

public FoundItem getFoundItemById(int itemId) {

    for (FoundItem item : foundItems) {

        if (item.getItemId() == itemId) {
            return item;
        }
    }

    return null;
}
public boolean updateFoundItem(FoundItem updatedItem) {

    for (int i = 0; i < foundItems.size(); i++) {

        if (foundItems.get(i).getItemId() == updatedItem.getItemId()) {
            foundItems.set(i, updatedItem);
            return true;
        }
    }

    return false;
}
public boolean deleteFoundItem(int itemId) {

    for (int i = 0; i < foundItems.size(); i++) {

        if (foundItems.get(i).getItemId() == itemId) {
            foundItems.remove(i);
            return true;
        }
    }

    return false;
}
}