import { create } from 'zustand';

// Auth Store — JWT in HttpOnly cookie (not JS-accessible) for auth-service.
// _token is stored in-memory (not localStorage) for calling other microservices via Bearer header.
export const useAuthStore = create((set) => ({
  user: null,
  _token: null,        // in-memory Bearer token for book/order/payment services
  isChecking: false,  // frontend is a public storefront — don't block on auth check
  setUser: (user, token) => set({ user, _token: token || null, isChecking: false }),
  clearUser: () => set({ user: null, _token: null, isChecking: false }),
  login: (user, token) => set({ user, _token: token || null, isChecking: false }),
  logout: () => set({ user: null, _token: null, isChecking: false }),
}));

// Cart Store
export const useCartStore = create((set, get) => ({
  items: [],
  addItem: (book, quantity = 1) => {
    const { items } = get();
    const existing = items.find((i) => i.book.id === book.id);
    if (existing) {
      set({ items: items.map((i) => i.book.id === book.id ? { ...i, quantity: i.quantity + quantity } : i) });
    } else {
      set({ items: [...items, { book, quantity }] });
    }
  },
  removeItem: (bookId) => set({ items: get().items.filter((i) => i.book.id !== bookId) }),
  clearCart: () => set({ items: [] }),
  getCartTotal: () => get().items.reduce((total, item) => total + item.book.price * item.quantity, 0),
}));

// App Store
export const useAppStore = create((set) => ({
  books: [],
  setBooks: (books) => set({ books }),
  selectedAuthor: null,
  setSelectedAuthor: (author) => set({ selectedAuthor: author }),
}));
