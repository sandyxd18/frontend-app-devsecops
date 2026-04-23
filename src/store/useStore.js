import { create } from 'zustand';

// Auth Store (In-Memory as requested, no localStorage)
export const useAuthStore = create((set) => ({
  token: null,
  user: null,
  login: (token, user) => set({ token, user }),
  logout: () => set({ token: null, user: null }),
}));

// Cart Store
export const useCartStore = create((set, get) => ({
  items: [],
  addItem: (book, quantity = 1) => {
    const { items } = get();
    const existing = items.find((i) => i.book.id === book.id);
    if (existing) {
      set({
        items: items.map((i) =>
          i.book.id === book.id ? { ...i, quantity: i.quantity + quantity } : i
        ),
      });
    } else {
      set({ items: [...items, { book, quantity }] });
    }
  },
  removeItem: (bookId) => {
    set({ items: get().items.filter((i) => i.book.id !== bookId) });
  },
  clearCart: () => set({ items: [] }),
  getCartTotal: () => {
    return get().items.reduce((total, item) => total + item.book.price * item.quantity, 0);
  },
}));

// App Store
export const useAppStore = create((set) => ({
  books: [],
  setBooks: (books) => set({ books }),
  selectedAuthor: null,
  setSelectedAuthor: (author) => set({ selectedAuthor: author }),
}));
