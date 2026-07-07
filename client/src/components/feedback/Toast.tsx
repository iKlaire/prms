import { useEffect } from "react";
import type { ToastState } from "../../types";

interface ToastProps {
  toast: ToastState | null;
  onClose: () => void;
}

export default function Toast({ toast, onClose }: ToastProps) {
  useEffect(() => {
    if (!toast) return;

    const timeout = window.setTimeout(onClose, 4000);
    return () => window.clearTimeout(timeout);
  }, [toast, onClose]);

  if (!toast) return null;

  const colors =
    toast.type === "success"
      ? "border-emerald-700 bg-emerald-950 text-emerald-300"
      : "border-red-700 bg-red-950 text-red-300";

  return (
    <div
      className={`fixed right-4 top-4 z-50 max-w-sm rounded-lg border px-4 py-3 text-sm shadow-xl ${colors}`}
      role="status"
    >
      {toast.message}
    </div>
  );
}
