package com.digitallostfound.service;

import java.util.List;
import com.digitallostfound.model.FoundItem;
import com.digitallostfound.repository.FoundItemRepository;

public class FoundItemService {

    private FoundItemRepository foundItemRepository;

    public FoundItemService() {
        this.foundItemRepository = new FoundItemRepository();
    }

    public void reportFoundItem(FoundItem item) {
        foundItemRepository.addFoundItem(item);
    }
    public List<FoundItem> getAllFoundItems() {
    return foundItemRepository.getAllFoundItems();
}
    public FoundItem getFoundItemById(int itemId) {
    return foundItemRepository.getFoundItemById(itemId);
}
    public boolean updateFoundItem(FoundItem updatedItem) {
    return foundItemRepository.updateFoundItem(updatedItem);
}
    public boolean deleteFoundItem(int itemId) {
    return foundItemRepository.deleteFoundItem(itemId);
}
}
