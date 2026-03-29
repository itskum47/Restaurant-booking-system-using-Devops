import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import Landing from './pages/Landing';
import Chat from './pages/Chat';
import RestaurantDetail from './pages/RestaurantDetail';
import Confirmation from './pages/Confirmation';
import MyBookings from './pages/MyBookings';
import Auth from './pages/Auth';
import DashboardLayout from './pages/dashboard/DashboardLayout';
import Overview from './pages/dashboard/Overview';
import Bookings from './pages/dashboard/Bookings';
import MenuManager from './pages/dashboard/MenuManager';
import Analytics from './pages/dashboard/Analytics';
import Settings from './pages/dashboard/Settings';

function ProtectedRoute({ children, role }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/auth" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Navbar />
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Routes>
          {/* Customer */}
          <Route path="/" element={<div style={{ flex: 1, overflowY: 'auto' }}><Landing /></div>} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/restaurant/:id" element={<div style={{ flex: 1, overflowY: 'auto' }}><RestaurantDetail /></div>} />
          <Route path="/confirmation" element={<div style={{ flex: 1, overflowY: 'auto' }}><Confirmation /></div>} />
          <Route path="/bookings" element={<ProtectedRoute><div style={{ flex: 1, overflowY: 'auto' }}><MyBookings /></div></ProtectedRoute>} />
          <Route path="/auth" element={<div style={{ flex: 1, overflowY: 'auto' }}><Auth /></div>} />

          {/* Owner Dashboard */}
          <Route path="/dashboard" element={<ProtectedRoute role="owner"><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<Overview />} />
            <Route path="bookings" element={<Bookings />} />
            <Route path="menu" element={<MenuManager />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
