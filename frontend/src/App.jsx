import { Navigate, Outlet } from "react-router-dom";
import AppShell from "./shared/layout/AppShell";
import { useAuth } from "./shared/hooks/useAuth";

export default function App() {
  const { autenticado, cargando, errorConexion, reintentar } = useAuth();

  if (cargando) return null;
  if (errorConexion) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6 max-w-sm text-center space-y-3">
          <p className="text-sm text-gray-800">No se pudo conectar con el servidor.</p>
          <p className="text-xs text-gray-500">Tu sesión sigue guardada. Revisa tu conexión e intenta de nuevo.</p>
          <button onClick={reintentar} className="bg-fisc-800 text-white text-sm px-3 py-2 rounded-lg hover:bg-fisc-900">Reintentar</button>
        </div>
      </div>
    );
  }
  if (!autenticado) return <Navigate to="/" replace />;

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
