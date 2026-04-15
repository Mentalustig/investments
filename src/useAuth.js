import { useState, useEffect } from "react";

export function useAuth() {
  const [user, setUser] = useState(undefined); // undefined = loading

  useEffect(() => {
    fetch("/api/auth?action=me")
      .then(r => r.json())
      .then(d => setUser(d.user || null))
      .catch(() => setUser(null));
  }, []);

  const login = () => { window.location.href = "/api/auth"; };

  const logout = () => {
    fetch("/api/auth?action=logout").then(() => setUser(null));
  };

  return { user, login, logout, loading: user === undefined };
}
