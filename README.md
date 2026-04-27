# 📚 Bookstore Frontend

A modern, high-performance customer-facing e-commerce storefront for the Bookstore microservices ecosystem. Built with **React**, **Vite**, and **Axios**, featuring a premium responsive design and a smooth shopping experience.

---

## ✨ Features

- **🏠 Interactive Home**: Dynamic hero section and paginated book catalog.
- **🔍 Advanced Search**: Real-time search functionality with filtering.
- **📖 Book Detail & Authors**: Comprehensive book information and dedicated author pages.
- **🛒 Shopping Cart & Checkout**: Seamless cart management and multi-step checkout flow.
- **💳 Payment Simulation**: Integrated QR-based payment simulation with real-time status updates.
- **📜 Order History**: Detailed view of past orders with status tracking.
- **👤 User Profile**: Account management including security controls and recovery key setup.
- **🔐 Robust Auth**: Complete authentication suite (Login, Register, Forgot Password) with secure session handling.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | React 18 |
| **Build Tool** | Vite |
| **Routing** | React Router v6 |
| **Styling** | Vanilla CSS (Premium Modern Design) |
| **Icons** | Material Symbols & Custom SVG |
| **API Client** | Axios |
| **Deployment** | Docker |

---

## 📂 Project Structure

```
frontend/
├── src/
│   ├── components/       # Reusable UI components (Nav, Footer, Cards)
│   ├── layouts/          # UserLayout for global framing
│   ├── pages/user/       # All customer-facing pages
│   ├── services/         # Axios API clients for each microservice
│   ├── store/            # State management (useAuthStore)
│   ├── App.jsx           # Main routing and entry point
│   └── index.css         # Global design system and tokens
├── public/               # Static assets (Favicons, Icons)
├── .env.example          # Environment variable template
└── Dockerfile            # Multi-stage production build
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18
- Microservices ecosystem running (Auth, Book, Order, Payment, Blockchain)

### 1. Installation

```bash
cd frontend
npm install
```

### 2. Configuration

Create a `.env` file in the root directory:

```env
VITE_AUTH_API_URL=http://localhost:3000
VITE_BOOK_API_URL=http://localhost:3001
VITE_ORDER_API_URL=http://localhost:3002
VITE_PAYMENT_API_URL=http://localhost:3003
VITE_BLOCKCHAIN_API_URL=http://localhost:3004
```

### 3. Development

```bash
npm run dev
```

### 4. Build & Production

```bash
npm run build
# Served via Nginx in production container
```

---

## 🛍️ Shopping Flow

1. **Discover**: Browse the home page or search for specific titles.
2. **Details**: View book details and author collections.
3. **Cart**: Add books to the shopping cart.
4. **Checkout**: Provide order details and finalize.
5. **Payment**: Generate a payment QR and confirm.
6. **Track**: Monitor order status in the profile's order list.

---

## 🎨 Aesthetic & UX

- **Responsive Design**: Fully optimized for mobile, tablet, and desktop.
- **Premium Styling**: Custom CSS animations, smooth gradients, and glassmorphism.
- **Visual Feedback**: Loading skeletons, success/error notifications, and interactive buttons.
- **SEO Ready**: Dynamic document titles and semantic HTML5 structure.

---

## 🛡️ Security & Auth

- **HttpOnly Cookies**: Session tokens are handled securely to prevent XSS.
- **Bearer Priority**: API calls prioritize the Authorization header from the in-memory store.
- **Protected Routes**: Order, Payment, and Profile pages are gated behind authentication.
- **Input Validation**: Frontend-side validation using tailored logic to match backend Zod schemas.
