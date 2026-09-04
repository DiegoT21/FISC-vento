import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import DashboardPage from "../features/dashboard/DashboardPage";
import ActivosListPage from "../features/activos/ActivosListPage";
import ActivoDetailPage from "../features/activos/ActivoDetailPage";
import UbicacionesPage from "../features/ubicaciones/UbicacionesPage";
import EscaneoPage from "../features/escaneo/EscaneoPage";
import AuditoriaPage from "../features/auditoria/AuditoriaPage";
import UsuariosPage from "../features/administracion/UsuariosPage";
import PrestamosPage from "../features/prestamos/PrestamosPage";
import TrasladosPage from "../features/traslados/TrasladosPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "activos", element: <ActivosListPage /> },
      { path: "activos/:id", element: <ActivoDetailPage /> },
      { path: "ubicaciones", element: <UbicacionesPage /> },
      { path: "escaneo", element: <EscaneoPage /> },
      { path: "auditoria", element: <AuditoriaPage /> },
      { path: "administracion", element: <UsuariosPage /> },
      { path: "prestamos", element: <PrestamosPage /> },
      { path: "traslados", element: <TrasladosPage /> },
    ],
  },
]);
