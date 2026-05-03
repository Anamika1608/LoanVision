import { Outlet, useLocation } from "react-router-dom";

export default function Layout() {
  const { pathname } = useLocation();
  const isLanding = pathname === "/landing";

  return (
    <div className="min-h-screen bg-transparent">
      {!isLanding && (
        <header className="sticky top-0 z-20 border-b border-black/10 bg-white/85 backdrop-blur">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
            <h1 className="text-lg font-semibold tracking-tight text-black sm:text-xl">LoanVision AI</h1>
          </div>
        </header>
      )}
      <main className={`mx-auto w-full px-4 sm:px-6 ${isLanding ? "max-w-6xl py-6" : "max-w-5xl py-5 sm:py-8"}`}>
        <Outlet />
      </main>
    </div>
  );
}
