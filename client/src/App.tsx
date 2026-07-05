import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import CrewDashboard from "./pages/CrewDashboard";
import PassengerDashboard from "./pages/PassengerDashboard";
import type { AuthState } from "./types";

function getAuth(): AuthState | null {
  const raw = sessionStorage.getItem("auth");
  return raw ? JSON.parse(raw) : null;
}

function ProtectedRoute({
  children,
  role,
}: {
  children: React.ReactNode;
  role: "crew" | "passenger";
}) {
  const auth = getAuth();
  if (!auth) return <Navigate to="/" replace />;
  if (auth.role !== role) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/crew"
          element={
            <ProtectedRoute role="crew">
              <CrewDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/passenger"
          element={
            <ProtectedRoute role="passenger">
              <PassengerDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
