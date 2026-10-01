import { Navigate, Outlet } from "react-router-dom";
import AppShell from "./shared/layout/AppShell";
import { useAuth } from "./shared/hooks/useAuth";

export default function App() {
  const { autenticado, cargando } = useAuth();

  if (cargando) return null;
  if (!autenticado) return <Navigate to="/" replace />;

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
