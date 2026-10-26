import { Link, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import { useRole } from "../hooks/useRole";
import { NAV } from "./navegacion";

const ATAJOS = ["/dashboard", "/dashboard/activos", "/dashboard/escaneo"];
const ETIQUETA_CORTA = {
  "/dashboard": "Panel",
  "/dashboard/activos": "Activos",
  "/dashboard/escaneo": "Escaneo",
};

function activo(path, pathname) {
  if (path === "/dashboard") return pathname === "/dashboard";
  return pathname === path || pathname.startsWith(`${path}/`);
}

export default function BarraMovil({ menuAbierto, alAbrirMenu }) {
  const { role } = useRole();
  const { pathname } = useLocation();
  const atajos = NAV.filter((n) => ATAJOS.includes(n.path) && n.roles.includes(role));

  return (
    <nav
      className="md:hidden fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)]"
      aria-label="Navegación principal"
    >
      <div className="grid grid-cols-4">
        {atajos.map((n) => {
          const Icon = n.icon;
          const esActivo = activo(n.path, pathname);
          return (
            <Link
              key={n.path}
              to={n.path}
              aria-current={esActivo ? "page" : undefined}
              className={`flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-medium ${esActivo ? "text-fisc-800" : "text-slate-500"}`}
            >
              <Icon size={20} />
              {ETIQUETA_CORTA[n.path] ?? n.label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={alAbrirMenu}
          aria-expanded={menuAbierto}
          aria-controls="menu-lateral"
          className={`flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-medium ${menuAbierto ? "text-fisc-800" : "text-slate-500"}`}
        >
          <Menu size={20} />
          Menú
        </button>
      </div>
    </nav>
  );
}
