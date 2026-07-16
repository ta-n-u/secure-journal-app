import { Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Diary from './pages/Diary';
import Habits from './pages/Habits';
import './App.css';

function ProtectedRoute({ children }) {
  const { isLoggedIn, hasKey, ready } = useAuth();

  // Still restoring the session from sessionStorage on initial load --
  // don't redirect yet, or a valid refresh would flash to /login.
  if (!ready) return null;

  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (!hasKey) return <Navigate to="/login" replace />;

  return children;
}

function NavBar() {
  const { isLoggedIn, email, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isLoggedIn) return null;

  return (
    <nav className="navbar">
      <Link to="/diary">Diary</Link>
      <Link to="/habits">Habits</Link>
      <span className="nav-email">{email}</span>
      <button onClick={handleLogout}>Log Out</button>
    </nav>
  );
}

export default function App() {
  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/diary"
          element={
            <ProtectedRoute>
              <Diary />
            </ProtectedRoute>
          }
        />
        <Route
          path="/habits"
          element={
            <ProtectedRoute>
              <Habits />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/diary" replace />} />
      </Routes>
    </>
  );
}
