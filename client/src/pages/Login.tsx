import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import Button from "../components/ui/Button";
import type { UserRole } from "../types";

export default function Login() {
  const navigate = useNavigate();
  const [role, setRole] = useState<UserRole>("passenger");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    if (!name || !password) {
      setError("Name and password required");
      return;
    }
    setLoading(true);
    try {
      const endpoint =
        role === "crew" ? "/auth/crew/login" : "/auth/passenger/login";
      const res = await api.post(endpoint, { name, password });
      const user = role === "crew" ? res.data.crewLead : res.data.passenger;
      sessionStorage.setItem(
        "auth",
        JSON.stringify({ role, token: res.data.token, name: user.name }),
      );
      navigate(role === "crew" ? "/crew" : "/passenger");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 w-full max-w-md shadow-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🚀</div>
          <h1 className="text-2xl font-bold text-white">Spaceship X26</h1>
          <p className="text-gray-400 text-sm mt-1">
            Passenger Resource Management System
          </p>
        </div>

        {/* Role Toggle */}
        <div className="flex rounded-lg overflow-hidden border border-gray-700 mb-6">
          {(["passenger", "crew"] as UserRole[]).map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                role === r
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:text-white"
              }`}
            >
              {r === "crew" ? "Crew Lead" : "Passenger"}
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <Button onClick={handleLogin} disabled={loading} size="lg" fullWidth>
            {loading ? "Logging in..." : "Board Mission"}
          </Button>
        </div>
      </div>
    </div>
  );
}
