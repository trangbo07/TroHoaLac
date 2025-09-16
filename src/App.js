import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import HomePage from './components/HomePage';
import SimpleNavbar from './components/SimpleNavbar';
import UserHomePage from './components/UserHomePage';
import OAuthCallback from './pages/OAuthCallback';
import Footer from './components/Footer';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import EmailConfirmationPage from './pages/EmailConfirmationPage';
import RoomsPage from './pages/RoomsPage';
import RoomDetailPage from './pages/RoomDetailPage';
import MyBookingsPage from './pages/MyBookingsPage';
import ManageRoomsPage from './pages/ManageRoomsPage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboard from './pages/AdminDashboard';
import './App.css';

function AppContent() {
  const location = useLocation();
  const hideNavbarPaths = ['/login', '/register', '/email-confirmation', '/user-home', '/'];
  const hideFooterPaths = ['/login', '/register', '/email-confirmation', '/user-home'];
  const shouldHideNavbar = hideNavbarPaths.includes(location.pathname);
  const shouldHideFooter = hideFooterPaths.includes(location.pathname);

  return (
    <div className="App">
      {!shouldHideNavbar && <SimpleNavbar />}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/email-confirmation" element={<EmailConfirmationPage />} />
        <Route path="/oauth/callback" element={<OAuthCallback />} />
        <Route path="/user-home" element={<UserHomePage onLogout={() => { localStorage.removeItem('access_token'); window.location.href = '/'; }} />} />
        <Route path="/rooms" element={<RoomsPage />} />
        <Route path="/room/:id" element={<RoomDetailPage />} />
        <Route path="/my-bookings" element={<MyBookingsPage />} />
        <Route path="/manage-rooms" element={<ManageRoomsPage />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        {/* Admin routes */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/rooms" element={<ManageRoomsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
      {!shouldHideFooter && <Footer />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;