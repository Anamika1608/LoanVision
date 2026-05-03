import { Outlet, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-indigo-600">LoanVision AI</Link>
          <nav className="flex items-center gap-4">
            {!user && (
              <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">
                Login
              </Link>
            )}
            {user?.role === "admin" && (
              <Link to="/dashboard" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">
                Dashboard
              </Link>
            )}
            {user?.role === "user" && (
              <Link to="/my-applications" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">
                My Applications
              </Link>
            )}
            {user && (
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
              >
                Logout
              </button>
            )}
          </nav>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
