import { create } from 'zustand';
import { persist } from 'zustand/middleware';
export const useCart = create(persist((set, get) => ({
  items: [], open: false,
  setOpen: (open) => set({ open }),
  add: (it) => set((s) => {
    const key = it.productId + ':' + it.size;
    const ex = s.items.find((i) => i.key === key);
    const items = ex ? s.items.map((i) => (i.key === key ? { ...i, qty: Math.min(i.qty + 1, it.max || 10) } : i)) : [...s.items, { ...it, key, qty: 1 }];
    return { items, open: true };
  }),
  setQty: (key, qty) => set((s) => ({ items: qty < 1 ? s.items.filter((i) => i.key !== key) : s.items.map((i) => (i.key === key ? { ...i, qty: Math.min(qty, i.max || 10) } : i)) })),
  clear: () => set({ items: [] }),
  count: () => get().items.reduce((a, i) => a + i.qty, 0),
  subtotal: () => get().items.reduce((a, i) => a + i.qty * i.price, 0),
}), { name: 'wenzy-bag', partialize: (s) => ({ items: s.items }) }));
