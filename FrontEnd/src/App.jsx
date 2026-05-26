/**
 * src/App.jsx — Root Application Component
 */
import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext, AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import SaaSLayout from './layouts/SaaSLayout';

// Pages to be created
import DashboardOverview from './pages/DashboardOverview';
import SubscriptionsPage from './pages/SubscriptionsPage';
import BudgetPage from './pages/BudgetPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f10]">
        <div className="animate-spin h-10 w-10 rounded-full border-4 border-[#222226] border-t-[#C5A85D]" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return children;
};

const App = () => (
  <AuthProvider>
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <SaaSLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardOverview />} />
          <Route path="subscriptions" element={<SubscriptionsPage />} />
          <Route path="budget" element={<BudgetPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  </AuthProvider>
);

export default App;
