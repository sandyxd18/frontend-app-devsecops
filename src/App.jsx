import { BrowserRouter, Routes, Route } from 'react-router-dom';
import UserLayout from './layouts/UserLayout';
import HomePage from './pages/user/HomePage';
import LoginPage from './pages/user/LoginPage';
import CartPage from './pages/user/CartPage';
import PaymentPage from './pages/user/PaymentPage';
import CheckoutPage from './pages/user/CheckoutPage';
import SearchPage from './pages/user/SearchPage';
import RegisterPage from './pages/user/RegisterPage';
import ForgotPasswordPage from './pages/user/ForgotPasswordPage';
import OrdersPage from './pages/user/OrdersPage';
import BookDetailPage from './pages/user/BookDetailPage';
import AuthorPage from './pages/user/AuthorPage';
import ProfilePage from './pages/user/ProfilePage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Pages - standalone (no topbar) */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Main App with Layout */}
        <Route path="/" element={<UserLayout />}>
          <Route index element={<HomePage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="payment/:orderId" element={<PaymentPage />} />
          <Route path="book/:bookId" element={<BookDetailPage />} />
          <Route path="author/:authorName" element={<AuthorPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
