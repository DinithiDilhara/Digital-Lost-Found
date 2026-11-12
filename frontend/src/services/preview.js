// Deliberately isolated UI previews for teammates' unfinished features.
// Nothing here represents a live claim, message, notification or persisted report.
export function previewApi(getSession, getItem) {
  const key = name => {
    const user = getSession();
    if (!user) throw new Error('Please log in to continue.');
    return `dlf-preview-v1-${name}-${user.id}`;
  };
  const read = name => {
    try { return JSON.parse(localStorage.getItem(key(name)) || '[]'); }
    catch { return []; }
  };
  const write = (name, rows) => {
    localStorage.setItem(key(name), JSON.stringify(rows));
    return rows;
  };
  return {
    getMatches: async () => [],
    dismissMatch: async () => { throw new Error('Live matching is not connected yet.'); },
    claimItem: async (id, proof) => {
      const user = getSession();
      const item = await getItem(id);
      if (!user || !item || item.type !== 'found' || item.status !== 'Open' || item.ownerId === user.id)
        throw new Error('This item is not available to preview a claim.');
      if (proof.trim().length < 15) throw new Error('Add at least 15 characters describing the item.');
      const claims = read('claims');
      if (claims.some(claim => claim.itemId === id)) throw new Error('You already saved a demo claim for this item.');
      write('claims', [...claims, { itemId: id, proof, status: 'Demo only', date: new Date().toISOString() }]);
    },
  };
}
