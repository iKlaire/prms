import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Toast from "./components/feedback/Toast";
import Login from "./pages/Login";
import CrewDashboard from "./pages/CrewDashboard";
import PassengerDashboard from "./pages/PassengerDashboard";
import type { AuthState, ToastState } from "./types";

function getAuth(): AuthState | null {
  const raw = sessionStorage.getItem("auth");
  if (!raw) return null;

  try {
    const auth = JSON.parse(raw) as Partial<AuthState>;
    if (!auth.role || !auth.token || !auth.name) {
      return null;
    }

    return auth as AuthState;
  } catch {
    return null;
  }
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
  const [toast, setToast] = useState<ToastState | null>(null);

  return (
    <BrowserRouter>
      <Toast toast={toast} onClose={() => setToast(null)} />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/crew"
          element={
            <ProtectedRoute role="crew">
              <CrewDashboard onToast={setToast} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/passenger"
          element={
            <ProtectedRoute role="passenger">
              <PassengerDashboard onToast={setToast} />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
