import { BrowserRouter, Routes, Route } from 'react-router-dom';
import UserLayout from './layouts/UserLayout';
import HomePage from './pages/user/HomePage';
import LoginPage from './pages/user/LoginPage';
import CartPage from './pages/user/CartPage';
import PaymentPage from './pages/user/PaymentPage';
import RegisterPage from './pages/user/RegisterPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* User Routes */}
        <Route path="/" element={<UserLayout />}>
          <Route index element={<HomePage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="payment/:orderId" element={<PaymentPage />} />
        </Route>
      </Routes>
    </BrowserRouter>

  );
}

export default App;
