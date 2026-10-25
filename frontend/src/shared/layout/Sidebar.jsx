import { useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  User, LogOut, X,
} from "lucide-react";
import { useRole } from "../hooks/useRole";
import { useAuth } from "../hooks/useAuth";
import { NAV } from "./navegacion";

const LOGO_SRC = "/icono-app-color.png";

export default function Sidebar({ abierto = false, alCerrar = () => {} }) {
  const { role } = useRole();
  const { usuario, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const cerrarRef = useRef(null);

  const nombreMostrado =
    [usuario?.first_name, usuario?.last_name].filter(Boolean).join(" ") || usuario?.username || "";

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const visibleNav = NAV.filter((n) => n.roles.includes(role));

  const isActive = (path) => {
    if (path === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  useEffect(() => {
    alCerrar();
    // Solo al cambiar de ruta: abrir el menú no debe cerrarlo al instante.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  useEffect(() => {
    if (!abierto) return undefined;
    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cerrarRef.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") alCerrar();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previo;
      window.removeEventListener("keydown", onKey);
    };
  }, [abierto, alCerrar]);

  return (
    <>
      {abierto && (
        <button
          type="button"
          className="md:hidden fixed inset-0 z-40 bg-slate-900/40"
          aria-label="Cerrar menú"
          onClick={alCerrar}
        />
      )}
    <aside
      id="menu-lateral"
      className={`${abierto ? "flex" : "hidden"} md:flex fixed inset-y-0 left-0 z-50 w-[min(100%,18rem)] max-w-full flex-col bg-white border-r border-slate-200 shrink-0 md:static md:inset-auto md:z-auto md:w-60`}
    >
      <div className="px-4 py-3 md:py-4 border-b border-slate-100 flex items-center gap-2.5">
        <img
          src={LOGO_SRC}
          alt="FISC-vento"
          className="w-9 h-9 object-contain shrink-0"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-900 leading-tight">FISC-vento</p>
          <p className="text-xs text-slate-400 leading-tight">Facultad de Ing. de Sistemas Computacionales</p>
        </div>
        <button
          ref={cerrarRef}
          type="button"
          onClick={alCerrar}
          className="md:hidden min-w-11 min-h-11 inline-flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 shrink-0"
          aria-label="Cerrar menú"
        >
          <X size={20} />
        </button>
      </div>
      <nav className="flex-1 py-2 overflow-y-auto" aria-label="Secciones">
        {visibleNav.map((n) => {
          const Icon = n.icon;
          const active = isActive(n.path);
          return (
            <Link
              key={n.path}
              to={n.path}
              onClick={alCerrar}
              className={`w-full flex items-center gap-2.5 px-4 min-h-11 md:min-h-0 py-2.5 md:py-2 text-sm ${active ? "bg-fisc-50 text-fisc-800 font-medium border-r-2 border-fisc-800" : "text-slate-600 hover:bg-slate-50"}`}
            >
              <Icon size={16} /> {n.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-slate-100 space-y-3">
        {/* Card Rol activo (Informativo / según cuenta) */}
        <div className="bg-fisc-50 border border-fisc-100 rounded-2xl p-2.5 select-none">
          <p className="text-xs font-semibold text-slate-500 mb-1.5 px-1">Rol activo</p>
          <div className="bg-white rounded-xl px-3 py-2 flex items-center gap-2.5 shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-fisc-800 shrink-0"></span>
            <span className="text-sm font-bold text-slate-900 tracking-tight">{role}</span>
          </div>
        </div>

        {/* Perfil de usuario y cerrar sesión */}
        <div className="flex items-center justify-between px-1 pt-0.5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-full bg-fisc-800 flex items-center justify-center">
                <User size={20} className="text-white" />
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-fisc-300 border-2 border-white rounded-full"></span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 leading-tight truncate">{nombreMostrado}</p>
              <p className="text-xs font-medium text-slate-500 leading-tight truncate">{usuario?.email}</p>
              <p className="text-xs font-medium text-slate-500 leading-tight">FISC</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
            className="min-w-11 min-h-11 inline-flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
          >
            <LogOut size={19} />
          </button>
        </div>
      </div>
    </aside>
    </>
  );
}
