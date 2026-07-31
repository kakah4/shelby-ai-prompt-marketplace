import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

const ToastContext = createContext<(msg: string) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState("");

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div
        style={{
          position: "fixed",
          bottom: 28,
          right: 28,
          zIndex: 400,
          background: "var(--text)",
          color: "#fff",
          fontSize: 13,
          fontWeight: 600,
          padding: "13px 22px",
          borderRadius: 12,
          transition: "all 0.38s cubic-bezier(0.34,1.56,0.64,1)",
          pointerEvents: "none",
          opacity: toast ? 1 : 0,
          transform: toast ? "translateY(0)" : "translateY(80px)",
          maxWidth: 400,
        }}
      >
        {toast}
      </div>
    </ToastContext.Provider>
  );
}
