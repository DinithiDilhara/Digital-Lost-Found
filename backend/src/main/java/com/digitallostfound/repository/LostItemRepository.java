package com.digitallostfound.repository;

import com.digitallostfound.model.LostItem;
import java.util.ArrayList;
import java.util.List;

public class LostItemRepository {

    private List<LostItem> lostItems = new ArrayList<>();


    public void addLostItem(LostItem item) {
    lostItems.add(item);
}
    public List<LostItem> getAllLostItems() {
    return lostItems;
}
public LostItem getLostItemById(int itemId) {

    for (LostItem item : lostItems) {

        if (item.getItemId() == itemId) {
            return item;
        }
    }

    return null;
}
public boolean updateLostItem(LostItem updatedItem) {

    for (int i = 0; i < lostItems.size(); i++) {

        if (lostItems.get(i).getItemId() == updatedItem.getItemId()) {
            lostItems.set(i, updatedItem);
            return true;
        }
    }

    return false;
}
public boolean deleteLostItem(int itemId) {

    for (int i = 0; i < lostItems.size(); i++) {

        if (lostItems.get(i).getItemId() == itemId) {
            lostItems.remove(i);
            return true;
        }
    }

    return false;
}
}