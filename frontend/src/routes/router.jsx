import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import DashboardPage from "../features/dashboard/DashboardPage";
import ActivosListPage from "../features/activos/ActivosListPage";
import PorEditarPage from "../features/activos/PorEditarPage";
import ActivoFormPage from "../features/activos/ActivoFormPage";
import ActivoDetailPage from "../features/activos/ActivoDetailPage";
import UbicacionesPage from "../features/ubicaciones/UbicacionesPage";
import EscaneoPage from "../features/escaneo/EscaneoPage";
import AuditoriaPage from "../features/auditoria/AuditoriaPage";
import UsuariosPage from "../features/administracion/UsuariosPage";
import PrestamosPage from "../features/prestamos/PrestamosPage";
import TrasladosPage from "../features/traslados/TrasladosPage";
import ReportesPage from "../features/reportes/ReportesPage";
import Login from "../features/login/Login";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
  },
  {
    path: "/dashboard",
    element: <App />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "activos", element: <ActivosListPage /> },
      { path: "por-editar", element: <PorEditarPage /> },
      { path: "activos/nuevo", element: <ActivoFormPage /> },
      { path: "activos/:id", element: <ActivoDetailPage /> },
      { path: "activos/:id/editar", element: <ActivoFormPage /> },
      { path: "ubicaciones", element: <UbicacionesPage /> },
      { path: "escaneo", element: <EscaneoPage /> },
      { path: "reportes", element: <ReportesPage /> },
      { path: "auditoria", element: <AuditoriaPage /> },
      { path: "administracion", element: <UsuariosPage /> },
      {
        // Carga diferida: la librería del QR solo se descarga al abrir esta pantalla.
        path: "dispositivos",
        lazy: async () => ({ Component: (await import("../features/administracion/DispositivosPage")).default }),
      },
      { path: "prestamos", element: <PrestamosPage /> },
      { path: "traslados", element: <TrasladosPage /> },
    ],
  },
]);
