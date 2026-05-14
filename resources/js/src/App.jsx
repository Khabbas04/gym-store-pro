import React from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useSearchParams } from 'react-router-dom';
import RequireAdmin from './components/RequireAdmin';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { LanguageProvider } from './context/LanguageContext';
import { ToastProvider } from './context/ToastContext';
import AdminLayout from './layout/AdminLayout';
import MainLayout from './layout/MainLayout';
import AdminPage from './pages/AdminPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';
import OrdersPage from './pages/OrdersPage';
import ProductPage from './pages/ProductPage';
import RegisterPage from './pages/RegisterPage';
import ShopPage from './pages/ShopPage';
import WishlistPage from './pages/WishlistPage';

export default function App() {
    return (
        <LanguageProvider>
            <AuthProvider>
                <ToastProvider>
                    <CartProvider>
                        <BrowserRouter>
                            <AppRoutes />
                        </BrowserRouter>
                    </CartProvider>
                </ToastProvider>
            </AuthProvider>
        </LanguageProvider>
    );
}

function AppRoutes() {
    const { user, logout } = useAuth();
    const location = useLocation();

    if (location.pathname === '/admin') {
        return <AdminRoute user={user} logout={logout} />;
    }

    return (
        <MainLayout user={user} onLogout={logout}>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/shop" element={<ShopPage />} />
                <Route path="/shop/:id" element={<ProductPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/wishlist" element={<WishlistPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </MainLayout>
    );
}

function AdminRoute({ user, logout }) {
    const [searchParams, setSearchParams] = useSearchParams();
    const section = searchParams.get('section') || 'overview';

    function onSectionChange(nextSection) {
        setSearchParams({ section: nextSection });
    }

    if (section && !['overview', 'orders', 'products', 'users', 'activity'].includes(section)) {
        return <Navigate to="/admin?section=overview" replace />;
    }

    return (
        <RequireAdmin>
            <AdminLayout user={user} onLogout={logout} section={section} onSectionChange={onSectionChange}>
                <AdminPage section={section} />
            </AdminLayout>
        </RequireAdmin>
    );
}
