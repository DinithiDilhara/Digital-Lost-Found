package com.digitallostfound.service;

import java.util.List;

import com.digitallostfound.model.LostItem;
import com.digitallostfound.repository.LostItemRepository;

public class LostItemService {

    private LostItemRepository lostItemRepository;

    public LostItemService() {
        this.lostItemRepository = new LostItemRepository();
}
    public void reportLostItem(LostItem item) {
    lostItemRepository.addLostItem(item);
}
    public List<LostItem> getAllLostItems() {
    return lostItemRepository.getAllLostItems();
}
    public LostItem getLostItemById(int itemId) {
    return lostItemRepository.getLostItemById(itemId);
}
    public boolean updateLostItem(LostItem updatedItem) {
    return lostItemRepository.updateLostItem(updatedItem);
}
public boolean deleteLostItem(int itemId) {
    return lostItemRepository.deleteLostItem(itemId);
}
}
