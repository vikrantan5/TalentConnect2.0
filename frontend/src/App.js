import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Import pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import SkillMarketplace from './pages/SkillMarketplace';
import TaskMarketplace from './pages/TaskMarketplace';
import Profile from './pages/Profile';
import Chatbot from './pages/Chatbot';
import AdminDashboard from './pages/AdminDashboard';
import SessionBooking from './pages/SessionBooking';
import Leaderboard from './pages/Leaderboard';
import Wallet from './pages/Wallet';
import SkillExchangeMarketplace from './pages/SkillExchangeMarketplace';
import RoadmapPlanner from './pages/RoadmapPlanner';
import Teams from './pages/Teams';
import WebSocketDebugger from './pages/WebSocketDebugger';
import Matches from './pages/Matches';
import Messages from './pages/Messages';
// Auth context
import { AuthProvider, useAuth } from './context/AuthContext';
// Socket context for real-time features
import { SocketProvider } from './context/SocketContext';

// Protected Route Component - redirects admin users to /admin
const ProtectedRoute = ({ children }) => {
 const { isAuthenticated, user, loading } = useAuth();
  
  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" />;
  
  // Admin users should only see the admin dashboard
  if (user?.role === 'admin') return <Navigate to="/admin" />;
  
  return children;
};

const AdminRoute = ({ children }) => {
 const { isAuthenticated, user, loading } = useAuth();
  
  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }
  
  return isAuthenticated && user?.role === 'admin' ? children : <Navigate to="/dashboard" />;
};

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/skills"
            element={
              <ProtectedRoute>
                <SkillMarketplace />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/tasks"
            element={
              <ProtectedRoute>
                <TaskMarketplace />
              </ProtectedRoute>
            }
          />
            <Route
            path="/exchange"
            element={
              <ProtectedRoute>
                <SkillExchangeMarketplace />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/chatbot"
            element={
              <ProtectedRoute>
                <Chatbot />
              </ProtectedRoute>
            }
          />
            <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/sessions"
            element={
              <ProtectedRoute>
                <SessionBooking />
              </ProtectedRoute>
            }
          />
             <Route
            path="/matches"
            element={
              <ProtectedRoute>
                <Matches />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/leaderboard"
            element={
              <ProtectedRoute>
                <Leaderboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wallet"
            element={
              <ProtectedRoute>
                <Wallet />
              </ProtectedRoute>
            }
          />
           <Route
            path="/roadmap"
            element={
              <ProtectedRoute>
                <RoadmapPlanner />
              </ProtectedRoute>
            }
          />
             <Route
            path="/teams"
            element={
              <ProtectedRoute>
                <Teams />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
