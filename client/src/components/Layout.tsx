import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isLanding = pathname === "/landing";

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-transparent">
      {!isLanding && (
        <header className="sticky top-0 z-20 border-b border-black/10 bg-white/85 backdrop-blur">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
            <Link to="/" className="text-lg font-semibold tracking-tight text-black sm:text-xl">LoanVision AI</Link>
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
      )}
      <main className={`mx-auto w-full px-4 sm:px-6 ${isLanding ? "max-w-6xl py-6" : "max-w-5xl py-5 sm:py-8"}`}>
        <Outlet />
      </main>
    </div>
  );
}
