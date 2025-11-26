import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import UserSettings from './pages/UserSettings';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Menu from './pages/Menu';
import Cart from './pages/Cart';
import OrderConfirmation from './pages/OrderConfirmation';
import Location from './pages/Location';
import AdminDashboard from './pages/AdminDashboard';
import KitchenDashboard from './pages/KitchenDashboard';
import './App.css';

// Replace this with your actual Google Client ID
// Get it from: https://console.cloud.google.com/apis/credentials
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID_HERE';

// Component to conditionally render Navigation
const Layout = ({ children, showNav = true }) => (
  <>
    {showNav && <Navigation />}
    {children}
  </>
);

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <CartProvider>
          <Router>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Home />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Public restaurant routes with navigation */}
              <Route path="/menu" element={<Layout><Menu /></Layout>} />
              <Route path="/cart" element={<Layout><Cart /></Layout>} />
              <Route path="/order-confirmation/:orderId" element={<Layout><OrderConfirmation /></Layout>} />
              <Route path="/location" element={<Layout><Location /></Layout>} />

              {/* Protected routes with navigation */}
              <Route
                path="/dashboard"
                element={
                  <Layout>
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  </Layout>
                }
              />
              <Route
                path="/settings"
                element={
                  <Layout>
                    <ProtectedRoute>
                      <UserSettings />
                    </ProtectedRoute>
                  </Layout>
                }
              />
              <Route
                path="/admin"
                element={
                  <Layout>
                    <ProtectedRoute>
                      <AdminDashboard />
                    </ProtectedRoute>
                  </Layout>
                }
              />
              <Route
                path="/kitchen"
                element={
                  <Layout showNav={false}>
                    <ProtectedRoute>
                      <KitchenDashboard />
                    </ProtectedRoute>
                  </Layout>
                }
              />
            </Routes>
          </Router>
        </CartProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
