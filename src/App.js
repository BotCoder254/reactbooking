import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthContextProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/admin/Dashboard';
import UserProfile from './components/UserProfile';
import MyBookings from './pages/MyBookings';
import SavedFlights from './pages/SavedFlights';
import UserManagement from './components/admin/UserManagement';
import FlightManagement from './components/admin/FlightManagement';
import FlightDetails from './pages/FlightDetails';
import AllFlights from './pages/AllFlights';
import PaymentPage from './pages/PaymentPage';
import BookingManagement from './pages/admin/BookingManagement';
import BookingDetails from './pages/BookingDetails';
import AdminBookingDetails from './pages/admin/BookingDetails';
import PaymentSuccess from './pages/PaymentSuccess';

function App() {
  return (
    <Router>
      <AuthContextProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          {/* Protected User Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/flights"
            element={
              <ProtectedRoute>
                <AllFlights />
              </ProtectedRoute>
            }
          />
        
          <Route
            path="/flights/:id"
            element={
              <ProtectedRoute>
                <FlightDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bookings"
            element={
              <ProtectedRoute>
                <MyBookings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/saved"
            element={
              <ProtectedRoute>
                <SavedFlights />
              </ProtectedRoute>
            }
          />

          {/* Protected Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute requiredRole="admin">
                <UserManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/flights"
            element={
              <ProtectedRoute requiredRole="admin">
                <FlightManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Booking Routes */}
          <Route
            path="/bookings/:id/payment"
            element={
              <ProtectedRoute>
                <PaymentPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment-success/:id"
            element={
              <ProtectedRoute>
                <PaymentSuccess />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/bookings"
            element={
              <ProtectedRoute requiredRole="admin">
                <BookingManagement />
              </ProtectedRoute>
            }
          />

          {/* New Booking Routes */}
          <Route path="/bookings/:id" element={<BookingDetails />} />
          <Route path="/admin/bookings/:id" element={<AdminBookingDetails />} />
        </Routes>
      </AuthContextProvider>
    </Router>
  );
}

export default App;
